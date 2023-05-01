const StationsWorkScheduleResourceAccess = require('./resourceAccess/StationsWorkScheduleResourceAccess');
const { ALLOW_VEHICLE_TYPE_STATUS, CACHE_KEYS } = require('./StationWorkScheduleConstants');
const { VEHICLE_TYPE } = require('../CustomerSchedule/CustomerScheduleConstants');
const RedisInstance = require('../../ThirdParty/Redis/RedisInstance');

async function _getCachedStationWork(stationsId, scheduleDate) {
  let scheduleOffList = undefined;
  if (process.env.REDIS_ENABLE) {
    let redisKey = CACHE_KEYS.STATION_WORK_SCHEDULE_BY_DATE;
    redisKey = redisKey.replace('{stationsId}', stationsId);
    redisKey = redisKey.replace('{dateSchedule}', scheduleDate);

    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      scheduleOffList = cacheData;
    }
  }
  return scheduleOffList;
}
async function checkUserBookingOnDayOff(bookingDate, bookingTime, stationsId, vehicleType) {
  let scheduleOffList = undefined;

  scheduleOffList = await _getCachedStationWork(stationsId, bookingDate);

  if (!scheduleOffList) {
    scheduleOffList = await StationsWorkScheduleResourceAccess.find({
      scheduleDayOff: bookingDate,
      stationsId: stationsId,
    });
    if (process.env.REDIS_ENABLE) {
      let redisKey = CACHE_KEYS.STATION_WORK_SCHEDULE_BY_DATE;
      redisKey = redisKey.replace('{stationsId}', stationsId);
      redisKey = redisKey.replace('{dateSchedule}', bookingDate);

      await RedisInstance.setWithExpire(redisKey, JSON.stringify(scheduleOffList), 3600);
    }
  }

  if (scheduleOffList && scheduleOffList.length > 0) {
    const workStatus = scheduleOffList[0];

    switch (vehicleType) {
      case VEHICLE_TYPE.CAR:
        if (workStatus.enableSmallCar === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
          return true;
        }
        break;
      case VEHICLE_TYPE.OTHER:
        if (workStatus.enableOtherVehicle === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
          return true;
        }
        break;
      case VEHICLE_TYPE.RO_MOOC:
        if (workStatus.enableRoMooc === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
          return true;
        }
        break;
    }

    const scheduleTime = JSON.parse(workStatus.scheduleTime);
    for (let timeVal of scheduleTime) {
      if (timeVal.time === bookingTime && timeVal.isWorking === 0) {
        return true;
      }
    }
  }

  return false;
}

async function addDayOffSchedule(dayOffSchedule) {
  const existDayOffList = await StationsWorkScheduleResourceAccess.find({
    scheduleDayOff: dayOffSchedule.scheduleDayOff,
    stationsId: dayOffSchedule.stationsId,
  });
  let _dayOffId = undefined;
  if (!existDayOffList || existDayOffList.length <= 0) {
    _dayOffId = await StationsWorkScheduleResourceAccess.insert(dayOffSchedule);
    _dayOffId = _dayOffId[0];
  } else {
    const existedDayOff = existDayOffList[0];
    if (existedDayOff.stationWorkScheduleId > 0) {
      _dayOffId = existedDayOff.stationWorkScheduleId;
      await StationsWorkScheduleResourceAccess.updateById(existedDayOff.stationWorkScheduleId, dayOffSchedule);
    }
  }

  if (process.env.REDIS_ENABLE) {
    let scheduleOffList = await StationsWorkScheduleResourceAccess.find({
      scheduleDayOff: dayOffSchedule.scheduleDayOff,
      stationsId: dayOffSchedule.stationsId,
    });

    let redisKey = CACHE_KEYS.STATION_WORK_SCHEDULE_BY_DATE;
    redisKey = redisKey.replace('{stationsId}', dayOffSchedule.stationsId);
    redisKey = redisKey.replace('{dateSchedule}', dayOffSchedule.scheduleDayOff);

    await RedisInstance.setWithExpire(redisKey, JSON.stringify(scheduleOffList), 3600);
  }

  return dayOffSchedule;
}

async function getWorkStatusListByDate(stationsId, bookingDate) {
  let dayOffList = undefined;
  dayOffList = await _getCachedStationWork(stationsId, bookingDate);

  if (dayOffList === undefined || dayOffList === null) {
    dayOffList = await StationsWorkScheduleResourceAccess.find({ stationsId: stationsId, scheduleDayOff: bookingDate }, 0, 1);
    if (process.env.REDIS_ENABLE) {
      let redisKey = CACHE_KEYS.STATION_WORK_SCHEDULE_BY_DATE;
      redisKey = redisKey.replace('{stationsId}', stationsId);
      redisKey = redisKey.replace('{dateSchedule}', bookingDate);

      await RedisInstance.setWithExpire(redisKey, JSON.stringify(dayOffList), 3600);
    }
  }

  const workScheduleConfig = {
    enableOtherVehicle: ALLOW_VEHICLE_TYPE_STATUS.ENABLE,
    enableRoMooc: ALLOW_VEHICLE_TYPE_STATUS.ENABLE,
    enableSmallCar: ALLOW_VEHICLE_TYPE_STATUS.ENABLE,
    timeOffList: [],
  };

  if (dayOffList && dayOffList.length > 0) {
    const currentDayOff = dayOffList[0];
    workScheduleConfig.enableOtherVehicle = currentDayOff.enableOtherVehicle;
    workScheduleConfig.enableRoMooc = currentDayOff.enableRoMooc;
    workScheduleConfig.enableSmallCar = currentDayOff.enableSmallCar;

    const timeOffList = JSON.parse(currentDayOff.scheduleTime || '{}');
    workScheduleConfig.timeOffList = timeOffList.filter(timeOff => !timeOff.isWorking).map(timeOff => timeOff.time);
  }

  return workScheduleConfig;
}

module.exports = {
  checkUserBookingOnDayOff,
  addDayOffSchedule,
  getWorkStatusListByDate,
};
