/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'RoleUserView';
const rootTableName = 'AppUser';
const primaryKeyField = 'appUserId';

async function createRoleStaffView() {
  const AppUserWorkInfoTableName = 'AppUserWorkInfo';
  const StationTableName = 'Stations';

  let fields = [
    `${rootTableName}.appUserId`,
    `${rootTableName}.appUserRoleId`,
    `${rootTableName}.username`,
    `${rootTableName}.firstName`,
    `${rootTableName}.lastName`,
    `${rootTableName}.email`,
    `${rootTableName}.password`,
    `${rootTableName}.active`,
    `${rootTableName}.phoneNumber`,
    `${rootTableName}.lastActiveAt`,
    `${rootTableName}.twoFACode`,
    `${rootTableName}.twoFAQR`,
    `${rootTableName}.twoFAEnable`,
    `${rootTableName}.userAvatar`,
    `${rootTableName}.firebaseToken`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.userToken`,
    `${rootTableName}.socialInfo`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.employeeCode`,
    `${rootTableName}.appUserPosition`,
    `${rootTableName}.appUserWorkStep`,
    `${rootTableName}.isVerifiedPhoneNumber`,
    `${rootTableName}.userHomeAddress`,
    `${rootTableName}.birthDay`,
    `${rootTableName}.appUserIdentity`,
    `${rootTableName}.companyName`,
    `${rootTableName}.appUserCategory`,

    `${AppUserWorkInfoTableName}.appUserLevel`,
    `${AppUserWorkInfoTableName}.licenseNumber`,
    `${AppUserWorkInfoTableName}.licenseDateFrom`,
    `${AppUserWorkInfoTableName}.licenseDateEnd`,
    `${AppUserWorkInfoTableName}.licenseDecisionDate`,
    `${AppUserWorkInfoTableName}.licenseCommitmentYear`,

    `${StationTableName}.stationArea`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(AppUserWorkInfoTableName, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${AppUserWorkInfoTableName}.appUserId`);
    })
    .leftJoin(StationTableName, function () {
      this.on(`${rootTableName}.stationsId`, '=', `${StationTableName}.stationsId`);
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, searchText, order) {
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
async function customSearch(filter, skip, limit, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, order);
  return await query.select();
}
async function customCount(filter, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText);
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

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initViews,
  updateAll,
  customSearch,
  customCount,
};
