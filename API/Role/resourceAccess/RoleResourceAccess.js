/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'Role';
const primaryKeyField = 'roleId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('roleId').primary();
          table.string('roleName');
          table.string('permissions');
          timestamps(table);
          table.index('roleId');
          table.index('permissions');
          table.index('roleName');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          let roles = ['Admin', 'Operator', 'Moderator', 'Editor'];
          let rolesArr = [];
          let adminPermissions = await DB(`Permission`).select();
          let permissionList = [];
          for (let i = 0; i < adminPermissions.length; i++) {
            const permission = adminPermissions[i];
            permissionList.push(permission.permissionKey);
          }
          permissionList = permissionList.join(',');
          for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            rolesArr.push({
              roleName: role,
              permissions: permissionList,
            });
          }

          DB(`${tableName}`)
            .insert(rolesArr)
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
};
