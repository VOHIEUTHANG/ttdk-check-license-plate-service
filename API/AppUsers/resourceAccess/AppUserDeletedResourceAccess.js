/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');

const tableName = 'AppUserDeleted';
const primaryKeyField = 'appUserDeletedId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('appUserId');
          table.string('username');
          table.string('firstName');
          table.string('lastName');
          table.string('phoneNumber');
          table.string('email');
          table.string('password');
          table.string('lastActiveAt');
          table.string('twoFACode');
          table.string('twoFAQR');
          table.integer('twoFAEnable').defaultTo(0);
          table.string('userAvatar');
          table.string('userToken', 2000);
          table.string('socialInfo');
          table.string('firebaseToken', 2000);
          table.string('userIpAddress');
          table.integer('stationsId');
          table.integer('active').defaultTo(1);
          table.integer('appUserRoleId').defaultTo(0);
          table.integer('isVerifiedPhoneNumber').defaultTo(0);
          table.integer('employeeCode').defaultTo(0);
          table.string('appUserPosition');
          table.string('appUserWorkStep');
          table.string('userHomeAddress');
          table.string('birthDay');
          table.string('appUserIdentity');
          table.string('companyName');
          table.integer('appUserCategory');

          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index('appUserId');
          table.unique('username');
          table.index('username');
          table.index('firstName');
          table.index('lastName');
          table.index('active');
          table.index('phoneNumber');
          table.index('lastActiveAt');
          table.index('appUserRoleId');
        })
        .then(() => {
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
  let filter = {};
  filter[primaryKeyField] = id;
  return await Common.updateById(tableName, filter, data);
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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('phoneNumber', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`);
    });
  }

  Common.filterHandler(filterData, queryBuilder);

  queryBuilder.where({ isDeleted: 0 });

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }

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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}

async function permanentlyDelete(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.permanentlyDelete(tableName, dataId);
}

module.exports = {
  insert,
  find,
  count,
  deleteById,
  updateById,
  initDB,
  updateAll,
  customSearch,
  customCount,
  findById,
  permanentlyDelete,
};
