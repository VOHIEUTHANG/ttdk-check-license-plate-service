/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'MessageCustomerView';
const rootTableName = 'MessageCustomer';
const primaryKeyField = 'messageCustomerId';
const moment = require('moment');

async function createRoleStaffView() {
  const CustomerMessageTable = 'CustomerMessage';

  let fields = [
    `${rootTableName}.messageCustomerId`,
    `${rootTableName}.customerId`,
    `${rootTableName}.messageId`,
    `${rootTableName}.customerScheduleId`,
    `${rootTableName}.customerRecordId`,
    `${rootTableName}.appUserVehicleId`,
    `${rootTableName}.customerStationId`,
    `${rootTableName}.messageSendStatus`,
    `${rootTableName}.messageSendDate`,
    `${rootTableName}.customerMessagePhone`,
    `${rootTableName}.customerMessageEmail`,
    `${rootTableName}.customerMessagePlateNumber`,
    `${rootTableName}.externalResult`,
    `${rootTableName}.externalStatus`,
    `${rootTableName}.externalProvider`,
    `${rootTableName}.externalInfo`,
    `${rootTableName}.externalReceiveDate`,
    `${rootTableName}.messageContent`,
    `${rootTableName}.messageTitle`,
    `${rootTableName}.customerReceiveDate`,
    `${rootTableName}.messageNote`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,

    `${CustomerMessageTable}.customerMessageCategories`,
    `${CustomerMessageTable}.customerMessageContent`,
    `${CustomerMessageTable}.customerMessageTitle`,
    `${CustomerMessageTable}.customerMessageTemplateId`,
    'Stations.stationsName',
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(CustomerMessageTable, function () {
      this.on(`${rootTableName}.messageId`, '=', `${CustomerMessageTable}.customerMessageId`);
    })
    .leftJoin('Stations', function () {
      this.on(`${CustomerMessageTable}.customerStationId`, '=', 'Stations.stationsId');
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createRoleStaffView();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  return await Common.updateById(tableName, { userId: id }, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('customerMessageContent', 'like', `%${searchText}%`)
        .orWhere('customerMessagePhone', 'like', `%${searchText}%`)
        .orWhere('externalProvider', 'like', `%${searchText}%`)
        .orWhere('stationsName', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('messageSendDate', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('messageSendDate', '<=', endDate);
  }

  queryBuilder.where({ isDeleted: 0 });

  queryBuilder.where(filterData);

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
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}
async function customCount(filter, startDate, endDate, searchText, order) {
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

async function customCountDistinct(fieldDistinct, filter, startDate, endDate, searchText) {
  //override orderBy of default query
  let order = {
    key: `${fieldDistinct}`,
    value: 'asc',
  };
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).select(`${fieldDistinct}`).groupBy(`${fieldDistinct}`);
      console.log(query.toString());
      query.then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  updateAll,
  findById,
  customSearch,
  customCount,
  customCountDistinct,
};
