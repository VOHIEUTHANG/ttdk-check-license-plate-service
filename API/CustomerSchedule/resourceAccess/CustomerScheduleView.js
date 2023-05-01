/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'CustomerScheduleView';
const rootTableName = 'CustomerSchedule';
const primaryKeyField = 'customerScheduleId';
const moment = require('moment');

async function createRoleStaffView() {
  const StationsTable = 'Stations';

  let fields = [
    `${rootTableName}.customerScheduleId`,
    `${rootTableName}.licensePlates`,
    `${rootTableName}.phone`,
    `${rootTableName}.fullnameSchedule`,
    `${rootTableName}.email`,
    `${rootTableName}.dateSchedule`,
    `${rootTableName}.time`,
    `${rootTableName}.notificationMethod`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.CustomerScheduleStatus`,
    `${rootTableName}.vehicleType`,
    `${rootTableName}.licensePlateColor`,
    `${rootTableName}.scheduleSerial`,
    `${rootTableName}.scheduleCode`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.scheduleNote`,
    `${rootTableName}.customerRecordId`,
    `${rootTableName}.customerReviewId`,
    `${rootTableName}.scheduleType`,
    `${rootTableName}.createdBy`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,

    `${StationsTable}.stationsName`,
    `${StationsTable}.stationCode`,
    `${StationsTable}.stationsHotline`,
    `${StationsTable}.stationsEmail`,
    `${StationsTable}.stationsAddress`,
    `${StationsTable}.stationArea`,
    `${StationsTable}.stationStatus`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationsTable, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationsTable}.stationsId`);
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
      this.orWhere('licensePlates', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`)
        .orWhere('phone', 'like', `%${searchText}%`)
        .orWhere('fullnameSchedule', 'like', `%${searchText}%`)
        .orWhere('scheduleSerial', 'like', `%${searchText}%`)
        .orWhere('scheduleCode', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  Common.filterHandler(filterData, queryBuilder);

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
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
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
