/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserVehicleView';
const rootTableName = 'AppUserVehicle';
const primaryKeyField = 'appUserVehicleId';

async function createAppUserVehicleView() {
  const StationTable = 'Stations';

  let fields = [
    `${rootTableName}.appUserVehicleId`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.vehicleIdentity`,
    `${rootTableName}.vehiclePlateColor`,
    `${rootTableName}.vehicleRegistrationCode`,
    `${rootTableName}.vehicleType`,
    `${rootTableName}.vehicleBrandName`,
    `${rootTableName}.vehicleBrandModel`,
    `${rootTableName}.vehicleRegistrationImageUrl`,
    `${rootTableName}.vehicleExpiryDate`,
    `${rootTableName}.certificateSeries`,

    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,

    `${StationTable}.stationsName`,
    `${StationTable}.stationUrl`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationTable, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationTable}.stationsId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createAppUserVehicleView();
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}
async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}
function _makeQueryBuilderByFilter(filter, skip, limit, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('vehicleIdentity', 'like', `%${searchText}%`);
      this.orWhere('vehicleRegistrationCode', 'like', `%${searchText}%`);
    });
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
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, order);
  return await query.select();
}
async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText);
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
  count,
  updateById,
  initViews,
  updateAll,
  findById,
  customSearch,
  customCount,
};
