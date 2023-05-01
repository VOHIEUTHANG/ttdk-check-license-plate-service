/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationNews';
const primaryKeyField = 'stationNewsId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('stationNewsId').primary();
          table.integer('stationsId');
          table.string('stationNewsTitle', 1000);
          table.text('stationNewsContent', 'longtext');
          table.integer('stationNewsRating').defaultTo(5);
          table.string('stationNewsCreators');
          table.integer('stationNewsStatus').defaultTo(0);
          table.string('stationNewsTagCloud', 2000);
          table.string('stationNewsCategories').defaultTo(0);
          table.integer('totalViewed').defaultTo(0);
          table.integer('dayViewed').defaultTo(0);
          table.integer('monthViewed').defaultTo(0);
          table.integer('weekViewed').defaultTo(0);
          table.integer('searchCount').defaultTo(0);
          table.integer('followCount').defaultTo(0);
          table.string('embeddedCode', 2000);
          table.string('stationNewsAvatar');
          table.timestamp('stationNewsUpdatedAt').defaultTo(DB.fn.now());
          timestamps(table);
          table.index('stationNewsId');
          table.index('stationNewsStatus');
          table.index('stationNewsTitle');
          table.index('stationNewsCategories');
        })
        .then(async () => {
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
      this.orWhere('stationNewsTitle', 'like', `%${searchText}%`).orWhere('stationNewsContent', 'like', `%${searchText}%`);
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

async function updateFollowCount(stationNewsId) {
  let filter = {};
  filter[primaryKeyField] = stationNewsId;
  return await DB(tableName).where(filter).increment('followCount', 1);
}

async function updateSearchCount(stationNewsId) {
  let filter = {};
  filter[primaryKeyField] = stationNewsId;
  return await DB(tableName).where(filter).increment('searchCount', 1);
}

async function addViewCount(stationNewsId) {
  let filter = {};
  filter[primaryKeyField] = stationNewsId;

  await DB(tableName).where(filter).increment('stationNewsTotalViewed', 1);
  await DB(tableName).where(filter).increment('dayViewed', 1);
  await DB(tableName).where(filter).increment('monthViewed', 1);
  await DB(tableName).where(filter).increment('weekViewed', 1);

  return 1;
}

async function resetDayViewedCount() {
  return await DB(tableName).update({ dayViewed: 0 });
}

async function resetMonthViewedCount() {
  return await DB(tableName).update({ monthViewed: 0 });
}

async function resetWeekViewedCount() {
  return await DB(tableName).update({ weekViewed: 0 });
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
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  resetWeekViewedCount,
  resetMonthViewedCount,
  resetDayViewedCount,
  updateFollowCount,
  updateSearchCount,
  addViewCount,
  deleteById,
};
