/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'Upload';
const primaryKeyField = 'uploadId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('uploadId').primary();
          table.string('uploadFileName');
          table.string('uploadFileUrl', 500);
          table.string('uploadUnicodeName');
          table.string('uploadFileExtension');
          table.integer('uploadFileSize');
          timestamps(table);
          table.index('uploadFileName');
          table.unique('uploadFileName');
          table.index('uploadFileUrl');
          table.index('uploadUnicodeName');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          let uploadInfos = [
            {
              uploadFileExtension: 'mp3',
              uploadFileName: 'uploads/voices/nhan-xe-cuoi-day-chuyen.mp3',
              uploadUnicodeName: 'Nhận xe cuối dây chuyền',
              uploadFileSize: 100,
              uploadFileUrl: `https://${process.env.HOST_NAME}/uploads/voices/nhan-xe-cuoi-day-chuyen.mp3`,
            },
            {
              uploadFileExtension: 'mp3',
              uploadFileName: 'uploads/voices/nop-phi-duong-bo-cua-1.mp3',
              uploadUnicodeName: 'Nộp phí đường bộ cửa 1',
              uploadFileSize: 100,
              uploadFileUrl: `https://${process.env.HOST_NAME}/uploads/voices/nop-phi-duong-bo-cua-1.mp3`,
            },
            {
              uploadFileExtension: 'mp3',
              uploadFileName: 'uploads/voices/moi-chu-xe.mp3',
              uploadUnicodeName: 'Mời chủ xe',
              uploadFileSize: 100,
              uploadFileUrl: `https://${process.env.HOST_NAME}/uploads/voices/moi-chu-xe.mp3`,
            },
            {
              uploadFileExtension: 'mp3',
              uploadFileName: 'uploads/voices/nhan-giay-to-xe-cua-2.mp3',
              uploadUnicodeName: 'Nhận giấy tờ xe cửa 2',
              uploadFileSize: 100,
              uploadFileUrl: `https://${process.env.HOST_NAME}/uploads/voices/nhan-giay-to-xe-cua-2.mp3`,
            },
            {
              uploadFileExtension: 'mp3',
              uploadFileName: 'uploads/voices/ra-xe-cho-dan-tem.mp3',
              uploadUnicodeName: 'Ra xe, chờ dán tem',
              uploadFileSize: 100,
              uploadFileUrl: `https://${process.env.HOST_NAME}/uploads/voices/ra-xe-cho-dan-tem.mp3`,
            },
            {
              uploadFileExtension: 'mp3',
              uploadFileName: 'uploads/voices/tra-ket-qua-kiem-dinh-cua-4.mp3',
              uploadUnicodeName: 'Trả kết quả kiểm định cửa 4',
              uploadFileSize: 100,
              uploadFileUrl: `https://${process.env.HOST_NAME}/uploads/voices/tra-ket-qua-kiem-dinh-cua-4.mp3`,
            },
          ];

          DB(`${tableName}`)
            .insert(uploadInfos)
            .then(result => {
              Logger.info(`${tableName}`, `init ${tableName} result ` + result);
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

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
};
