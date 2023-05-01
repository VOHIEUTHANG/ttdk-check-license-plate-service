/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'SystemConfigurations';
const primaryKeyField = 'systemConfigurationsId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('systemConfigurationsId').primary();
          table.string('systemLeftBannerAd').defaultTo('');
          table.string('systemRightBannerAd').defaultTo('');
          table.integer('pricePerSMS').defaultTo(1000);
          table.integer('pricePerEmail').defaultTo(100);
          table.integer('pricePerTenant').defaultTo(3000000);
          timestamps(table);
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);

          let configuration = {
            systemLeftBannerAd: `https://${process.env.HOST_NAME}/uploads/media/quangcao/leftBanner.gif`,
            systemRightBannerAd: `https://${process.env.HOST_NAME}/uploads/media/quangcao/rightBanner.gif`,
          };

          DB(`${tableName}`)
            .insert(configuration)
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
async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  findById,
  modelName: tableName,
};
