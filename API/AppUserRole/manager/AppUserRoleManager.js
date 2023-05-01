/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const AppUserRoleResourceAccess = require('../resourceAccess/AppUserRoleResourceAccess');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserRoleData = req.payload;
      let result = await AppUserRoleResourceAccess.insert(appUserRoleData);
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

      let appUserRoles = await AppUserRoleResourceAccess.find(filter, skip, limit, order);
      let appUserRolesCount = await AppUserRoleResourceAccess.count(filter, order);
      if (appUserRoles && appUserRolesCount) {
        resolve({ data: appUserRoles, total: appUserRolesCount });
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
      let appUserRoleId = req.payload.id;
      let appUserRoleData = req.payload.data;
      let result = await AppUserRoleResourceAccess.updateById(appUserRoleId, appUserRoleData);
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
