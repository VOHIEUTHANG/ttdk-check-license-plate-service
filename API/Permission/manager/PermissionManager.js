/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const PermissionResourceAccess = require('../resourceAccess/PermissionResourceAccess');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
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

      let permissions = await PermissionResourceAccess.find(filter, skip, limit, order);
      let permissionsCount = await PermissionResourceAccess.count(filter, order);
      if (permissions && permissionsCount) {
        resolve({ data: permissions, total: permissionsCount });
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
      resolve('success');
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
