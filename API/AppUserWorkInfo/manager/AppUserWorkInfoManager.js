/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const Logger = require('../../../utils/logging');
const AppUserWorkInfoResourceAccess = require('../resourceAccess/AppUserWorkInfoResourceAccess');
const AppUserResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');

const { POPULAR_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      const result = await AppUserWorkInfoResourceAccess.insert(data);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let list = await AppUserWorkInfoResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (list && list.length > 0) {
        let count = await AppUserWorkInfoResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (count > 0) {
          return resolve({ data: list, total: count });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;

      const existedAppUser = await AppUserResourceAccess.findById(id);
      if (!existedAppUser) {
        return reject(NOT_FOUND);
      }

      const existedWorkInfo = await AppUserWorkInfoResourceAccess.findById(id);

      let updateResult;
      if (existedWorkInfo) {
        updateResult = await AppUserWorkInfoResourceAccess.updateById(id, data);
      } else {
        const newUserInfo = {
          ...data,
          appUserId: id,
        };
        updateResult = await AppUserWorkInfoResourceAccess.insert(newUserInfo);
      }

      if (updateResult) {
        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      let userInfo = await AppUserWorkInfoResourceAccess.findById(id);

      if (userInfo) {
        return resolve(userInfo);
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await AppUserWorkInfoResourceAccess.deleteById(id);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }
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
  deleteById,
};
