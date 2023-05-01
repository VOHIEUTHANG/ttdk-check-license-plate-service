/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB } = require('../../../config/database');
const { isValidValue } = require('../../ApiUtils/utilFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

function createOrReplaceView(viewName, viewDefinition) {
  Logger.info('ResourceAccess', 'createOrReplaceView: ' + viewName);
  Logger.info('ResourceAccess', viewDefinition.toString());
  return DB.schema.raw('CREATE OR REPLACE VIEW ?? AS (\n' + viewDefinition + '\n)', [viewName]).then(() => {
    Logger.info('ResourceAccess', '[DONE]createOrReplaceView: ' + viewName);
  });
}

async function insert(tableName, data, primaryKey) {
  let result = undefined;
  try {
    result = await DB(tableName).insert(data);
    if (process.env.REDIS_ENABLE) {
      if (result) {
        let _newId = result[0];
        let _insertedData = await findById(tableName, primaryKey, _newId);
        await RedisInstance.setWithExpire(`${primaryKey}_${_newId}`, JSON.stringify(_insertedData));
      }
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB INSERT ERROR: ${tableName} : ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }

  return result;
}
async function sum(tableName, field, filter, order) {
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter, undefined, undefined, order);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${field} as sumResult`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB SUM ERROR: ${tableName} ${field}: ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function updateById(tableName, id, data) {
  let result = undefined;
  try {
    result = await DB(tableName).where(id).update(data);
    if (process.env.REDIS_ENABLE) {
      if (result !== undefined) {
        let _updatedData = await DB(tableName).where(id);
        await RedisInstance.setWithExpire(`${id[Object.keys(id)[0]]}_${id[Object.keys(id)[1]]}`, JSON.stringify(_updatedData[0]));
      }
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB UPDATEBYID ERROR: ${tableName} : ${id} - ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function updateAll(tableName, data, filter = {}) {
  let result = undefined;

  try {
    result = await DB(tableName).where(filter).update(data);
  } catch (e) {
    Logger.error('ResourceAccess', `DB UPDATEALL ERROR: ${tableName} : ${filter} - ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

function _makeQueryBuilderByFilter(tableName, filter, skip, limit, order) {
  let queryBuilder = DB(tableName);
  if (filter) {
    queryBuilder.where(filter);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }

  return queryBuilder;
}

async function find(tableName, filter, skip, limit, order) {
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter, skip, limit, order);
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.select().then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: ${tableName} : ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function findById(tableName, key, id) {
  if (process.env.REDIS_ENABLE) {
    let _cacheItem = await RedisInstance.getJson(`${tableName}_${id}`);

    if (isValidValue(_cacheItem)) {
      return _cacheItem;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      DB(tableName)
        .select()
        .where(key, id)
        .where('isDeleted', 0)
        .then(records => {
          if (records && records.length > 0) {
            if (process.env.REDIS_ENABLE) {
              if (isValidValue(records[0])) {
                RedisInstance.setWithExpire(`${key}_${id}`, JSON.stringify(records[0])).then(() => {
                  resolve(records[0]);
                });
              } else {
                resolve(undefined);
              }
            } else {
              resolve(records[0]);
            }
          } else {
            resolve(undefined);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: findById ${tableName} : ${key} - ${id}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function findOne(tableName, filter) {
  return new Promise((resolve, reject) => {
    try {
      DB(tableName)
        .select()
        .where(filter)
        .then(records => {
          if (records && records.length > 0) {
            if (process.env.REDIS_ENABLE) {
              if (isValidValue(records[0])) {
                RedisInstance.setWithExpire(`${tableName}_findone_${JSON.stringify(filter)}`, JSON.stringify(records[0])).then(() => {
                  resolve(records[0]);
                });
              } else {
                resolve(undefined);
              }
            } else {
              resolve(records[0]);
            }
          } else {
            resolve(undefined);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: findById ${tableName} : ${key} - ${id}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function count(tableName, field, filter) {
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.count(`${field} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function deleteById(tableName, id) {
  let result = undefined;
  try {
    result = await DB(tableName).where(id).update({ isDeleted: 1 });
  } catch (e) {
    Logger.error('ResourceAccess', `DB UPDATEBYID ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function permanentlyDelete(tableName, id) {
  let result = undefined;
  try {
    result = await DB(tableName).where(id).del();
  } catch (e) {
    Logger.error('ResourceAccess', `DB DELETE ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

function filterHandler(filterData, queryBuilder) {
  for (const key in filterData) {
    const filterValue = filterData[key];
    if (Array.isArray(filterValue)) {
      queryBuilder.where(function () {
        for (let value of filterValue) {
          this.orWhere(key, value);
        }
      });
      delete filterData[key];
    }
  }
  queryBuilder.where(filterData);
}

module.exports = {
  insert,
  find,
  findById,
  findOne,
  updateById,
  count,
  createOrReplaceView,
  updateAll,
  sum,
  deleteById,
  permanentlyDelete,
  filterHandler,
};
