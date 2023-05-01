/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationIntroduction';
const primaryKeyField = 'stationsId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          //No increment, this id must be sync with primaryKey in table Station
          //!! WHY I HAVE TO DO THIS !!
          //Because if we merge all together insde 1 SUPER TABLE.
          //it will be big and hard to re-use in other project
          table.integer('stationsId').primary();
          table.string('slideBanners', 3000).defaultTo('');
          table.text('stationIntroductionSlogan').defaultTo('');
          table.text('stationIntroductionTitle').defaultTo('');
          table.text('stationIntroductionContent', 'longtext').defaultTo('');
          table.string('stationIntroductionMedia', 1000).defaultTo('');
          table.text('stationIntroSection1Content', 'longtext').defaultTo('');
          table.string('stationIntroSection1Media', 1000).defaultTo('');
          table.text('stationIntroSection2Content', 'longtext').defaultTo('');
          table.string('stationIntroSection2Media', 1000).defaultTo('');
          table.string('stationIntroServices', 3000).defaultTo('');
          table.string('stationFacebookUrl').defaultTo('');
          table.string('stationTwitterUrl').defaultTo('');
          table.string('stationYoutubeUrl').defaultTo('');
          table.string('stationInstagramUrl').defaultTo('');
          table.integer('dayViewed').defaultTo(0);
          table.integer('monthViewed').defaultTo(0);
          table.integer('weekViewed').defaultTo(0);
          table.integer('totalViewed').defaultTo(0);
          timestamps(table);
          table.index('stationsId');
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

async function addViewCount(stationId) {
  let filter = {};
  filter[primaryKeyField] = stationId;

  await DB(tableName).where(filter).increment('totalViewed', 1);
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

async function deleteById(stationsId) {
  let dataId = {};
  dataId[primaryKeyField] = stationsId;
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
  resetWeekViewedCount,
  resetMonthViewedCount,
  resetDayViewedCount,
  addViewCount,
  deleteById,
};
