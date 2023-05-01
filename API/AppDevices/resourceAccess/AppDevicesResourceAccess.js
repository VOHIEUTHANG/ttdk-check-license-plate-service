/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppDevices';
const primaryKeyField = 'appDeviceId';
async function createTable() {
  console.log(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('stationsId');
          table.integer('appUserId');
          table.string('deviceMacAddress');
          table.string('deviceMachineHostName');
          table.string('deviceCPUArchitecture');
          table.string('deviceKernelType');
          table.string('deviceKernelVersion');
          table.string('deviceMachineUUID');
          table.string('devicePrettyProductName');
          table.string('deviceProductType');
          table.string('deviceProductVersion');
          table.string('deviceOSName');
          table.string('deviceUniqueIdentity');
          table.string('deviceNote');
          table.integer('deviceStatus').defaultTo(0);
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('stationsId');
          table.index('appUserId');
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}
async function deleteById(AppDevicesId) {
  let dataId = {};
  dataId[primaryKeyField] = AppDevicesId;
  return await Common.deleteById(tableName, dataId);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  deleteById,
  findById,
};
