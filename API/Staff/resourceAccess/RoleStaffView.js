/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'RoleStaffView';
const rootTableName = 'Staff';
const primaryKeyField = 'staffId';

async function createRoleStaffView() {
  const RoleTableName = 'Role';
  let fields = [
    `${rootTableName}.staffId`,
    `${rootTableName}.roleId`,
    `${rootTableName}.username`,
    `${rootTableName}.firstName`,
    `${rootTableName}.lastName`,
    `${rootTableName}.email`,
    `${rootTableName}.password`,
    `${rootTableName}.active`,
    `${rootTableName}.ipAddress`,
    `${rootTableName}.phoneNumber`,
    `${rootTableName}.lastActiveAt`,
    `${rootTableName}.twoFACode`,
    `${rootTableName}.telegramId`,
    `${rootTableName}.facebookId`,
    `${rootTableName}.appleId`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.isDeleted`,
    `${RoleTableName}.roleName`,
    `${RoleTableName}.permissions`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(RoleTableName, function () {
      this.on(`${rootTableName}.roleId`, '=', `${RoleTableName}.roleId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createRoleStaffView();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  return await Common.updateById(tableName, { staffId: id }, data);
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

function _makeQueryBuilderByFilter(filter, skip, limit, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (filterData.username) {
    queryBuilder.where('username', 'like', `%${filterData.username}%`);
    delete filterData.username;
  }

  if (filterData.lastName) {
    queryBuilder.where('lastName', 'like', `%${filterData.lastName}%`);
    delete filterData.lastName;
  }

  if (filterData.firstName) {
    queryBuilder.where('firstName', 'like', `%${filterData.firstName}%`);
    delete filterData.firstName;
  }

  if (filterData.email) {
    queryBuilder.where('email', 'like', `%${filterData.email}%`);
    delete filterData.email;
  }

  if (filterData.phoneNumber) {
    queryBuilder.where('phoneNumber', 'like', `%${filterData.phoneNumber}%`);
    delete filterData.phoneNumber;
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

async function customSearch(filter, skip, limit, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, order);
  return await query.select();
}

async function customCount(filter, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, order);
  return await query.count(`${primaryKeyField} as count`);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}
module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initViews,
  updateAll,
  customCount,
  customSearch,
};
