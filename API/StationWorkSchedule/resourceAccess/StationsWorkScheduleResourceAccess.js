/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationWorkSchedule';
const primaryKeyField = 'stationWorkScheduleId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('stationsId');
          table.string('scheduleDayOff');
          table.string('scheduleTime', 2000);
          table.string('scheduleDate'); // save date time format to query
          table.integer('enableSmallCar').defaultTo(1);
          table.integer('enableRoMooc').defaultTo(1);
          table.integer('enableOtherVehicle').defaultTo(1);
          timestamps(table);
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

function _makeQueryBuilderByFilter(filter, startDate, endDate) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    queryBuilder.where('scheduleDate', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('scheduleDate', '<=', endDate);
  }

  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  return queryBuilder;
}

async function customSearch(filter, startDate, endDate) {
  let query = _makeQueryBuilderByFilter(filter, startDate, endDate);
  return await query.select();
}
async function customCount(filter, startDate, endDate) {
  let query = _makeQueryBuilderByFilter(filter, startDate, endDate);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)}`);
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
  deleteById,
  initDB,
  customSearch,
  customCount,
};
