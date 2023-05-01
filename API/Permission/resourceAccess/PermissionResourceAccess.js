/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'Permission';
const primaryKeyField = 'permissionId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('permissionName');
          table.string('permissionKey');
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('permissionName');
          table.index('permissionKey');
          table.unique('permissionKey');
        })
        .then(() => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          let initialPermissions = [
            'Manage User',
            'Manage Staff',
            'Manage station',
            'Manage vehicle',
            'Manage document',
            'Manage station user',
            'Manage station staff',
            'Manage chat',
            'Manage notification',
          ];
          let permissionArr = [];
          for (let i = 0; i < initialPermissions.length; i++) {
            const permission = initialPermissions[i];
            permissionArr.push({
              permissionName: permission,
              permissionKey: permission.toUpperCase().replace(/\s/gi, '_'),
            });
          }

          DB(`${tableName}`)
            .insert(permissionArr)
            .then(result => {
              Logger.info(`${tableName}`, `init ${tableName}` + result);
              resolve();
            });
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

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
};
