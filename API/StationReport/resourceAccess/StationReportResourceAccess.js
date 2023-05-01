/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationReport';
const primaryKeyField = 'stationReportId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('stationId').nullable();
          table.string('reportDay'); //Ngày báo cáo (YYYY/MM/DD)
          table.string('totalCustomerSchedule'); //Tổng SL lịch hẹn
          table.integer('totalCustomerScheduleClosed').default(0); //Tổng SL lịch hẹn hoàn tất
          table.integer('totalCustomerScheduleCanceled').default(0); //Tổng SL lịch hẹn bị hủy
          table.integer('totalCustomerChecking').default(0); //Tổng lượt khám xe
          table.integer('totalCustomerCheckingCompleted').default(0); //Tổng lượt khám xe hoàn tất
          table.integer('totalCustomerCheckingFailed').default(0); //Tổng lượt khám xe thất bại
          table.integer('totalCustomerCheckingCanceled').default(0); //Tổng lượt khám xe bị hủy
          timestamps(table);
          table.index('stationId');
          table.index('reportDay');
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function findOne(filter) {
  return await Common.findOne(tableName, filter);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
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
  findOne,
  count,
  updateById,
  deleteById,
  initDB,
  customSearch,
  customCount,
};
