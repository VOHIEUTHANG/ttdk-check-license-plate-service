/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { OTP_CONFIRM_STATUS, DEFAULT_EXPIRED_MINUTE } = require('../OTPMessageConstant');
const tableName = 'OTPMessage';
const primaryKeyField = 'otpMessageId';

async function createTable() {
  console.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('otp'); // ma otp
          table.string('id'); // luu (email/sdt)
          table.integer('expiredTime').defaultTo(DEFAULT_EXPIRED_MINUTE);
          table.integer('confirmStatus').defaultTo(OTP_CONFIRM_STATUS.NOT_CONFIRMED);
          table.timestamp('confirmedAt', { useTz: true }).nullable();
          table.timestamp('expiredAt', { useTz: true }).nullable();
          timestamps(table);
        })
        .then(() => {
          console.info(`${tableName} table created done`);
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

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
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
  deleteById,
  modelName: tableName,
};
