/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');
const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const { CUSTOMER_RECEIPT_STATUS } = require('../CustomerReceiptConstant');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'CustomerReceipt';
const primaryKeyField = 'customerReceiptId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('customerReceiptName');
          table.string('customerReceiptEmail');
          table.string('customerReceiptPhone');
          table.float('customerReceiptAmount', 48, 24).defaultTo(0);
          table.string('customerReceiptContent').defaultTo('');
          table.string('customerReceiptStatus').defaultTo(CUSTOMER_RECEIPT_STATUS.NEW);
          table.string('paymentMethod');
          table.string('paymentApproveDate').defaultTo('');
          table.string('customerReceiptNote').defaultTo('');
          table.float('fee', 48, 24);
          table.float('total', 48, 24);
          table.string('customerReceiptExternalRef'); // vnpay
          table.integer('customerReceiptInternalRef'); // schedule id
          table.string('vnpayResult');
          table.integer('appUserId');
          timestamps(table);
          table.index('customerReceiptName');
          table.index('customerReceiptAmount');
          table.index('customerReceiptStatus');
          table.index('customerReceiptPhone');
          table.index('customerReceiptEmail');
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

async function deleteById(customerScheduleId) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleId;
  return await Common.deleteById(tableName, dataId);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('customerReceiptName', 'like', `%${searchText}%`).orWhere('customerReceiptPhone', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
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

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  deleteById,
};
