/* Copyright (c) 2021-2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 12/31/21.
 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { CONVERSATION_TYPE } = require('../AppUserConversationConstant');
const tableName = 'AppUserConversation';
const primaryKeyField = 'appUserConversationId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('senderId');
          table.integer('receiverId');
          table.integer('conversationType').defaultTo(CONVERSATION_TYPE.USER_TO_ADMIN);
          table.integer('senderReadMessage').defaultTo(0);
          table.integer('receiverReadMessage').defaultTo(0);
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index(`receiverId`);
          table.index('senderId');
          table.index('senderReadMessage');
          table.index('receiverReadMessage');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(() => {
            resolve();
          });
        });
    });
  });
}

async function seeding() {
  let seedingData = [
    {
      senderId: 1,
      receiverId: 1,
    },
    {
      senderId: 2,
      receiverId: 2,
    },
    {
      senderId: 1,
      receiverId: 2,
    },
  ];
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(seedingData)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
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
async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}
async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

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

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return await query.count(`${primaryKeyField} as count`);
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  deleteById,
  findById,
  initDB,
  customSearch,
  customCount,
};
