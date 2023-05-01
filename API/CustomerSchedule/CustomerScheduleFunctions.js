/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const { isNotEmptyStringValue, padLeadingZeros, checkingValidPlateNumber } = require('../ApiUtils/utilFunctions');
const { SCHEDULE_ERROR, SCHEDULE_STATUS, SCHEDULE_CACHE_KEYS, PERFORMER_TYPE } = require('./CustomerScheduleConstants');
const CustomerScheduleResourceAccess = require('./resourceAccess/CustomerScheduleResourceAccess');
const StationsWorkScheduleFunctions = require('../StationWorkSchedule/StationWorkScheduleFunctions');
const CustomerRecordResourceAccess = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_CATEGORY } = require('../AppUsers/AppUsersConstant');
const CustomerScheduleChangeResourceAccess = require('../CustomerSchedule/resourceAccess/CustomerScheduleChangeResourceAccess');

const { VEHICLE_TYPE } = require('./CustomerScheduleConstants');
const { CHECKING_STATUS } = require('../CustomerRecord/CustomerRecordConstants');
const moment = require('moment');
const RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
const { checkValidVehicleIdentity } = require('../AppUserVehicle/AppUserVehicleFunctions');
const CustomerScheduleTrackingResourceAccess = require('./resourceAccess/CustomerScheduleTrackingResourceAccess');

function getLimitVehicleByType(vehicleType, config) {
  let _scheduleLimit = 0;
  switch (vehicleType) {
    case VEHICLE_TYPE.CAR:
      _scheduleLimit = config.limitSmallCar || 0;
      break;
    case VEHICLE_TYPE.RO_MOOC:
      if (config.limitRoMooc) {
        _scheduleLimit = config.limitRoMooc || 0;
      }
      break;
    case VEHICLE_TYPE.OTHER:
      _scheduleLimit = config.limitOtherVehicle || 0;
      break;
  }
  return _scheduleLimit;
}

function _getBookingLimitFromConfig(hourRange, bookingConfig, vehicleType) {
  let _limit = 0;

  if (!vehicleType) {
    vehicleType = VEHICLE_TYPE.OTHER;
  }
  for (let i = 0; i < bookingConfig.length; i++) {
    const _config = bookingConfig[i];
    if (_config.time === hourRange && _config.enableBooking) {
      _limit = getLimitVehicleByType(vehicleType, _config);
    }
  }
  return _limit;
}

async function _countScheduleByStationId(stationId, filter, skip, limit) {
  let _currentConfirmedBookingCount = 0;

  // if (process.env.REDIS_ENABLE) {
  //   let _cacheValue = await RedisInstance.get(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_STATION_ID}_${stationId}`);
  //   if (_cacheValue) {
  //     console.log(`_cacheValue ${_currentConfirmedBookingCount}`)
  //     _currentConfirmedBookingCount = _cacheValue;
  //     return _currentConfirmedBookingCount;
  //   }
  // }

  _currentConfirmedBookingCount = await CustomerScheduleResourceAccess.customSearch(
    {
      ...filter,
      stationsId: stationId,
    },
    skip,
    limit,
  );
  if (_currentConfirmedBookingCount && _currentConfirmedBookingCount.length > 0) {
    _currentConfirmedBookingCount = _currentConfirmedBookingCount.length;
  } else {
    _currentConfirmedBookingCount = 0;
  }

  // if (process.env.REDIS_ENABLE) {
  //   await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_STATION_ID}_${stationId}`, _currentConfirmedBookingCount * 1, 3600);
  // }

  return _currentConfirmedBookingCount;
}

async function _cacheScheduleByPlateNumber(plateNumber, bookingCount) {
  if (process.env.REDIS_ENABLE) {
    await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_PLATE_NUMBER}_${plateNumber}`, bookingCount);
  }
}

async function _cacheScheduleByUserId(appUserId, bookingCount) {
  if (process.env.REDIS_ENABLE) {
    await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_USER_ID}_${appUserId}`, bookingCount);
  }
}

async function _cacheScheduleByPhoneNumber(phoneNumber, bookingCount) {
  if (process.env.REDIS_ENABLE) {
    await RedisInstance.setWithExpire(`${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_PHONE}_${phoneNumber}`, bookingCount);
  }
}

async function _countScheduleByPlateNumber(plateNumber, bookingStatuses = []) {
  let _currentConfirmedBookingCount = 0;

  let _existingBookingList = await CustomerScheduleResourceAccess.customSearch({ licensePlates: plateNumber }, 0, 100);

  if (_existingBookingList && _existingBookingList.length > 0) {
    for (let i = 0; i < bookingStatuses.length; i++) {
      const _status = bookingStatuses[i];
      const _filteredBookingList = _existingBookingList.filter(_booking => _booking.CustomerScheduleStatus === _status);
      _currentConfirmedBookingCount += _filteredBookingList.length;
    }
  } else {
    _currentConfirmedBookingCount = 0;
  }

  return _currentConfirmedBookingCount;
}

//bookingCount === 1 => tang
//bookingCount === -1 => giam
async function updateBookingCountByDate(customerScheduleId, bookingCount = 1) {
  if (process.env.REDIS_ENABLE * 1 !== 1) {
    return;
  }
  let scheduleData = await CustomerScheduleResourceAccess.findById(customerScheduleId);
  if (scheduleData) {
    let redisKey = SCHEDULE_CACHE_KEYS.SUCCESS_SCHEDULE_COUNT_BY_STATION;
    redisKey = redisKey.replace('{stationsId}', `${scheduleData.stationsId}`);
    redisKey = redisKey.replace('{scheduleDate}', `${scheduleData.dateSchedule}`);
    redisKey = redisKey.replace('{vehicleType}', `${scheduleData.vehicleType}`);

    const cacheData = await RedisInstance.getJson(redisKey);
    let successBookingsCount = 0;
    if (cacheData) {
      successBookingsCount = cacheData.successBookingsCount;
    } else {
      const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];

      successBookingsCount = await CustomerScheduleResourceAccess.customCount({
        stationsId: scheduleData.stationsId,
        dateSchedule: scheduleData.dateSchedule,
        CustomerScheduleStatus: successBookingStatus,
        vehicleType: scheduleData.vehicleType,
      });
    }
    successBookingsCount += bookingCount;

    if (successBookingsCount !== undefined && successBookingsCount !== null) {
      await RedisInstance.setWithExpire(redisKey, JSON.stringify({ successBookingsCount: successBookingsCount * 1 }), 3600);
    }
  }
}

async function createNewSchedule(scheduleData, station, appUser) {
  if (!station || !station.stationsId) {
    console.error(`createNewSchedule INVALID_STATION`);
    console.error(scheduleData);
    console.error(station);
    throw SCHEDULE_ERROR.INVALID_STATION;
  }

  if (!isNotEmptyStringValue(station.stationBookingConfig)) {
    throw SCHEDULE_ERROR.INVALID_BOOKING_CONFIG;
  }
  if (!checkingValidPlateNumber(scheduleData.licensePlates)) {
    throw SCHEDULE_ERROR.INVALID_PLATE_NUMBER;
  }

  // Kiem tra lich co dat vao ngay nghi cua tram hay khong
  const isUserBookingOnDayOff = await StationsWorkScheduleFunctions.checkUserBookingOnDayOff(
    scheduleData.dateSchedule,
    scheduleData.time,
    station.stationsId,
  );
  if (isUserBookingOnDayOff) {
    throw SCHEDULE_ERROR.BOOKING_ON_DAY_OFF;
  }

  let _stationBookingConfig = JSON.parse(station.stationBookingConfig);

  //nếu không cho phép đặt quá giới hạn thì sẽ kiểm tra số lượng
  let _overbookingEnable = station.enableConfigAllowBookingOverLimit && station.enableConfigAllowBookingOverLimit * 1 === 1;
  if (!_overbookingEnable) {
    await _countScheduleLimit();
  }

  //nếu cho phép quá giới hạn nhưng người đặt không phải là nhân viên trung tâm
  //thì cũng sẽ kiểm tra số lượng
  let _staffBooking = appUser && appUser.appUserRoleId > 0;
  if (_overbookingEnable && !_staffBooking) {
    await _countScheduleLimit();
  }

  // gioi han so luong lich hen cua nguoi dung
  const [scheduleCountByUserId, scheduleCountByPhoneNumber, scheduleCountByPlateNumber] = await _checkingLimitSchedule(scheduleData);

  await _addScheduleSerial(scheduleData, station.stationsId);
  _addScheduleCode(scheduleData, station.stationCode);

  let result = await CustomerScheduleResourceAccess.insert(scheduleData);

  if (result) {
    // update redis count value
    await _cacheScheduleByPlateNumber(scheduleData.licensePlates, scheduleCountByPlateNumber + 1);
    await _cacheScheduleByUserId(scheduleData.appUserId, scheduleCountByUserId + 1);
    await _cacheScheduleByPhoneNumber(scheduleData.phone, scheduleCountByPhoneNumber + 1);
  }
  return result;

  async function _countScheduleLimit() {
    let _bookingLimit = _getBookingLimitFromConfig(scheduleData.time, _stationBookingConfig, scheduleData.vehicleType);
    if (_bookingLimit === 0) {
      throw SCHEDULE_ERROR.BOOKING_MAX_LIMITED_BY_CONFIG;
    }

    //khong duoc dat qua so luong gioi han
    let _currentBookingCount = await _countScheduleByStationId(
      scheduleData.stationsId,
      {
        time: scheduleData.time,
        dateSchedule: scheduleData.dateSchedule,
        CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED],
        vehicleType: scheduleData.vehicleType,
      },
      0,
      _bookingLimit + 1,
    );
    console.log(_currentBookingCount);
    if (_bookingLimit <= _currentBookingCount) {
      throw SCHEDULE_ERROR.BOOKING_MAX_LIMITED;
    }
  }
}

async function _addScheduleSerial(scheduleData, stationsId) {
  const dateSchedule = scheduleData.dateSchedule;
  const timeSchedule = scheduleData.time;
  let serialNumber = 1;
  let currentNumberOfBookings = await CustomerScheduleResourceAccess.find(
    { dateSchedule: dateSchedule, time: timeSchedule, stationsId: stationsId },
    0,
    1,
    { key: 'scheduleSerial', value: 'desc' },
  );

  if (currentNumberOfBookings && currentNumberOfBookings.length > 0) {
    serialNumber = currentNumberOfBookings[0].scheduleSerial + 1;
  }

  scheduleData.scheduleSerial = serialNumber;
}

async function _checkingLimitSchedule(scheduleData) {
  const LIMIT_SCHEDULE = 10;

  let scheduleCountByUserId = 0;
  let scheduleCountByPhoneNumber = 0;
  let scheduleCountByPlateNumber = 0;

  // 1 BSX khong duoc dat lich hen 2 lan
  let _existingNewBooking = await _countScheduleByPlateNumber(scheduleData.licensePlates, [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED]);
  if (_existingNewBooking && _existingNewBooking > 0) {
    throw SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED;
  }

  // mot tai khoan ca nhan khong dat qua 20 lich hen
  let _appUser = undefined;
  if (scheduleData.appUserId) {
    _appUser = await AppUsersResourceAccess.findById(scheduleData.appUserId);

    //tai khoan ca nhan (khong phai nhan vien trung tam va khong phai tai khoan doanh nghiep)
    //thi bi gioi han khong duoc dat qua 20 lich hen
    if (_appUser && _appUser.appUserCategory !== APP_USER_CATEGORY.COMPANY_ACCOUNT && _appUser.appUserRoleId <= 0) {
      scheduleCountByUserId = await _countScheduleByUserId(scheduleData.appUserId);
      if (scheduleCountByUserId >= LIMIT_SCHEDULE) {
        throw SCHEDULE_ERROR.MAX_LIMIT_SCHEDULE_BY_USER;
      }

      // kiem tra so dien thoai khong dat qua 20 lich hen (1 SDT co khi co nhieu tai khoan do xoa tai khoan)
      if (scheduleData.phone) {
        scheduleCountByPhoneNumber = await _countScheduleByPhone(scheduleData.phone);
      }
      if (scheduleCountByPhoneNumber >= LIMIT_SCHEDULE) {
        throw SCHEDULE_ERROR.MAX_LIMIT_SCHEDULE_BY_PHONE;
      }
    }

    scheduleCountByPlateNumber = await _countScheduleByPlateNumber(scheduleData.licensePlates);
    // khach hang khong duoc dat/huy lich qua 10 lan trong 1 nam
    const MAX_LIMIT_PLATE_NUMBER_BOOKING_PER_YEAR = 5;
    if (scheduleCountByPlateNumber >= MAX_LIMIT_PLATE_NUMBER_BOOKING_PER_YEAR) {
      throw SCHEDULE_ERROR.MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER;
    }
  }
  return [scheduleCountByUserId, scheduleCountByPhoneNumber, scheduleCountByPlateNumber];
}

async function _countScheduleByUserId(appUserId) {
  const REDIS_KEY = `${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_USER_ID}_${appUserId}`;
  let scheduleCount;

  if (process.env.REDIS_ENABLE) {
    const cacheValue = await RedisInstance.get(REDIS_KEY);
    if (cacheValue) {
      scheduleCount = Number(cacheValue);
    }
  }

  if (scheduleCount === undefined) {
    scheduleCount = (await CustomerScheduleResourceAccess.count({ appUserId: appUserId })) || 0;
    // cache value
    if (process.env.REDIS_ENABLE) {
      await _cacheScheduleByUserId(appUserId, scheduleCount);
    }
  }

  return scheduleCount;
}

async function _countScheduleByPhone(phoneNumber) {
  const REDIS_KEY = `${SCHEDULE_CACHE_KEYS.SCHEDULE_COUNT_BY_PHONE}_${phoneNumber}`;
  let scheduleCount;

  if (process.env.REDIS_ENABLE) {
    const cacheValue = await RedisInstance.get(REDIS_KEY);
    if (cacheValue) {
      scheduleCount = Number(cacheValue);
    }
  }

  if (scheduleCount === undefined) {
    scheduleCount = (await CustomerScheduleResourceAccess.count({ phone: phoneNumber })) || 0;
    // cache value
    if (process.env.REDIS_ENABLE) {
      await _cacheScheduleByPhoneNumber(phoneNumber, scheduleCount);
    }
  }

  return scheduleCount;
}

function _addScheduleCode(scheduleData, stationCode) {
  const dateSchedule = scheduleData.dateSchedule;
  const serialNumber = scheduleData.scheduleSerial || 1;

  const separateTime = dateSchedule.split('/');
  const dateFormatDD = separateTime[0];
  const monthFormatMM = separateTime[1];
  const timeFormatHHmm = moment().format('HHmm');

  const scheduleCode = `${stationCode}${dateFormatDD}${monthFormatMM}${timeFormatHHmm}${padLeadingZeros(serialNumber, 3)}`;
  scheduleData.scheduleCode = scheduleCode;
}

async function cancelUserSchedule(appUserId, customerScheduleId, reason, isStationUserCancel) {
  let _customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
  if (_customerSchedule.appUserId !== appUserId) {
    console.error(`cancelUserSchedule failed appUserId ${appUserId} - customerScheduleId ${customerScheduleId}`);
    return undefined;
  }

  if (_customerSchedule && ![SCHEDULE_STATUS.CANCELED, SCHEDULE_STATUS.CLOSED].includes(_customerSchedule.CustomerScheduleStatus)) {
    let customerScheduleData = {
      CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
    };
    if (reason) {
      let performer = 'TTDK';
      if (!isStationUserCancel) {
        const appUser = await AppUsersResourceAccess.findById(appUserId);
        if (appUser) {
          performer = appUser.username;
        } else {
          performer = _customerSchedule.fullnameSchedule;
        }
      }
      const cancelReason = updateScheduleNote(_customerSchedule.scheduleNote || '', reason, performer);
      customerScheduleData.scheduleNote = cancelReason;
    }
    let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);
    if (result) {
      //huy lich thi xoa record dang kiem
      const likedCustomerRecords = await CustomerRecordResourceAccess.findById(_customerSchedule.customerRecordId);
      if (likedCustomerRecords) {
        await CustomerRecordResourceAccess.deleteById(likedCustomerRecords.customerRecordId);
      }
    }
    return result;
  } else {
    console.error(`already cancel`);
    throw SCHEDULE_ERROR.ALREADY_CANCEL;
  }
}

async function deleteScheduleOfAppUser(appUserId) {
  let skip = 0;
  const limit = 50;
  while (true) {
    const scheduleBunch = await CustomerScheduleResourceAccess.find({ appUserId: appUserId }, 0, limit);
    if (scheduleBunch && scheduleBunch.length > 0) {
      const deleteScheduleList = scheduleBunch.map(schedule => CustomerScheduleResourceAccess.deleteById(schedule.customerScheduleId));
      await Promise.all(deleteScheduleList);
    } else {
      break;
    }
    skip += limit;
  }
}

async function saveBookingScheduleData(clientIp, userId, customerScheduleId) {
  const trackingData = {
    scheduleIpAddress: clientIp,
    scheduleUserId: userId,
  };

  const existedRecord = await CustomerScheduleTrackingResourceAccess.findById(customerScheduleId);
  if (existedRecord) {
    return CustomerScheduleTrackingResourceAccess.updateById(customerScheduleId, trackingData);
  } else {
    trackingData.customerScheduleId = customerScheduleId;
    return CustomerScheduleTrackingResourceAccess.insert(trackingData);
  }
}

function generateMessageToCancelSchedule(stationCode, licensePlates, reason, hotline) {
  return `TTDK.COM.VN ${stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${licensePlates} đã bị hủy${
    reason ? ' do ' + reason : ''
  }. Mọi thắc mắc xin liên hệ CSKH ${hotline} để được hỗ trợ.`;
}

function updateScheduleNote(previousNote, newNote, appUserName = 'TTDK') {
  const currentDate = moment().format('DD/MM/YYYY - HH:mm');
  const noteLabel = appUserName + ' - ' + currentDate;

  const newScheduleNote = previousNote + '\n' + noteLabel + '\n' + newNote;

  return newScheduleNote;
}

async function saveCanceledScheduleData(scheduleId, canceledBy, performerType) {
  const data = {
    customerScheduleId: scheduleId,
    canceledBy: canceledBy,
    canceledTime: new Date(),
    canceledPerformerType: performerType,
  };

  return CustomerScheduleChangeResourceAccess.insert(data);
}

async function saveConfirmedScheduleData(scheduleId, confirmedBy, performerType) {
  const data = {
    confirmedBy: confirmedBy,
    confirmedTime: new Date(),
    confirmedPerformerType: performerType,
    customerScheduleId: scheduleId,
  };
  return CustomerScheduleChangeResourceAccess.insert(data);
}

function modifyScheduleTime(scheduleTime) {
  if (scheduleTime === "7h-9h") {
    return "7h30-9h30";
  }

  if (scheduleTime === "15h30-17h30") {
    return "15h-16h30";
  }

  return scheduleTime;
}

module.exports = {
  createNewSchedule,
  cancelUserSchedule,
  updateBookingCountByDate,
  deleteScheduleOfAppUser,
  generateMessageToCancelSchedule,
  getLimitVehicleByType,
  updateScheduleNote,
  saveCanceledScheduleData,
  saveConfirmedScheduleData,
  saveBookingScheduleData,
  modifyScheduleTime
};
