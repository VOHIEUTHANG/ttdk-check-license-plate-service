/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');

const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleView = require('../resourceAccess/CustomerScheduleView');
const StationResource = require('../../Stations/resourceAccess/StationsResourceAccess');
const ScheduleFunctions = require('../CustomerScheduleFunctions');
const excelFunction = require('../../../ThirdParty/Excel/excelFunction');
const { padLeadingZeros, isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');

const Logger = require('../../../utils/logging');
const { UNKNOWN_ERROR, MISSING_AUTHORITY, NOT_FOUND } = require('../../Common/CommonConstant');
const CommonFunctions = require('../../Common/CommonFunctions');
const { SCHEDULE_ERROR, SCHEDULE_STATUS, SCHEDULE_CACHE_KEYS, VEHICLE_TYPE, PERFORMER_TYPE } = require('../CustomerScheduleConstants');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const CustomerRecordResourceAccess = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const AppUserDevicesFunctions = require('../../AppUserDevices/AppUserDevicesFunctions');

const CustomerRecordFunctions = require('../../CustomerRecord/CustomerRecordFunctions');
const CustomerCriminalRecordFunctions = require('../../CustomerCriminalRecord/CustomerCriminalRecordFunctions');
const CustomerCriminalResourceAccess = require('../../CustomerCriminalRecord/resourceAccess/CustomerCriminalRecordResourceAccess');

const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { makeHashFromData } = require('../../ApiUtils/utilFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const { logCustomerScheduleChanged } = require('../../SystemAppLogChangeSchedule/SystemAppLogChangeScheduleFunctions');
const AppUserRoleResourceAccess = require('../../AppUserRole/resourceAccess/AppUserRoleResourceAccess');
const CustomerScheduleAttachmentResourceAccess = require('../../CustomerScheduleAttachment/resourceAccess/CustomerScheduleAttachmentResourceAccess');
const CustomerScheduleChangeResourceAccess = require('../resourceAccess/CustomerScheduleChangeResourceAccess');
const CustomerScheduleTrackingResourceAccess = require('../resourceAccess/CustomerScheduleTrackingResourceAccess');

const { STATION_STATUS, AVAILABLE_STATUS, AUTO_CONFIRM_SCHEDULE } = require('../../Stations/StationsConstants');
const { STATIONS_AREA } = require('../../Stations/data/StationsArea');

let RedisInstance;
if (process.env.REDIS_ENABLE) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

async function _confirmScheduleBySMS(phone, scheduleData, stationData, scheduleId, appUserVehicleId) {
  const scheduleTime = ScheduleFunctions.modifyScheduleTime(scheduleData.time);
  let message = `TTDK.COM.VN ${stationData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã được xác nhận bởi nhân viên trung tâm. Thời gian hẹn của quý khách là ${scheduleTime} ${scheduleData.dateSchedule} và mã lịch hẹn là ${scheduleData.scheduleCode}. Vui lòng đến đúng khung giờ đã hẹn để tránh ùn tắc, cản trở giao thông. Trường hợp quý khách đến muộn thì lịch hẹn sẽ bị hủy mà không báo trước.`;
  await CustomerMessageFunctions.createNewUserMessageByStation(
    phone, //khong gui sms
    stationData.stationsId,
    message,
    scheduleData.licensePlates,
    scheduleData.appUserId,
    scheduleId,
    appUserVehicleId,
  );
}

async function _cancelScheduleBySMS(phone, scheduleData, stationData, reason) {
  let _hotline = stationData.stationsHotline ? stationData.stationsHotline : '';
  let message = ScheduleFunctions.generateMessageToCancelSchedule(stationData.stationCode, scheduleData.licensePlates, reason, _hotline);

  await CustomerMessageFunctions.createNewUserMessageByStation(
    '', //khong gui sms
    stationData.stationsId,
    message,
    scheduleData.licensePlates,
    scheduleData.appUserId,
    scheduleData.customerScheduleId,
  );
}

async function _notifyCancelScheduleToCustomer(existingSchedule, reason) {
  let selectedStation = await StationResource.findById(existingSchedule.stationsId);
  return _cancelScheduleBySMS(existingSchedule.phone, existingSchedule, selectedStation, reason);
}

async function clearCacheScheduleByUserId(appUserId) {
  const cacheKey = `USER_SCHEDULE_${appUserId}`;
  await RedisInstance.deleteKey(cacheKey);
}

async function _addNewCustomerSchedule(scheduleData, stationsData, appUser) {
  const isStationAvailable = !stationsData || stationsData.availableStatus !== AVAILABLE_STATUS.UNAVAILABLE;
  const isAutoConfirm = !stationsData || stationsData.enableConfigAutoConfirm !== AUTO_CONFIRM_SCHEDULE.DISABLE;

  if (isStationAvailable && isAutoConfirm) {
    scheduleData.CustomerScheduleStatus = SCHEDULE_STATUS.CONFIRMED;
  }

  // find appUserVehicle for this schedule
  const appUserVehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: scheduleData.licensePlates }, 0, 1);
  let appUserVehicleId = undefined;
  if (appUserVehicle && appUserVehicle.length > 0) {
    appUserVehicleId = appUserVehicle[0].appUserVehicleId;
  }

  let result = await ScheduleFunctions.createNewSchedule(scheduleData, stationsData, appUser);
  if (result) {
    let _newScheduleId = result[0];
    await ScheduleFunctions.updateBookingCountByDate(_newScheduleId);
    const scheduleTime = ScheduleFunctions.modifyScheduleTime(scheduleData.time);
    let message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã đặt thành công, vui lòng chờ trạm xác nhận.`;

    if (scheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
      message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã được xác nhận. Thời gian hẹn của quý khách là ${scheduleTime} ${scheduleData.dateSchedule} và mã lịch hẹn là ${scheduleData.scheduleCode}. Vui lòng đến đúng khung giờ đã hẹn để tránh ùn tắc, cản trở giao thông. Trường hợp quý khách đến muộn thì lịch hẹn sẽ bị hủy mà không báo trước.`;
    }

    // thông báo cho người dùng khi đặt lịch vào trung tâm đang quá tải
    if (!isStationAvailable) {
      message = `TTDK.COM.VN ${stationsData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} đã được ghi nhận nhưng tạm thời chưa thể xác nhận vì trạm đang trong tình trạng quá tải. Chúng tôi sẽ thông báo cho bạn ngày khi tình trạng này được khắc phục, xin cảm ơn.`;
    }

    let _title = `TTDK.COM.VN ${stationsData.stationCode} xác nhận lịch hẹn BSX ${scheduleData.licensePlates}`;

    const NO_PHONE_NUMBER = undefined; //khong can gui SMS
    await CustomerMessageFunctions.createMessageForCustomerOnly(_title, message, scheduleData.appUserId, NO_PHONE_NUMBER, scheduleData.email, {
      appUserVehicleId: appUserVehicleId,
      customerScheduleId: _newScheduleId,
    });
  } else {
    console.error(`can not add new schedule`);
  }
  return result;
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      customerScheduleData.createdBy = req.currentUser.staffId;
      //chua cho phep admin dat lich hen
      // let result = await _addNewCustomerSchedule(customerScheduleData, undefined, req.currentUser);
      // if (result) {
      //   resolve(result);
      // } else {
      //   reject('failed');
      // }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let endDate = req.payload.endDate;
      let startDate = req.payload.startDate;

      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      }

      if (startDate && endDate) {
        const startDateMoment = moment(startDate, 'DD/MM/YYYY');
        const endDateMoment = moment(endDate, 'DD/MM/YYYY');
        const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

        if (diffDateCount <= 0 || diffDateCount > 30) {
          return reject('invalid filter startDate and endDate');
        }

        const scheduleDateList = [];
        for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
          const scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');
          scheduleDateList.push(scheduleDate);
        }
        filter.dateSchedule = scheduleDateList;
      }

      const customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (customerScheduleList && customerScheduleList.length > 0) {
        const customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
        if (customerScheduleCount > 0) {
          _convertScheduleSerial(customerScheduleList);
          return resolve({ data: customerScheduleList, total: customerScheduleCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
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
      let customerScheduleId = req.payload.customerScheduleId;
      let customerScheduleData = req.payload.data;

      const previousRecord = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      if (customerScheduleData.scheduleNote) {
        const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(previousRecord.scheduleNote || '', customerScheduleData.scheduleNote);
        customerScheduleData.scheduleNote = updatedScheduleNote;
      }

      if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
        await ScheduleFunctions.cancelUserSchedule(previousRecord.appUserId, customerScheduleId);
        let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

        let _canceledReason = 'nhân viên trung tâm đăng kiểm đã hủy';
        await _notifyCancelScheduleToCustomer(_existingSchedule, _canceledReason);
      }

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);
      if (result) {
        if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
          let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
          let selectedStation = await StationResource.findById(_existingSchedule.stationsId);
          await _confirmScheduleBySMS(_existingSchedule.phone, _existingSchedule, selectedStation, customerScheduleId);
        }

        // save data changes
        await logCustomerScheduleChanged(previousRecord, customerScheduleData, req.currentUser, customerScheduleId);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function advanceUserUpdateSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      let customerScheduleData = req.payload.data;

      const previousRecord = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      if (customerScheduleData.scheduleNote) {
        const updatedScheduleNote = ScheduleFunctions.updateScheduleNote(previousRecord.scheduleNote || '', customerScheduleData.scheduleNote);
        customerScheduleData.scheduleNote = updatedScheduleNote;
      }

      if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
        await ScheduleFunctions.cancelUserSchedule(previousRecord.appUserId, customerScheduleId);
        let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

        let _canceledReason = 'nhân viên trung tâm đăng kiểm đã hủy';
        await _notifyCancelScheduleToCustomer(_existingSchedule, _canceledReason);
      }

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, customerScheduleData);
      if (result) {
        if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CONFIRMED) {
          let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
          let selectedStation = await StationResource.findById(_existingSchedule.stationsId);
          await _confirmScheduleBySMS(_existingSchedule.phone, _existingSchedule, selectedStation, customerScheduleId);

          // save confirmed schedule data
          await ScheduleFunctions.saveConfirmedScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.STATION_STAFF);
        }

        if (customerScheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED) {
          // save confirmed schedule data
          await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.STATION_STAFF);
        }

        // save data changes
        await logCustomerScheduleChanged(previousRecord, customerScheduleData, req.currentUser, customerScheduleId);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      let result = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (result) {
        _convertScheduleSerial([result]);
        await _fillDataAttachmentToSchedule(result);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;

      let result = await CustomerScheduleResourceAccess.updateById(customerScheduleId, {
        CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
      });
      if (result) {
        let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

        let _canceledReason = 'nhân viên của trung tâm đã hủy';
        await _notifyCancelScheduleToCustomer(_existingSchedule, _canceledReason);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function advanceUserInsertSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      const currentUser = req.currentUser;

      if (!currentUser.stationsId || !currentUser.appUserId || currentUser.appUserRoleId < 1) {
        return reject(MISSING_AUTHORITY);
      }

      const isValidRequest = await CommonFunctions.verifyPermission(['MANAGE_SCHEDULE', 'ADD_SCHEDULE'], currentUser.appUserRoleId);
      if (!isValidRequest) {
        return reject(SCHEDULE_ERROR.INVALID_REQUEST);
      }

      customerScheduleData.createdBy = currentUser.appUserId;

      let selectedStation = await StationResource.findById(currentUser.stationsId);

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;

        const appUserAccount = await AppUsersResourceAccess.find({ phoneNumber: customerScheduleData.phone }, 0, 1);

        if (appUserAccount && appUserAccount.length > 0) {
          _fillCustomerDataToSchedule(customerScheduleData, appUserAccount[0]);
        }

        let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);
        if (result) {
          // auto create customerRecord
          const customerScheduleId = result[0];
          const customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
          const createCustomerRecordResult = await CustomerRecordFunctions.insertCustomerRecordFromSchedule(customerSchedule);
          if (!createCustomerRecordResult) {
            console.error('create customerRecord from bookingSchedule failed !');
          } else {
            const customerRecordId = createCustomerRecordResult[0];
            await CustomerScheduleResourceAccess.updateById(customerScheduleId, { customerRecordId: customerRecordId });
          }
          _convertScheduleSerial([customerSchedule]);

          // save ip address
          const requestIp = require('request-ip');
          const clientIp = requestIp.getClientIp(req);
          const userId = req.currentUser.appUserId || req.currentUser.staffId;
          await ScheduleFunctions.saveBookingScheduleData(clientIp, userId, customerScheduleId);

          resolve(customerSchedule);
          // notify customer violations
          await _checkingCustomerViolations(customerScheduleData, selectedStation);
        }
      } else {
        console.error(`can not find station for userInsertSchedule`);
      }

      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        if (e === SCHEDULE_ERROR.UNCONFIRMED_BOOKING_EXISTED) {
          const filter = { licensePlates: req.payload.licensePlates, CustomerScheduleStatus: [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED] };
          let _existingNewBooking = (await CustomerScheduleResourceAccess.customSearch(filter, 0, 1)) || {};
          if (_existingNewBooking && _existingNewBooking.length > 0) {
            _existingNewBooking = _existingNewBooking[0];
          }
          return reject({
            errorMessage: e,
            errorData: _existingNewBooking,
          });
        }
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function _checkingCustomerViolations(customerScheduleData, selectedStation) {
  const customerViolations = await CustomerCriminalRecordFunctions.crawlCriminalRecord(customerScheduleData.licensePlates, 1);
  for (let crime of customerViolations) {
    const crimeTime = moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate();
    const previousData = await CustomerCriminalResourceAccess.find(
      { customerRecordPlatenumber: customerScheduleData.licensePlates, crimeRecordTime: crimeTime },
      0,
      1,
    );

    if (!previousData || previousData.length <= 0) {
      const data = {
        customerRecordPlatenumber: customerScheduleData.licensePlates,
        crimeRecordContent: crime.behavior,
        crimeRecordStatus: crime.status,
        crimeRecordTime: moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate(),
        crimeRecordPIC: crime.provider,
        crimeRecordLocation: crime.violationAddress,
        crimeRecordContact: crime.contactPhone,
      };

      await CustomerCriminalResourceAccess.insert(data);
    }

    // notify violation to customer
    if (crime.status === 'Chưa xử phạt') {
      const messageTitle = `Thông báo hệ thống từ ${selectedStation.stationsName}`;
      let message = `TTDK ${selectedStation.stationCode} thông báo: phương tiện biển số ${customerScheduleData.licensePlates} của quý khách được phạt hiện có vi phạm ${crime.behavior}, vui lòng kiểm tra xứ lý phạt nguội trước khi đăng kiểm, thông tin tham khảo từ csgt.vn`;

      await CustomerMessageFunctions.addMessageCustomer(
        messageTitle,
        selectedStation.stationsId,
        message,
        customerScheduleData.licensePlates,
        customerScheduleData.appUserId,
        customerScheduleData.email,
      );
    }
  }
}

async function userCreateSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleData = req.payload;
      const attachmentList = customerScheduleData.attachmentList;
      if (attachmentList) {
        delete customerScheduleData.attachmentList;
      }
      // save user devices
      const appUserId = req.currentUser.appUserId;
      const userAgent = req.headers['user-agent'];
      //TODO recheck later
      // await AppUserDevicesFunctions.saveUserDevice(appUserId, userAgent);

      let selectedStation = await StationResource.findById(req.payload.stationsId);

      if (selectedStation) {
        customerScheduleData.stationsId = selectedStation.stationsId;

        if (customerScheduleData.scheduleNote) {
          const scheduleNoteContent = ScheduleFunctions.updateScheduleNote(
            '',
            customerScheduleData.scheduleNote,
            req.currentUser.username || customerScheduleData.fullnameSchedule,
          );
          customerScheduleData.scheduleNote = scheduleNoteContent;
        }

        if (req.currentUser && req.currentUser.appUserId) {
          _fillCustomerDataToSchedule(customerScheduleData, req.currentUser);
          customerScheduleData.createdBy = req.currentUser.appUserId;
        }

        let result = await _addNewCustomerSchedule(customerScheduleData, selectedStation, req.currentUser);
        // await clearCacheScheduleByUserId(req.currentUser.appUserId);
        if (result) {
          // auto create customerRecord
          const customerScheduleId = result[0];
          const customerSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
          const createCustomerRecordResult = await CustomerRecordFunctions.insertCustomerRecordFromSchedule(customerSchedule);
          if (!createCustomerRecordResult) {
            console.error('create customerRecord from bookingSchedule failed !');
          } else {
            const customerRecordId = createCustomerRecordResult[0];
            await CustomerScheduleResourceAccess.updateById(customerScheduleId, { customerRecordId: customerRecordId });
          }

          // save ip address
          const requestIp = require('request-ip');
          const clientIp = requestIp.getClientIp(req);
          const userId = req.currentUser.appUserId || req.currentUser.staffId;
          await ScheduleFunctions.saveBookingScheduleData(clientIp, userId, customerScheduleId);

          // insert schedule attachments
          if (attachmentList && attachmentList.length > 0) {
            attachmentList.forEach(attachment => {
              attachment.customerScheduleId = customerScheduleId;
            });

            const insertResult = await CustomerScheduleAttachmentResourceAccess.insert(attachmentList);
            if (!insertResult) {
              Logger.error('Insert schedule attachment failed !');
            }
          }

          resolve(result);
          // notify customer violations
          await _checkingCustomerViolations(customerScheduleData, selectedStation);
        }
      } else {
        console.error(`can not find station for userCreateSchedule`);
      }

      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(SCHEDULE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

function _fillCustomerDataToSchedule(customerScheduleData, appUserAccount) {
  customerScheduleData.appUserId = appUserAccount.appUserId;

  if (appUserAccount.phoneNumber) {
    customerScheduleData.phone = appUserAccount.phoneNumber;
  }
  if (appUserAccount.firstName) {
    customerScheduleData.fullnameSchedule = appUserAccount.firstName;
  }
  if (appUserAccount.email) {
    customerScheduleData.email = appUserAccount.email;
  }
}

async function userGetDetailSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerScheduleId = req.payload.customerScheduleId;
      let _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (_existingSchedule) {
        if (_existingSchedule.appUserId !== req.currentUser.appUserId) {
          return reject(MISSING_AUTHORITY);
        }

        _convertScheduleSerial([_existingSchedule]);
        let _existingStation = await StationResource.findById(_existingSchedule.stationsId);
        if (_existingStation) {
          _existingSchedule.station = {
            stationsName: _existingStation.stationsName,
            stationCode: _existingStation.stationCode,
            stationsAddress: _existingStation.stationsAddress,
          };
        }

        let _existingCustomerRecord = await CustomerRecordResourceAccess.findById(_existingSchedule.customerRecordId);
        if (_existingCustomerRecord) {
          _existingSchedule.customerRecord = {
            customerRecordCheckStatus: _existingCustomerRecord.customerRecordCheckStatus,
          };
        }

        await _fillDataAttachmentToSchedule(_existingSchedule);
        resolve(_existingSchedule);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetListSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let searchText = req.payload.searchText;
      // let order = req.payload.order;
      // let endDate = req.payload.endDate;
      // let startDate = req.payload.startDate;

      // //only get data of current station
      // if (filter && req.currentUser.stationsId) {
      //   filter.stationsId = req.currentUser.stationsId;
      // }
      filter.appUserId = req.currentUser.appUserId;
      let responseBody = { data: [], total: 0 };
      // if (process.env.REDIS_ENABLE) {
      //   responseBody = await RedisInstance.getJson(`USER_SCHEDULE_${req.currentUser.appUserId}`);
      //   if (responseBody) {
      //     return resolve(responseBody);
      //   }
      // }

      let customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (customerScheduleList && customerScheduleList.length > 0) {
        _convertScheduleSerial(customerScheduleList);
        //TODO recheck performance later
        let customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText);
        let responseBody = { data: customerScheduleList, total: customerScheduleCount };
        // await RedisInstance.setWithExpire(`USER_SCHEDULE_${req.currentUser.appUserId}`, JSON.stringify(responseBody));
        resolve(responseBody);
      } else {
        resolve(responseBody);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _fillDataAttachmentToSchedule(schedule) {
  const scheduleId = schedule.customerScheduleId;
  const attachmentList = await CustomerScheduleAttachmentResourceAccess.find({ customerScheduleId: scheduleId }, 0, 20);
  if (attachmentList && attachmentList.length > 0) {
    schedule.attachmentList = attachmentList;
  } else {
    schedule.attachmentList = [];
  }
}

function _convertScheduleSerial(scheduleList) {
  scheduleList.forEach(schedule => {
    const serialNumber = schedule.scheduleSerial;
    schedule.scheduleSerial = padLeadingZeros(serialNumber, 4);
  });
}

async function userCancelSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      const reason = req.payload.reason || 'bạn đã xác nhận hủy';

      const confirmByStaffStationRecord = await CustomerScheduleChangeResourceAccess.find(
        { customerScheduleId: customerScheduleId, confirmedPerformerType: PERFORMER_TYPE.STATION_STAFF },
        0,
        1,
      );
      if (confirmByStaffStationRecord && confirmByStaffStationRecord.length > 0) {
        return reject(SCHEDULE_ERROR.CONFIRMED_BY_STATION_STAFF);
      }

      const _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      const result = await ScheduleFunctions.cancelUserSchedule(req.currentUser.appUserId, customerScheduleId, reason);
      // await clearCacheScheduleByUserId(req.currentUser.appUserId);
      if (result) {
        // save canceled schedule change
        await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.CUSTOMER);

        await _notifyCancelScheduleToCustomer(_existingSchedule, reason);
        await logCustomerScheduleChanged(
          _existingSchedule,
          { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED },
          req.currentUser,
          customerScheduleId,
        );
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function exportExcelCustomerSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const searchText = req.payload.searchText;

      //only export for current station, do not export data of other station
      if (!req.currentUser.stationsId) {
        return reject(MISSING_AUTHORITY);
      }
      filter.stationsId = req.currentUser.stationsId;

      let station = await StationsResourceAccess.findById(req.currentUser.stationsId);

      const _fileName = 'DSLH_' + moment().format('YYYYMMDDHHmm') + '.xlsx';
      const _filepath = 'uploads/exportExcel/' + _fileName;

      const scheduleList = [];
      let skip = 0;
      while (true) {
        let customerSchedule = await CustomerScheduleResourceAccess.customSearch(filter, skip, 50, undefined, undefined, searchText);
        if (customerSchedule && customerSchedule.length > 0) {
          scheduleList.push(...customerSchedule);
        } else {
          break;
        }
        skip += 50;
      }

      await _attachInfoForSchedule(scheduleList);

      let exportStatus = await _exportScheduleToExcel(scheduleList, station, _filepath);
      if (exportStatus) {
        let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + _filepath;
        resolve(newExcelUrl);
      } else {
        reject('false');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _exportScheduleToExcel(records, station, filepath) {
  const workSheetName = 'Danh sách lịch hẹn';
  const dataRows = [];

  //worksheet title
  const workSheetTitle = [
    'Trung tâm đăng kiểm',
    '', //break 1 columns
    '', //break 1 columns
    'Danh sách lịch hẹn đăng kiểm',
  ];
  dataRows.push(workSheetTitle);

  const stationCode = station ? `Mã: ${station.stationsName}` : '';
  let reportTime = `Danh sách lịch hẹn ngày ${moment().format('DD/MM/YYYY')}`;

  const workSheetInfo = [
    `${stationCode}`,
    '', //break 1 columns
    '', //break 1 columns
    reportTime,
  ];
  dataRows.push(workSheetInfo);
  dataRows.push(['']); //break 1 rows

  //table headers
  const workSheetColumnNames = [
    'Số TT',
    'Biển số xe',
    'Chủ phương tiện',
    'Số điện thoại',
    'Ngày đặt lịch đăng kiểm',
    'Giờ đặt lịch đăng kiểm',
    'Trạng thái lịch hẹn',
    'Ngày hết hạn',
    'Loại phương tiện',
  ];
  dataRows.push(workSheetColumnNames);

  //Table data
  records.forEach((record, index) => {
    let scheduleStatus = 'Lịch hẹn mới';
    switch (record.CustomerScheduleStatus) {
      case SCHEDULE_STATUS.CLOSED:
        scheduleStatus = 'Đã kết thúc';
        break;
      case SCHEDULE_STATUS.CONFIRMED:
        scheduleStatus = 'Đã xác nhận';
        break;
      case SCHEDULE_STATUS.CANCELED:
        scheduleStatus = 'Đã hủy';
        break;
    }

    let vehicleType = 'Ô tô con';
    switch (record.vehicleType) {
      case VEHICLE_TYPE.RO_MOOC:
        vehicleType = 'Xe rơ mooc, đầu kéo';
        break;
      case VEHICLE_TYPE.OTHER:
        vehicleType = 'Xe bán tải, phương tiện khác';
        break;
    }

    dataRows.push([
      index + 1,
      record.licensePlates,
      record.fullnameSchedule,
      record.phone,
      record.dateSchedule,
      record.time,
      scheduleStatus,
      record.vehicleExpiryDate || '',
      vehicleType,
    ]);
  });

  excelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
  return 'OK';
}

async function reportTotalByDay(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const filter = req.payload.filter || {};
      // checking is valid date
      const startDateMoment = moment(startDate, 'DD/MM/YYYY');
      const endDateMoment = moment(endDate, 'DD/MM/YYYY');
      const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

      const bookingQuantityData = [];

      for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
        const _scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');

        const bookingCount = await CustomerScheduleResourceAccess.customCount({
          ...filter,
          dateSchedule: _scheduleDate,
        });

        bookingQuantityData.push({
          date: _scheduleDate,
          quantity: bookingCount || 0,
        });
      }

      return resolve({ data: bookingQuantityData, total: bookingQuantityData.length });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function reportTotalScheduleByStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (startDate) {
        startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
      }
      if (endDate) {
        endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
      }

      const MAX_COUNT = 500;
      const allStations = await StationResource.find({ stationStatus: STATION_STATUS.ACTIVE, ...filter }, 0, MAX_COUNT);
      let stationBookingList = [];

      if (allStations && allStations.length > 0) {
        const promiseList = allStations.map(station => _countStationBooking(station, startDate, endDate));

        stationBookingList = await Promise.all(promiseList);
      }
      const result = _getLargestStationBookings(stationBookingList, 10);

      return resolve({ data: result, total: result.length });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _countStationBooking(station, startDate, endDate) {
  const stationBookingCount = await CustomerScheduleResourceAccess.customCount({ stationsId: station.stationsId }, startDate, endDate);

  return {
    stationsId: station.stationsId,
    stationName: station.stationsName,
    stationCode: station.stationCode,
    stationArea: station.stationArea,
    totalScheduleCount: stationBookingCount || 0,
  };
}

function _getLargestStationBookings(stationBookings, quantity = 10) {
  stationBookings.sort((a, b) => (a.totalScheduleCount < b.totalScheduleCount ? 1 : a.totalScheduleCount > b.totalScheduleCount ? -1 : 0));
  return stationBookings.slice(0, quantity);
}

async function reportTotalScheduleByStationArea(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      const promiseList = STATIONS_AREA.map(area => _calculateStationScheduleCount(area.value, startDate, endDate));

      const stationScheduleCountByArea = await Promise.all(promiseList);

      if (stationScheduleCountByArea) {
        _sortScheduleCountByArea(stationScheduleCountByArea);
        return resolve({ data: stationScheduleCountByArea, total: stationScheduleCountByArea.length });
      }

      return resolve({ data: [], total: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _calculateStationScheduleCount(stationArea, startDate, endDate) {
  const scheduleCount = await _filterScheduleByStartDateAndEndDate({ stationArea: stationArea }, startDate, endDate);

  return {
    stationArea: stationArea,
    totalScheduleCount: scheduleCount || 0,
  };
}

async function _filterScheduleByStartDateAndEndDate(filter, startDate, endDate, searchText, order) {
  if (startDate && endDate) {
    const startDateMoment = moment(startDate, 'DD/MM/YYYY');
    const endDateMoment = moment(endDate, 'DD/MM/YYYY');
    const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

    if (diffDateCount <= 0 || diffDateCount > 31) {
      console.error(`INVALID START DATE AND END DATE`);
      return 0;
    }

    const schedulePromiseList = [];
    for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
      const _dateSchedule = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');

      const scheduleCount = CustomerScheduleView.customCount({ ...filter, dateSchedule: _dateSchedule }, undefined, undefined, searchText, order);

      schedulePromiseList.push(scheduleCount);
    }

    const scheduleCountResult = await Promise.all(schedulePromiseList);

    return scheduleCountResult.reduce((acc, scheduleCount) => {
      return acc + scheduleCount || 0;
    }, 0);
  } else {
    return await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
  }
}

function _sortScheduleCountByArea(stationBookingCountList) {
  stationBookingCountList.sort((a, b) => (a.totalScheduleCount < b.totalScheduleCount ? 1 : a.totalScheduleCount > b.totalScheduleCount ? -1 : 0));
}

async function advanceUserGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      const isValidRequest = await CommonFunctions.verifyPermission(['MANAGE_SCHEDULE', 'VIEW_SCHEDULE'], req.currentUser.appUserRoleId);
      if (!isValidRequest) {
        return reject(SCHEDULE_ERROR.INVALID_REQUEST);
      }

      // get schedule of current station
      filter.stationsId = req.currentUser.stationsId;

      if (startDate && endDate) {
        const startDateMoment = moment(startDate, 'DD/MM/YYYY');
        const endDateMoment = moment(endDate, 'DD/MM/YYYY');
        const diffDateCount = endDateMoment.diff(startDateMoment, 'days');

        if (diffDateCount <= 0 || diffDateCount > 30) {
          return reject('invalid filter startDate and endDate');
        }

        const scheduleDateList = [];
        for (let dayCounter = 0; dayCounter <= diffDateCount; dayCounter++) {
          const scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');
          scheduleDateList.push(scheduleDate);
        }
        filter.dateSchedule = scheduleDateList;
      }

      const customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (customerScheduleList && customerScheduleList.length > 0) {
        const customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
        if (customerScheduleCount > 0) {
          _convertScheduleSerial(customerScheduleList);

          await _attachInfoForSchedule(customerScheduleList);

          return resolve({ data: customerScheduleList, total: customerScheduleCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _attachInfoForSchedule(scheduleList) {
  for (let schedule of scheduleList) {
    let vehicleExpiryDate = null;
    let username = null;

    if (schedule.appUserId) {
      const vehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: schedule.licensePlates, appUserId: schedule.appUserId }, 0, 1);
      if (vehicle && vehicle.length > 0) {
        vehicleExpiryDate = vehicle[0].vehicleExpiryDate;
      }
    }

    if (schedule.createdBy) {
      const appUser = await AppUsersResourceAccess.findById(schedule.createdBy);
      if (appUser) {
        username = appUser.username;
      }
    }

    schedule.vehicleExpiryDate = vehicleExpiryDate;
    schedule.username = username;
  }
}

async function advanceUserCancelSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      const reason = req.payload.reason || 'nhân viên trạm đã hủy';

      const _existingSchedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);

      if (!_existingSchedule || _existingSchedule.stationsId !== req.currentUser.stationsId) {
        return reject(NOT_FOUND);
      }
      const STATION_USER_CANCEL = true;
      let result = await ScheduleFunctions.cancelUserSchedule(_existingSchedule.appUserId, customerScheduleId, reason, STATION_USER_CANCEL);

      if (result) {
        // save cancel schedule data
        await ScheduleFunctions.saveCanceledScheduleData(customerScheduleId, req.currentUser.appUserId, PERFORMER_TYPE.STATION_STAFF);
        // notify cancel to customer
        await _notifyCancelScheduleToCustomer(_existingSchedule, reason);
        await logCustomerScheduleChanged(_existingSchedule, { CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED }, req.currentUser);
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function advanceUserSearchSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      const isValidRequest = await CommonFunctions.verifyPermission(['MANAGE_SCHEDULE', 'VIEW_SCHEDULE'], req.currentUser.appUserRoleId);
      if (!isValidRequest) {
        return reject(SCHEDULE_ERROR.INVALID_REQUEST);
      }

      const customerScheduleList = await CustomerScheduleView.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (customerScheduleList && customerScheduleList.length > 0) {
        const customerScheduleCount = await CustomerScheduleView.customCount(filter, undefined, undefined, searchText, order);
        if (customerScheduleCount > 0) {
          _convertScheduleSerial(customerScheduleList);
          return resolve({ data: customerScheduleList, total: customerScheduleCount });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
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
  userCreateSchedule,
  userGetDetailSchedule,
  userGetListSchedule,
  userCancelSchedule,
  exportExcelCustomerSchedule,
  reportTotalByDay,
  reportTotalScheduleByStation,
  reportTotalScheduleByStationArea,
  advanceUserInsertSchedule,
  advanceUserGetList,
  advanceUserCancelSchedule,
  advanceUserSearchSchedule,
  advanceUserUpdateSchedule,
};
