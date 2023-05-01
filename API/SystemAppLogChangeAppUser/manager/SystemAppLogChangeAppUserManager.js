/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const SystemAppLogResource = require('../resourceAccess/SystemAppLogChangeAppUserResourceAccess');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let systemAppLogData = req.payload;
      let result = await SystemAppLogResource.insert(systemAppLogData);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      let systemAppLogs = await SystemAppLogResource.find(filter, skip, limit, order);
      let systemAppLogsCount = await SystemAppLogResource.count(filter, order);
      if (systemAppLogs && systemAppLogsCount) {
        resolve({ data: systemAppLogs, total: systemAppLogsCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let systemAppLogId = req.payload.id;
      let systemAppLogData = req.payload.data;
      let result = await SystemAppLogResource.updateById(systemAppLogId, systemAppLogData);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
};
