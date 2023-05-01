/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserPermission';
const primaryKeyField = 'appUserPermissionId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('appUserPermissionName');
          table.string('appUserPermissionKey');
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('appUserPermissionName');
          table.index('appUserPermissionKey');
          table.unique('appUserPermissionKey');
        })
        .then(() => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          let initialAppUserPermissions = [
            'Manage customer',
            'Manage record',
            'Manage app user',
            'Manage settings',
            'Manage schedule',
            'Manage news',
            'View schedule',
            'Add schedule',
          ];
          let appUserPermissionArr = [];
          for (let i = 0; i < initialAppUserPermissions.length; i++) {
            const appUserPermission = initialAppUserPermissions[i];
            appUserPermissionArr.push({
              appUserPermissionName: appUserPermission,
              appUserPermissionKey: appUserPermission.toUpperCase().replace(/\s/gi, '_'),
            });
          }

          DB(`${tableName}`)
            .insert(appUserPermissionArr)
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
