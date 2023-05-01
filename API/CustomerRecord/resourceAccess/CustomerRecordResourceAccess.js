/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');

const { CHECKING_STATUS } = require('../CustomerRecordConstants');
const { MESSAGE_CATEGORY } = require('../../CustomerMessage/CustomerMessageConstant');
const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'CustomerRecord';
const primaryKeyField = 'customerRecordId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('customerRecordId').primary();
          table.string('customerRecordFullName').defaultTo('');
          table.integer('customerRecordState').defaultTo(0);
          table.string('customerRecordEmail').defaultTo('');
          table.string('customerRecordPhone').defaultTo('');
          table.string('customerRecordPlatenumber');
          table.string('customerRecordPlateColor').defaultTo('white');
          table.string('customerRecordPlateImageUrl').defaultTo('');
          table.string('customerRecordCheckDate').defaultTo('');
          table.string('customerRecordCheckTime').nullable();
          table.integer('serialNumber').defaultTo(1);
          table.string('serialSortValue');
          table.string('customerRecordCheckStatus').defaultTo(CHECKING_STATUS.NEW);
          table.timestamp('customerRecordProcessCheckDate').defaultTo(DB.fn.now());
          table.string('customerRecordCheckExpiredDate').defaultTo('');
          table.integer('customerRecordCheckDuration').nullable();
          table.integer('customerRecordCheckStepDuration').nullable();
          table.timestamp('customerRecordModifyDate').nullable();
          table.timestamp('customerRecordEmailNotifyDate').nullable();
          table.timestamp('customerRecordSMSNotifyDate').nullable();
          table.integer('customerStationId');
          table.integer('staffId');
          table.integer('returnNumberCount').defaultTo(0);
          table.integer('appUserId');
          table.integer('appUserVehicleId');
          table.integer('customerScheduleId');
          timestamps(table);
          table.index('customerRecordFullName');
          table.index('customerRecordState');
          table.index('customerRecordEmail');
          table.index('customerRecordPhone');
          table.index('customerRecordPlateColor');
          table.index('customerRecordPlatenumber');
          table.index('returnNumberCount');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          resolve();
        });
    });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function deleteById(customerRecordID) {
  let dataId = {};
  dataId[primaryKeyField] = customerRecordID;
  return await Common.deleteById(tableName, dataId);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function findDeletedRecord(skip, limit) {
  const queryBuilder = DB(tableName);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 1 });

  return new Promise((resole, reject) => {
    try {
      queryBuilder.select().then(records => {
        resole(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _getStartDate(date) {
  let _startDay = new Date(date);
  _startDay.setHours(0);
  _startDay.setMinutes(0);
  _startDay.setSeconds(1);
  return _startDay.toISOString();
}

function _getEndDate(date) {
  let _endDay = new Date(date);
  _endDay.setHours(23);
  _endDay.setMinutes(59);
  _endDay.setSeconds(59);
  return _endDay.toISOString();
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('customerRecordFullName', 'like', `%${searchText}%`)
        .orWhere('customerRecordEmail', 'like', `%${searchText}%`)
        .orWhere('customerRecordPhone', 'like', `%${searchText}%`)
        .orWhere('customerRecordPlatenumber', 'like', `%${searchText}%`);
    });
  } else {
    if (filterData.customerRecordFullName) {
      queryBuilder.where('customerRecordFullName', 'like', `%${filterData.customerRecordFullName}%`);
      delete filterData.customerRecordFullName;
    }

    if (filterData.customerRecordEmail) {
      queryBuilder.where('customerRecordEmail', 'like', `%${filterData.customerRecordEmail}%`);
      delete filterData.customerRecordEmail;
    }

    if (filterData.customerRecordPhone) {
      queryBuilder.where('customerRecordPhone', 'like', `%${filterData.customerRecordPhone}%`);
      delete filterData.customerRecordPhone;
    }

    if (filterData.customerRecordPlatenumber) {
      queryBuilder.where('customerRecordPlatenumber', 'like', `%${filterData.customerRecordPlatenumber}%`);
      delete filterData.customerRecordPlatenumber;
    }
  }

  if (startDate) {
    queryBuilder.where('customerRecordCheckDate', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('customerRecordCheckDate', '<=', endDate);
  }

  if (filterData.customerMessageCategory) {
    switch (filterData.customerMessageCategory.toLowerCase()) {
      case MESSAGE_CATEGORY.SMS.toLowerCase():
        queryBuilder.whereNotNull('customerRecordSMSNotifyDate');
        break;
      case MESSAGE_CATEGORY.EMAIL.toLowerCase():
        queryBuilder.whereNotNull('customerRecordEmailNotifyDate');
        break;
      default:
        if (filterData.customerMessageSentDate) {
          let _startDay = _getStartDate(filterData.customerMessageSentDate);

          let _endDay = _getEndDate(filterData.customerMessageSentDate);
          queryBuilder
            .whereBetween('customerRecordSMSNotifyDate', [_startDay, _endDay])
            .orWhereBetween('customerRecordEmailNotifyDate', [_startDay, _endDay]);
          break;
        }
        if (filterData.customerMessageCategory.toLowerCase() === 'all') {
          queryBuilder.whereNotNull('customerRecordEmailNotifyDate').orWhereNotNull('customerRecordSMSNotifyDate');
        }
        break;
    }
    delete filterData.customerMessageCategory;
    delete filterData.customerMessageSentDate;
  }

  if (filterData.customerRecordEmailNotifyDate) {
    let _startDay = new Date(filterData.customerRecordEmailNotifyDate);
    _startDay.setHours(0);
    _startDay.setMinutes(0);
    _startDay.setSeconds(1);

    let _endDay = new Date(filterData.customerRecordEmailNotifyDate);
    _endDay.setHours(23);
    _endDay.setMinutes(59);
    _endDay.setSeconds(59);

    queryBuilder.where('customerRecordEmailNotifyDate', '>=', _startDay.toISOString());
    queryBuilder.where('customerRecordEmailNotifyDate', '<=', _endDay.toISOString());
  }

  if (filterData.customerRecordSMSNotifyDate) {
    let _startDay = new Date(filterData.customerRecordSMSNotifyDate);
    _startDay.setHours(0);
    _startDay.setMinutes(0);
    _startDay.setSeconds(1);

    let _endDay = new Date(filterData.customerRecordSMSNotifyDate);
    _endDay.setHours(23);
    _endDay.setMinutes(59);
    _endDay.setSeconds(59);

    queryBuilder.where('customerRecordSMSNotifyDate', '>=', _startDay.toISOString());
    queryBuilder.where('customerRecordSMSNotifyDate', '<=', _endDay.toISOString());
  }

  if (filterData.returnNumberCount) {
    queryBuilder.where('returnNumberCount', '>=', filterData.returnNumberCount);
  }
  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}
function _makeQueryBuilderByFilterByExpiredDate(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('customerRecordFullName', 'like', `%${searchText}%`)
        .orWhere('customerRecordEmail', 'like', `%${searchText}%`)
        .orWhere('customerRecordPhone', 'like', `%${searchText}%`)
        .orWhere('customerRecordPlatenumber', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('customerRecordCheckExpiredDate', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('customerRecordCheckExpiredDate', '<=', endDate);
  }
  if (filterData.returnNumberCount) {
    queryBuilder.where('returnNumberCount', '>=', filterData.returnNumberCount);
    delete filterData.returnNumberCount;
  }

  if (filterData.customerMessageCategory) {
    switch (filterData.customerMessageCategory.toLowerCase()) {
      case MESSAGE_CATEGORY.SMS.toLowerCase():
        queryBuilder.whereNotNull('customerRecordSMSNotifyDate');
        break;
      case MESSAGE_CATEGORY.EMAIL.toLowerCase():
        queryBuilder.whereNotNull('customerRecordEmailNotifyDate');
        break;
      default:
        if (filterData.customerMessageSentDate) {
          let _startDay = _getStartDate(filterData.customerMessageSentDate);

          let _endDay = _getEndDate(filterData.customerMessageSentDate);
          queryBuilder
            .whereBetween('customerRecordSMSNotifyDate', [_startDay, _endDay])
            .orWhereBetween('customerRecordEmailNotifyDate', [_startDay, _endDay]);
          break;
        }
        if (filterData.customerMessageCategory.toLowerCase() === 'all') {
          queryBuilder.whereNotNull('customerRecordEmailNotifyDate').orWhereNotNull('customerRecordSMSNotifyDate');
        }
        break;
    }
    delete filterData.customerMessageCategory;
    delete filterData.customerMessageSentDate;
  }

  if (filterData.customerRecordEmailNotifyDate) {
    let _startDay = new Date(filterData.customerRecordEmailNotifyDate);
    _startDay.setHours(0);
    _startDay.setMinutes(0);
    _startDay.setSeconds(1);

    let _endDay = new Date(filterData.customerRecordEmailNotifyDate);
    _endDay.setHours(23);
    _endDay.setMinutes(59);
    _endDay.setSeconds(59);

    queryBuilder.where('customerRecordEmailNotifyDate', '>=', _startDay.toISOString());
    queryBuilder.where('customerRecordEmailNotifyDate', '<=', _endDay.toISOString());

    delete filterData.customerRecordEmailNotifyDate;
  }

  if (filterData.customerRecordSMSNotifyDate) {
    let _startDay = new Date(filterData.customerRecordSMSNotifyDate);
    _startDay.setHours(0);
    _startDay.setMinutes(0);
    _startDay.setSeconds(1);

    let _endDay = new Date(filterData.customerRecordSMSNotifyDate);
    _endDay.setHours(23);
    _endDay.setMinutes(59);
    _endDay.setSeconds(59);

    queryBuilder.where('customerRecordSMSNotifyDate', '>=', _startDay.toISOString());
    queryBuilder.where('customerRecordSMSNotifyDate', '<=', _endDay.toISOString());

    delete filterData.customerRecordSMSNotifyDate;
  }

  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}
async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  if (startDate) {
    let momentVal = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toISOString();
    momentVal = momentVal.split('T');
    momentVal[1] = '00:00:01.000Z';
    startDate = momentVal.join('T');
  }
  if (endDate) {
    let momentVal = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toISOString();
    momentVal = momentVal.split('T');
    momentVal[1] = '23:59:59.000Z';
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toISOString();
  }

  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function customSearchByExpiredDate(filter, skip, limit, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

  let query = _makeQueryBuilderByFilterByExpiredDate(filter, skip, limit, startDate, endDate, searchText, order);

  return await query.select();
}

async function customCountByExpiredDate(filter, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

  let query = _makeQueryBuilderByFilterByExpiredDate(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function findRecordByProcessCheckDate(filter, startDate, endDate) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    queryBuilder.where('customerRecordProcessCheckDate', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('customerRecordProcessCheckDate', '<=', endDate);
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);

  return await queryBuilder.select();
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

async function permanentlyDelete(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.permanentlyDelete(tableName, dataId);
}

module.exports = {
  insert,
  find,
  findDeletedRecord,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  primaryKeyField,
  customSearch,
  customCount,
  customSearchByExpiredDate,
  customCountByExpiredDate,
  deleteById,
  findRecordByProcessCheckDate,
  updateAll,
  permanentlyDelete,
};
