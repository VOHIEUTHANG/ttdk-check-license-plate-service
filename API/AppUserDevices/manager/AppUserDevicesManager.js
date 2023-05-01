/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const AppUserDevicesResourceAccess = require('../resourceAccess/AppUserDevicesResourceAccess');
const { POPULAR_ERROR } = require('../../Common/CommonConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const userDeviceData = req.payload;

      const result = await AppUserDevicesResourceAccess.insert(userDeviceData);
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

      let deviceList = await AppUserDevicesResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (deviceList && deviceList.length > 0) {
        let deviceCount = await AppUserDevicesResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (deviceCount > 0) {
          return resolve({ data: deviceList, total: deviceCount });
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

      let updateResult = await AppUserDevicesResourceAccess.updateById(id, data);
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

      let userVehicle = await AppUserDevicesResourceAccess.findById(id);

      if (userVehicle) {
        return resolve(userVehicle);
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

      let result = await AppUserDevicesResourceAccess.deleteById(id);
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
