/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppDevicesView';
const rootTableName = 'AppDevices';
const primaryKeyField = 'appDeviceId';

async function createAppDevicesView() {
  const StationTable = 'Stations';

  let fields = [
    `${rootTableName}.deviceStatus`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.appDeviceId`,
    `${rootTableName}.deviceMacAddress`,
    `${rootTableName}.deviceMachineHostName`,
    `${rootTableName}.deviceCPUArchitecture`,
    `${rootTableName}.deviceKernelType`,
    `${rootTableName}.deviceKernelVersion`,
    `${rootTableName}.deviceMachineUUID`,
    `${rootTableName}.devicePrettyProductName`,
    `${rootTableName}.deviceProductType`,
    `${rootTableName}.deviceProductVersion`,
    `${rootTableName}.deviceOSName`,
    `${rootTableName}.deviceUniqueIdentity`,
    `${rootTableName}.deviceNote`,
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
  createAppDevicesView();
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
      this.orWhere('stationsName', 'like', `%${searchText}%`)
        .orWhere('stationUrl', 'like', `%${searchText}%`)
        .orWhere('deviceMacAddress', 'like', `%${searchText}%`)
        .orWhere('deviceMachineHostName', 'like', `%${searchText}%`)
        .orWhere('deviceCPUArchitecture', 'like', `%${searchText}%`)
        .orWhere('devicePrettyProductName', 'like', `%${searchText}%`)
        .orWhere('deviceOSName', 'like', `%${searchText}%`);
    });
  } else {
    if (filterData.deviceMacAddress) {
      queryBuilder.where('deviceMacAddress', 'like', `%${filterData.deviceMacAddress}%`);
      delete filterData.deviceMacAddress;
    }

    if (filterData.deviceMachineHostName) {
      queryBuilder.where('deviceMachineHostName', 'like', `%${filterData.deviceMachineHostName}%`);
      delete filterData.deviceMachineHostName;
    }

    if (filterData.deviceCPUArchitecture) {
      queryBuilder.where('deviceCPUArchitecture', 'like', `%${filterData.deviceCPUArchitecture}%`);
      delete filterData.deviceCPUArchitecture;
    }

    if (filterData.deviceKernelType) {
      queryBuilder.where('deviceKernelType', 'like', `%${filterData.deviceKernelType}%`);
      delete filterData.deviceKernelType;
    }

    if (filterData.deviceKernelVersion) {
      queryBuilder.where('deviceKernelVersion', 'like', `%${filterData.deviceKernelVersion}%`);
      delete filterData.deviceKernelVersion;
    }
    if (filterData.deviceMachineUUID) {
      queryBuilder.where('deviceMachineUUID', 'like', `%${filterData.deviceMachineUUID}%`);
      delete filterData.deviceMachineUUID;
    }

    if (filterData.devicePrettyProductName) {
      queryBuilder.where('devicePrettyProductName', 'like', `%${filterData.devicePrettyProductName}%`);
      delete filterData.devicePrettyProductName;
    }

    if (filterData.deviceProductType) {
      queryBuilder.where('deviceProductType', 'like', `%${filterData.deviceProductType}%`);
      delete filterData.deviceProductType;
    }

    if (filterData.deviceProductVersion) {
      queryBuilder.where('deviceProductVersion', 'like', `%${filterData.deviceProductVersion}%`);
      delete filterData.deviceProductVersion;
    }

    if (filterData.deviceOSName) {
      queryBuilder.where('deviceOSName', 'like', `%${filterData.deviceOSName}%`);
      delete filterData.deviceOSName;
    }

    if (filterData.deviceUniqueIdentity) {
      queryBuilder.where('deviceUniqueIdentity', 'like', `%${filterData.deviceUniqueIdentity}%`);
      delete filterData.deviceUniqueIdentity;
    }

    if (filterData.deviceNote) {
      queryBuilder.where('deviceNote', 'like', `%${filterData.deviceNote}%`);
      delete filterData.deviceNote;
    }

    if (filterData.stationsName) {
      queryBuilder.where('stationsName', 'like', `%${filterData.stationsName}%`);
      delete filterData.stationsName;
    }

    if (filterData.stationUrl) {
      queryBuilder.where('stationUrl', 'like', `%${filterData.stationUrl}%`);
      delete filterData.stationUrl;
    }
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
async function customSearch(filter, skip, limit, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, order);
  return await query.select();
}
async function customCount(filter, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, order);
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
  count,
  updateById,
  initViews,
  updateAll,
  findById,
  customSearch,
  customCount,
};
