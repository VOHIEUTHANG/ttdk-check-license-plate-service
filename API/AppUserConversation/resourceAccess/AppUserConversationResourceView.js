/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserConversationResourceView';
const rootTableName = 'AppUserConversation';
const primaryKeyField = 'appUserConversationId';

const StationsTableName = 'Stations';
const AppUserTableName = 'AppUser';
const StaffTableName = 'Staff';

async function createViews() {
  let fields = [
    `${rootTableName}.appUserConversationId`,
    `${rootTableName}.senderId`,
    `${rootTableName}.receiverId`,
    `${rootTableName}.conversationType`,
    `${rootTableName}.senderReadMessage`,
    `${rootTableName}.receiverReadMessage`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isDeleted`,

    `${StationsTableName}.stationsId`,
    `${StationsTableName}.stationsName`,
    `${StationsTableName}.stationCode`,

    `${AppUserTableName}.firstName`,
    `${AppUserTableName}.userAvatar`,
    `${AppUserTableName}.phoneNumber`,
    `${AppUserTableName}.email`,

    `${StaffTableName}.firstName as adminName`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StationsTableName, function () {
      this.on(`${rootTableName}.receiverId`, '=', `${StationsTableName}.stationsId`);
    })
    .leftJoin(AppUserTableName, function () {
      this.on(`${rootTableName}.senderId`, '=', `${AppUserTableName}.appUserId`);
    })
    .leftJoin(StaffTableName, function () {
      this.on(`${rootTableName}.senderId`, '=', `${StaffTableName}.staffId`);
    });
  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createViews();
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let filter = {};
  filter[`${primaryKeyField}`] = id;
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

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};
  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('firstName', 'like', `%${searchText}%`);
      this.orWhere('stationsName', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);

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
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return await query.count(`${primaryKeyField} as count`);
}

async function countUserMonthByYear(filter, startDate, endDate) {
  let query = await DB(tableName)
    .select('createMonth')
    .select('createYear')
    .where(filter)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .count(`createMonth as countCreateMonth`)
    .groupBy('createMonth')
    .groupBy('createYear')
    .orderBy('createMonth', 'desc')
    .orderBy('createYear', 'desc');
  return query;
}

async function findAllUsersFollowingReferId(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryAllUser = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  queryAllUser.where('appUserMembershipId', '>', 1);
  return await queryAllUser.select();
}

async function countAllUsersByReferId(filter, startDate, endDate, searchText, order) {
  let queryAllUser = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  queryAllUser.where('appUserMembershipId', '>', 1);
  return await queryAllUser.count('appUserId as count');
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  updateAll,
  customSearch,
  customCount,
  findById,
  countUserMonthByYear,
  findAllUsersFollowingReferId,
  countAllUsersByReferId,
};
