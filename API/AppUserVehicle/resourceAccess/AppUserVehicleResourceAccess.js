/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');
const { DB, timestamps } = require('../../../config/database');
const { VEHICLE_PLATE_TYPE, VEHICLE_TYPE } = require('../AppUserVehicleConstant');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserVehicle';
const primaryKeyField = 'appUserVehicleId';
async function createTable() {
  console.log(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('stationsId');
          table.integer('appUserId');
          table.string('vehicleIdentity'); // bien so xe
          table.string('vehiclePlateColor').defaultTo(VEHICLE_PLATE_TYPE.WHITE); // mau bien so
          table.string('vehicleRegistrationCode'); // so quan ly
          table.string('vehicleType').defaultTo(VEHICLE_TYPE.CAR); // loai phuong tien
          table.string('vehicleBrandName'); // nhan hieu xe
          table.string('vehicleBrandModel'); // so loai
          table.string('vehicleRegistrationImageUrl', 2000); // link anh giay dang kiem
          table.string('vehicleExpiryDate'); // ngay het han
          table.string('certificateSeries'); // so GCN moi nhat
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('vehicleIdentity');
          table.index('vehicleType');
          table.index('appUserId');
          table.index('vehicleBrandName');
          table.index('stationsId');
        })
        .then(() => {
          console.log(`${tableName} table created done`);
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

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}
async function deleteById(AppDevicesId) {
  let dataId = {};
  dataId[primaryKeyField] = AppDevicesId;
  return await Common.deleteById(tableName, dataId);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  const queryBuilder = DB(tableName);
  const filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('vehicleIdentity', 'like', `%${searchText}%`);
    });
  }

  queryBuilder.where({ isDeleted: 0 });

  queryBuilder.where(filterData);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (startDate) {
    queryBuilder.where('vehicleExpiryDate', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('vehicleExpiryDate', '<=', endDate);
  }

  if (order && order.key !== '' && ['desc', 'asc'].includes(order.value)) {
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
  return query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);

  let count;

  try {
    const [record] = await query.count(`${primaryKeyField} as count`);
    if (record || record === 0) {
      count = record.count;
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
    Logger.error('ResourceAccess', e);
  }

  return count;
}

async function findDeletedRecord(skip, limit) {
  let queryBuilder = DB(tableName);

  queryBuilder.where({ isDeleted: 1 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

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

async function permanentlyDelete(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.permanentlyDelete(tableName, dataId);
}

module.exports = {
  find,
  findById,
  insert,
  updateById,
  deleteById,
  count,
  initDB,
  customSearch,
  customCount,
  permanentlyDelete,
  findDeletedRecord,
};
