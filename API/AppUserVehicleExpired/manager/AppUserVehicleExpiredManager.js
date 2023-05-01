'use strict';
const AppUserVehicleExpiredResourceAccess = require('../resourceAccess/AppUserVehicleExpiredResourceAccess');
const { POPULAR_ERROR } = require('../../Common/CommonConstant');
const { USER_VEHICLE_ERRORS } = require('../AppUserVehicleExpiredConstants');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userVehicleData = req.payload;
      userVehicleData.stationsId = req.currentUser.stationsId;

      const existedVehicle = await AppUserVehicleExpiredResourceAccess.findById(userVehicleData.vehicleIdentity);
      if (existedVehicle) {
        return reject(USER_VEHICLE_ERRORS.DUPLICATE_VEHICLE_PLATE_NUMBER);
      }

      const result = await AppUserVehicleExpiredResourceAccess.insert(userVehicleData);
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

      let vehicleList = await AppUserVehicleExpiredResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (vehicleList && vehicleList.length > 0) {
        let vehicleCount = await AppUserVehicleExpiredResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (vehicleCount > 0) {
          return resolve({ data: vehicleList, total: vehicleCount });
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
      const vehicleId = req.payload.id;
      const data = req.payload.data;

      let updateResult = await AppUserVehicleExpiredResourceAccess.updateById(vehicleId, data);
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
      const vehicleId = req.payload.id;

      let userVehicle = await AppUserVehicleExpiredResourceAccess.findById(vehicleId);

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
      let vehicleId = req.payload.id;

      let result = await AppUserVehicleExpiredResourceAccess.deleteById(vehicleId);
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
