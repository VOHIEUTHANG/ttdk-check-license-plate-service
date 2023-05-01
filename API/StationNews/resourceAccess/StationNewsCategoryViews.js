/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationNewsCategoryView';
const rootTableName = 'StationNews';
const primaryKeyField = 'stationNewsId';

async function createViews() {
  const CategoryTable = 'StationNewsCategory';

  let fields = [
    `${rootTableName}.stationNewsId`,
    `${rootTableName}.stationsId`,
    `${rootTableName}.stationNewsTitle`,
    `${rootTableName}.stationNewsContent`,
    `${rootTableName}.stationNewsRating`,
    `${rootTableName}.stationNewsCreators`,
    `${rootTableName}.stationNewsStatus`,
    `${rootTableName}.stationNewsTagCloud`,
    `${rootTableName}.stationNewsCategories`,
    `${rootTableName}.totalViewed`,
    `${rootTableName}.embeddedCode`,
    `${rootTableName}.dayViewed`,
    `${rootTableName}.monthViewed`,
    `${rootTableName}.weekViewed`,
    `${rootTableName}.searchCount`,
    `${rootTableName}.followCount`,
    `${rootTableName}.stationNewsAvatar`,
    `${rootTableName}.stationNewsUpdatedAt`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,

    `${CategoryTable}.stationNewsCategoryTitle`,
    `${CategoryTable}.stationNewsCategoryContent`,
    `${CategoryTable}.stationNewsCategoryId`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(CategoryTable, function () {
      this.on(`${rootTableName}.stationNewsCategories`, '=', `${CategoryTable}.stationNewsCategoryId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createViews();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = JSON.parse(JSON.stringify(filter));
  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('stationNewsTitle', 'like', `%${searchText}%`)
        .orWhere('stationNewsContent', 'like', `%${searchText}%`)
        .orWhere('stationNewsCategories', 'like', `%${searchText}%`);
    });
  } else {
    if (filterData.stationNewsName) {
      queryBuilder.where('stationNewsName', 'like', `%${filterData.stationNewsName}%`);
      delete filterData.stationNewsName;
    }
    if (filterData.stationNewsTitle) {
      queryBuilder.where('stationNewsTitle', 'like', `%${filterData.stationNewsTitle}%`);
      delete filterData.stationNewsTitle;
    }
    if (filterData.stationNewsContent) {
      queryBuilder.where('stationNewsContent', 'like', `%${filterData.stationNewsContent}%`);
      delete filterData.stationNewsContent;
    }
  }
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  queryBuilder.where(filterData);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('stationNewsUpdatedAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
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

async function deleteById(stationNewsId) {
  let dataId = {};
  dataId[primaryKeyField] = stationNewsId;
  return await Common.deleteById(tableName, dataId);
}
module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initViews,
  modelName: tableName,
  customSearch,
  customCount,
  deleteById,
};
