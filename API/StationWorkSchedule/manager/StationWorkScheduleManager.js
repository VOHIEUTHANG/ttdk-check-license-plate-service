'user strict';
const StationWorkScheduleResourceAccess = require('../resourceAccess/StationsWorkScheduleResourceAccess');
const StationWorkScheduleFunctions = require('../StationWorkScheduleFunctions');
const StatonResouceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const { STATION_WORK_SCHEDULE_ERRORS } = require('../StationWorkScheduleConstants');
const Logger = require('../../../utils/logging');
const moment = require('moment');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = req.payload;
      const stationsId = data.stationsId;
      const scheduleDate = moment(data.scheduleDayOff, 'DD/MM/YYYY').add(10, 'seconds').toDate();
      data.scheduleDate = scheduleDate;
      data.scheduleTime = JSON.stringify(data.scheduleTime);

      const targetStation = await StatonResouceAccess.findById(stationsId);
      if (!targetStation) {
        return reject(STATION_WORK_SCHEDULE_ERRORS.STATION_NOT_FOUND);
      }

      const result = await StationWorkScheduleResourceAccess.insert(data);
      if (result) {
        return resolve(result);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let { filter, startDate, endDate } = req.payload;

      startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
      endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();

      const stationWorkScheduleRecords = await StationWorkScheduleResourceAccess.customSearch(filter, startDate, endDate);

      if (stationWorkScheduleRecords && stationWorkScheduleRecords.length > 0) {
        return resolve({ data: stationWorkScheduleRecords, total: stationWorkScheduleRecords.length });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await StationWorkScheduleResourceAccess.findById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
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
      const id = req.payload.id;

      const oldRecord = await StationWorkScheduleResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      } else {
        const result = await StationWorkScheduleResourceAccess.deleteById(id);
        if (result === 1) {
          return resolve('success');
        } else {
          return reject(UNKNOWN_ERROR);
        }
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
      const updateData = req.payload.data;

      const targetRecord = await StationWorkScheduleResourceAccess.findById(id);

      if (targetRecord) {
        const result = await StationWorkScheduleResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserUpdateDayOff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updateData = req.payload.data;

      const targetRecord = await StationWorkScheduleResourceAccess.findById(id);

      if (targetRecord) {
        const result = await StationWorkScheduleResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userAddDayOff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = req.payload;
      data.stationsId = req.currentUser.stationsId;
      const scheduleDate = moment(data.scheduleDayOff, 'DD/MM/YYYY').add(10, 'seconds').toDate();
      data.scheduleDate = scheduleDate;

      data.scheduleTime = JSON.stringify(data.scheduleTime);

      const addResult = await StationWorkScheduleFunctions.addDayOffSchedule(data);

      if (addResult) {
        return resolve(addResult);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetListDayOff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let { filter, startDate, endDate } = req.payload;

      startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
      endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();

      filter.stationsId = req.currentUser.stationsId;

      let stationWorkScheduleRecords = await StationWorkScheduleResourceAccess.customSearch(filter, startDate, endDate);

      if (stationWorkScheduleRecords && stationWorkScheduleRecords.length > 0) {
        stationWorkScheduleRecords = stationWorkScheduleRecords.map(schedule => {
          return {
            ...schedule,
            scheduleTime: JSON.parse(schedule.scheduleTime),
          };
        });
        return resolve({ data: stationWorkScheduleRecords, total: stationWorkScheduleRecords.length });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = { insert, find, findById, deleteById, updateById, userGetListDayOff, userAddDayOff, advanceUserUpdateDayOff };
