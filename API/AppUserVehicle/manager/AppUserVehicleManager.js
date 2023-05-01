/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

'use strict';
const moment = require('moment');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const AppUserVehicleFunctions = require('../AppUserVehicleFunctions');
const AppUserVehicleView = require('../resourceAccess/AppUserVehicleView');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');
const { addMessageCustomer } = require('../../CustomerMessage/CustomerMessageFunctions');
const { logVehicleChanged } = require('../../SystemAppLogChangeVehicle/SystemAppLogChangeVehicleFunctions');

const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');

const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const { USER_VEHICLE_ERROR } = require('../AppUserVehicleConstant');
const Logger = require('../../../utils/logging');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

let RedisInstance;
if (process.env.REDIS_ENABLE) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

async function clearCacheVehicleByUserId(appUserId) {
  const cacheKey = `USER_VEHICLE_${appUserId}`;
  await RedisInstance.deleteKey(cacheKey);
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let recordList = await AppUserVehicleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (recordList && recordList.length > 0) {
        let recordCount = await AppUserVehicleView.customCount(filter, undefined, undefined, searchText);
        if (recordCount) {
          for (let vehicle of recordList) {
            if (vehicle.appUserId > 0) {
              const appUser = await AppUsersResourceAccess.findById(vehicle.appUserId);
              if (appUser && appUser.username) {
                vehicle.username = appUser.username;
              }
            }
          }

          return resolve({ data: recordList, total: recordCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await AppUserVehicleResourceAccess.findById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updatedData = req.payload.data;

      const previousData = await AppUserVehicleResourceAccess.findById(id);
      if (!previousData) {
        return reject(NOT_FOUND);
      }

      let updateResult = await AppUserVehicleResourceAccess.updateById(id, updatedData);

      if (updateResult) {

        await logVehicleChanged(previousData, updatedData, req.currentUser, id);
        resolve(updateResult);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await AppUserVehicleResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userDeleteVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let _existingVehicle = await AppUserVehicleResourceAccess.findById(id);
      if (_existingVehicle && _existingVehicle.appUserId === req.currentUser.appUserId) {
        let result = await AppUserVehicleResourceAccess.deleteById(id);
        if (result) {
          // cancel schedule of deleted vehicle
          const licensePlates = _existingVehicle.vehicleIdentity;

          const newSchedules = await CustomerScheduleResourceAccess.customSearch(
            { licensePlates: licensePlates, CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED] },
            0,
            20,
          );
          if (newSchedules && newSchedules.length > 0) {
            for (let schedule of newSchedules) {
              await CustomerScheduleFunctions.cancelUserSchedule(req.currentUser.appUserId, schedule.customerScheduleId);
              const station = await StationsResourceAccess.findById(schedule.stationsId);

              const reason = 'người dùng xóa phương tiện';
              const notifyContent = CustomerScheduleFunctions.generateMessageToCancelSchedule(
                schedule.stationCode,
                schedule.licensePlates,
                reason,
                station.stationsHotline,
              );
              const notifyTitle = `Lịch hẹn BSX ${schedule.licensePlates} bị hủy`;
              await addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, schedule.appUserId);
            }
          }

          return resolve(result);
        }
      }
      reject(UNKNOWN_ERROR);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      const currentAppUserId = req.currentUser.appUserId;
      filter.appUserId = currentAppUserId || 0;

      let recordList = await AppUserVehicleResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (recordList && recordList.length > 0) {
        let recordCount = await AppUserVehicleResourceAccess.customCount(filter, undefined, undefined, searchText, order);
        if (recordCount) {
          return resolve({ data: recordList, total: recordCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      console.error(e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetDetail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const currentUserId = req.currentUser.appUserId;
      const result = await AppUserVehicleResourceAccess.findById(id);

      if (result && result.appUserId === currentUserId) {
        return resolve(result);
      } else {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userRegisterVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      if (req.currentUser.appUserId) {
        data.appUserId = req.currentUser.appUserId;
      }

      const isValidVehicle = AppUserVehicleFunctions.checkValidVehicleIdentity(data.vehicleIdentity, data.vehicleType, data.vehiclePlateColor);
      if (!isValidVehicle) {
        return reject(USER_VEHICLE_ERROR.INVALID_PLATE_NUMBER);
      }
      const result = await AppUserVehicleFunctions.addNewUserVehicle(data);
      if (result) {
        // await clearCacheVehicleByUserId(req.currentUser.appUserId);
        return resolve(result);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function userUpdateVehicle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updatedData = req.payload.data;

      let _existingVehicle = await AppUserVehicleResourceAccess.findById(id);
      if (!_existingVehicle) {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }

      if (_existingVehicle.appUserId !== req.currentUser.appUserId) {
        return reject(USER_VEHICLE_ERROR.VEHICLE_NOT_FOUND);
      }

      let data = {
        ..._existingVehicle,
        ...updatedData,
      };

      const isValidVehicle = AppUserVehicleFunctions.checkValidVehicleIdentity(data.vehicleIdentity, data.vehicleType, data.vehiclePlateColor);
      if (!isValidVehicle) {
        return reject(USER_VEHICLE_ERROR.INVALID_PLATE_NUMBER);
      }

      let updateResult = await AppUserVehicleResourceAccess.updateById(id, updatedData);

      if (updateResult) {

        await logVehicleChanged(_existingVehicle, updatedData, req.currentUser, id);
        resolve(updateResult);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
module.exports = {
  find,
  updateById,
  findById,
  deleteById,
  userDeleteVehicle,
  userGetList,
  userGetDetail,
  userRegisterVehicle,
  userUpdateVehicle,
};
