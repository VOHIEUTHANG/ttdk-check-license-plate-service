/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const StationDevicesResourceAccess = require('../resourceAccess/StationDevicesResourceAccess');
const StationDevicesView = require('../resourceAccess/StationDevicesView');
const StationDevicesFunctions = require('../../StationDevices/StationDevicesFunctions');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const moment = require('moment');

const { POPULAR_ERROR, UNKNOWN_ERROR, NO_DATA } = require('../../Common/CommonConstant');
const { STATION_DEVICES_ERRORS } = require('../StationDevicesConstants');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      const result = await StationDevicesResourceAccess.insert(data);
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

      let deviceList = await StationDevicesView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (deviceList && deviceList.length > 0) {
        let deviceCount = await StationDevicesView.customCount(filter, startDate, endDate, searchText, order);
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

      let updateResult = await StationDevicesResourceAccess.updateById(id, data);
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

      let stationDevice = await StationDevicesResourceAccess.findById(id);

      if (stationDevice) {
        return resolve(stationDevice);
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

      let result = await StationDevicesResourceAccess.deleteById(id);
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
