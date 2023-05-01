/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const CustomerRecordResourceAccess = require('../resourceAccess/CustomerRecordResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { SCHEDULE_STATUS, LICENSE_PLATE_COLOR } = require('../../CustomerSchedule/CustomerScheduleConstants');
const Logger = require('../../../utils/logging');
const CustomerFuntion = require('../CustomerRecordFunctions');
const CrimeFunction = require('../../CustomerCriminalRecord/CustomerCriminalRecordFunctions');
const Station = require('../../Stations/resourceAccess/StationsResourceAccess');
const CustomerRecordModel = require('../model/CustomerRecordModel');
const excelFunction = require('../../../ThirdParty/Excel/excelFunction');
const UploadFunctions = require('../../Upload/UploadFunctions');
const StationResource = require('../../Stations/resourceAccess/StationsResourceAccess');
const SystemAppLogFunctions = require('../../SystemAppChangedLog/SystemAppChangedLogFunctions');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');

const {
  CHECKING_STATUS,
  CUSTOMER_RECORD_PLATE_COLOR,
  CUSTOMER_RECORD_ERROR,
  CUSTOMER_RECORD_DB_DATE_FORMAT,
  CUSTOMER_RECORD_DISPLAY_DATE_FORMAT,
} = require('../CustomerRecordConstants');
const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const { isInvalidStringValue } = require('../../ApiUtils/utilFunctions');
const VarSyncServices = require('../../../ThirdParty/VARConnector/VarSyncServices');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { checkValidVehicleIdentity } = require('../../AppUserVehicle/AppUserVehicleFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerRecordData = req.payload;
      let staffId = req.currentUser.staffId;
      if (staffId) {
        customerRecordData.staffId = staffId;
      }

      customerRecordData.customerRecordCheckTime = CustomerFuntion.getCheckTime();
      //phan nay phai lam giong nhu FE dang submit de tranh bi sai format
      if (isInvalidStringValue(customerRecordData.customerRecordCheckDate)) {
        // customerRecordData.customerRecordCheckDate = moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT);
      }

      const customerPhoneNumber = customerRecordData.customerRecordPhone;
      if (customerPhoneNumber) {
        const appUser = await AppUsersResourceAccess.find({ phoneNumber: customerPhoneNumber }, 0, 1);
        if (appUser && appUser.length > 0) {
          customerRecordData.appUserId = appUser[0].appUserId;
        }
      }

      let addResult = await CustomerFuntion.addNewCustomerRecord(customerRecordData);

      if (addResult) {
        const CriminalRecordFunctions = require('../../CustomerCriminalRecord/CustomerCriminalRecordFunctions');

        // Crawl criminals
        CriminalRecordFunctions.bulkInsertCriminalRecords(customerRecordData.customerRecordPlatenumber, addResult[0]);

        let station = await StationResource.findById(customerRecordData.customerStationId);
        if (station) {
          const customerRecord = await CustomerRecordResourceAccess.findById(addResult[0]);
          await VarSyncServices.syncCustomerRecord(req.headers, {
            stationCode: station.stationCode,
            data: customerRecord,
          }).catch(function (err) {
            console.error(`Insert customerRecord to VAR failed`, err);
          });
        }
        resolve(addResult);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(CUSTOMER_RECORD_ERROR).indexOf(e) >= 0) {
        console.error(`error AppUserManage can not registerUser: ${e}`);
        reject(e);
      } else {
        console.error(`error AppUserManage can not registerUser: ${UNKNOWN_ERROR}`);
        reject(UNKNOWN_ERROR);
      }
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
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter && req.currentUser.stationsId !== undefined) {
        filter.customerStationId = req.currentUser.stationsId;
      }
      let customerRecord = await CustomerRecordResourceAccess.customSearchByExpiredDate(filter, skip, limit, startDate, endDate, searchText, order);
      for (let i = 0; i < customerRecord.length; i++) {
        customerRecord[i] = CustomerRecordModel.fromData(customerRecord[i]);
        customerRecord[i].hasCrime = await CrimeFunction.hasCrime(customerRecord[i].customerRecordPlatenumber);
      }
      let customerRecordCount = await CustomerRecordResourceAccess.customCountByExpiredDate(filter, startDate, endDate, searchText, order);
      if (customerRecord && customerRecordCount) {
        resolve({ data: customerRecord, total: customerRecordCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findToday(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter && req.currentUser.stationsId !== undefined) {
        filter.customerStationId = req.currentUser.stationsId;
      }
      filter.customerRecordCheckDate = moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT);

      let customerRecord = await CustomerRecordResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      for (let i = 0; i < customerRecord.length; i++) {
        customerRecord[i] = CustomerRecordModel.fromData(customerRecord[i]);
        customerRecord[i].hasCrime = await CrimeFunction.hasCrime(customerRecord[i].customerRecordPlatenumber);
      }
      let customerRecordCount = await CustomerRecordResourceAccess.customCount(filter, startDate, endDate, searchText, order);
      if (customerRecord && customerRecordCount) {
        resolve({ data: customerRecord, total: customerRecordCount });
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
      let customerRecordId = req.payload.id;
      let customerRecordData = req.payload.data;

      CustomerFuntion.checkCustomerRecordDate(customerRecordData);

      if (customerRecordData.customerRecordPlatenumber && !checkValidVehicleIdentity(customerRecordData.customerRecordPlatenumber)) {
        return reject(CUSTOMER_RECORD_ERROR.INVALID_PLATE_NUMBER);
      }

      //if user update record info manually, then we note it
      if (
        customerRecordData.customerRecordFullName ||
        customerRecordData.customerRecordEmail ||
        customerRecordData.customerRecordPhone ||
        customerRecordData.customerRecordPlatenumber ||
        customerRecordData.customerRecordPlateColor
      ) {
        customerRecordData.customerRecordModifyDate = new Date();
      }
      let customerRecordBefore = await CustomerRecordResourceAccess.findById(customerRecordId);
      if (!customerRecordBefore) {
        return reject(NOT_FOUND);
      }

      // find appUserVehicleId
      let appUserVehicleId;
      const userVehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: customerRecordBefore.customerRecordPlatenumber }, 0, 1);
      if (userVehicle && userVehicle.length > 0) {
        appUserVehicleId = userVehicle[0].appUserVehicleId;
      }

      // if update customerRecordCheckStatus is Completed then update customerRecordCheckExpiredDate
      if (customerRecordData.customerRecordCheckStatus === CHECKING_STATUS.COMPLETED && customerRecordBefore.customerRecordCheckDuration > 0) {
        const expiredDate = moment()
          .add(customerRecordBefore.customerRecordCheckDuration, 'months')
          .subtract(1, 'day')
          .format(CUSTOMER_RECORD_DB_DATE_FORMAT);
        customerRecordData.customerRecordCheckExpiredDate = expiredDate;
      }

      let result = await CustomerFuntion.updateCustomerRecordById(customerRecordId, customerRecordData);
      if (result) {
        await SystemAppLogFunctions.logCustomerRecordChanged(customerRecordBefore, customerRecordData, req.currentUser, customerRecordId);
        // notify checking status to customer
        if (customerRecordBefore.appUserId && customerRecordData.customerRecordCheckStatus) {
          await _notifyRecordStatusToCustomer(
            customerRecordData.customerRecordCheckStatus,
            customerRecordBefore.appUserId,
            customerRecordBefore.customerRecordEmail,
            customerRecordBefore.customerRecordPlatenumber,
            appUserVehicleId,
            customerRecordId,
          );
        }
        // notify checking step to customer
        if (customerRecordBefore.appUserId && customerRecordData.customerRecordState >= 0) {
          await _notifyCheckingStep(
            customerRecordData.customerRecordState,
            customerRecordBefore.appUserId,
            customerRecordBefore.customerRecordEmail,
            customerRecordBefore.customerStationId,
            customerRecordBefore.customerRecordPlatenumber,
            appUserVehicleId,
            customerRecordId,
          );
        }
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

async function _notifyRecordStatusToCustomer(checkingStatus, appUserId, appUserEmail, plateNumber, appUserVehicleId, customerRecordId) {
  let title = 'Thông báo trạng thái đăng kiểm';
  let message;
  switch (checkingStatus) {
    case CHECKING_STATUS.COMPLETED:
      message = `Phương tiện BSX ${plateNumber} của bạn đã đăng kiểm thành công. Vui lòng cập nhật lại ngày hết hạn của phương tiện để được tự động theo dõi hạn đăng kiểm và hỗ trợ đặt lịch tốt nhất`;
      break;
    case CHECKING_STATUS.FAILED:
      message = `Phương tiện BSX ${plateNumber} đã đăng kiểm thất bại. Vui lòng kiểm tra lại thông tin phương tiện. Mọi thắc mắc xin liên hệ trung tâm đăng kiểm để được hỗ trợ`;
      break;
    case CHECKING_STATUS.CANCELED:
      message = 'Lịch khám xe của bạn đã bị hủy. Vui lòng liên hệ trung tâm để được hỗ trợ';
      break;
    default:
      return;
  }

  await CustomerMessageFunctions.addMessageCustomer(
    title,
    undefined,
    message,
    undefined,
    appUserId,
    appUserEmail,
    appUserVehicleId,
    customerRecordId,
  );
}

async function _notifyCheckingStep(checkState, appUserId, appUserEmail, stationId, plateNumber, appUserVehicleId, customerRecordId) {
  const currentStation = await StationResource.findById(stationId);
  if (currentStation) {
    const checkingStep = JSON.parse(currentStation.stationCheckingConfig);
    let updatedStep = checkingStep.find(step => step.stepIndex === checkState);
    if (updatedStep) {
      const title = 'Thông báo khám xe';
      const message = `Phương tiện BSX ${plateNumber} :${updatedStep.stepLabel}`;

      await CustomerMessageFunctions.addMessageCustomer(
        title,
        undefined,
        message,
        undefined,
        appUserId,
        appUserEmail,
        appUserVehicleId,
        customerRecordId,
      );
    }
  }
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerRecordId = req.payload.id;
      let result = await CustomerRecordResourceAccess.findById(customerRecordId);

      if (result) {
        result = CustomerRecordModel.fromData(result);
        result.hasCrime = await CrimeFunction.hasCrime(result.customerRecordPlatenumber);
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
      let customerRecordId = req.payload.id;

      let oldRecord = await CustomerRecordResourceAccess.findById(customerRecordId);
      if (oldRecord === undefined) {
        reject('invalid record');
        return;
      }

      let result = await CustomerRecordResourceAccess.deleteById(customerRecordId);
      if (result) {
        await CustomerFuntion.notifyCustomerStatusDeleted(oldRecord);
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

async function _exportRecordToExcel(records, filepath, startDate, endDate, station) {
  let count = 0;

  const workSheetName = 'Danh sách khách hàng';
  const dataRows = [];

  //worksheet title
  const workSheetTitle = [
    'Trung tâm đăng kiểm',
    '', //break 1 columns
    '', //break 1 columns
    'Danh sách phương tiện đăng kiểm',
  ];
  dataRows.push(workSheetTitle);

  const stationCode = station ? `Mã: ${station.stationsName}` : '';
  let reportTime = ``;
  if (startDate || endDate) {
    reportTime = `Thời gian ${startDate ? 'từ ngày ' + startDate : ''} ${endDate ? 'đến ngày ' + endDate : ''}`;
  }
  const workSheetInfo = [
    `${stationCode}`,
    '', //break 1 columns
    '', //break 1 columns
    reportTime,
  ];
  dataRows.push(workSheetInfo);
  dataRows.push(['']); //break 1 rows

  //table headers
  const workSheetColumnNames = ['Số TT', 'Biển kiểm soát', 'Chủ phương tiện', 'Địa chỉ', 'Số điện thoại', 'Hết hạn'];
  dataRows.push(workSheetColumnNames);

  //Table data
  records.forEach(record => {
    var newDate = moment(record.customerRecordCheckExpiredDate, 'DD-MM-YYYY');
    var newDateFormat =
      record.customerRecordCheckExpiredDate !== null && record.customerRecordCheckExpiredDate !== '' ? newDate.format('DD/MM/YYYY') : '';

    count += 1;
    dataRows.push([count, record.customerRecordPlatenumber, record.customerRecordFullName, undefined, record.customerRecordPhone, newDateFormat]);
  });

  excelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
  return 'OK';
}

async function exportCustomerRecord(req) {
  let fileName = 'DSKH_' + new Date().toJSON().slice(0, 10) + '_' + Math.random().toString(36).substring(2, 15) + '.xlsx';
  //Tên File : DSKH_2021-10-12_nv5xj2uqzgf.xlsx
  const filepath = 'uploads/exportExcel/' + fileName;
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let skip = undefined;
      let limit = undefined;
      let order = undefined;
      //make sure startDate alwasy < endDate
      if (startDate && endDate) {
        if (new Date(startDate) - 1 - (new Date(endDate) - 1) > 0) {
          reject('INVALID_START_END_DATE');
          return;
        }
      }
      //only export for current station, do not export data of other station
      if (filter && req.currentUser.stationsId !== undefined) {
        filter.customerStationId = req.currentUser.stationsId;
      }
      let customerRecord = await CustomerRecordResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      let station = await Station.findById(req.currentUser.stationsId);

      let newData = await _exportRecordToExcel(customerRecord, filepath, startDate, endDate, station);
      if (newData) {
        let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + filepath;
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

async function importCustomerRecord(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let fileData = req.payload.file;
      let fileFormat = req.payload.fileFormat;
      let stationsId = req.currentUser.stationsId;
      if (!fileData) {
        reject('do not have book data');
        return;
      }
      var originaldata = Buffer.from(fileData, 'base64');
      let newExcel = await UploadFunctions.uploadExcel(originaldata, fileFormat);
      if (newExcel) {
        let path = 'uploads/importExcel/' + newExcel;
        let excelData = await excelFunction.importExcelOldformat(path);

        if (excelData === undefined) {
          reject('failed to import');
        } else {
          //notify to front-end
          //front-end will use this counter to display user waiting message
          if (excelData.length > 1000) {
            //!! IMPORTANT: do not return function here
            //if there are more than 1000 record, we will response before function done
            resolve({
              importSuccess: 'importSuccess',
              importTotalWaiting: excelData.length,
            });
          }

          //if it is less than 1000 records, let user wait until it finishes
          let needToImportRecords = await CustomerFuntion.convertExcelDataToCustomerRecord(excelData, stationsId);
          if (needToImportRecords === undefined) {
            reject('failed to convert excel to customer model');
            return;
          }
          // Find stations to get staionCode for sync to VAR
          let stations = StationResource.findById(stationsId);

          let importSuccessCount = 0;
          for (var i = 0; i < needToImportRecords.length; i++) {
            const IS_ADD_SERIAL_NUMBER = true;
            let addResult = await CustomerFuntion.addNewCustomerRecord(needToImportRecords[i], IS_ADD_SERIALNUMBER);
            if (addResult) {
              const customerRecord = await CustomerRecordResourceAccess.findById(addResult[0]);
              await VarSyncServices.syncCustomerRecord(req.headers, {
                stationCode: stations.stationCode,
                data: customerRecord,
              }).catch(function (err) {
                console.error('Import CustomerRecord to VAR failed', err);
              });

              importSuccessCount++;
            }
          }

          //if data is bigger than 1000 record, API will response before import,
          //then no need to respon here
          if (excelData.length < 1000) {
            resolve({
              importSuccess: importSuccessCount,
              importTotal: needToImportRecords.length,
            });
          }
        }
      } else {
        reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _storePlateNumberImage(station, payload) {
  return new Promise(async (resolve, reject) => {
    const fs = require('fs');
    let today = new Date();
    let dirName = `uploads/media/plate/${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
    if (payload.image !== undefined && payload.image.path !== undefined) {
      fs.readFile(payload.image.path, (err, data) => {
        if (err) {
          console.error('writeFile error');
          console.error(err);
          resolve(undefined);
          return;
        }

        // check if upload directory exists
        if (fs.existsSync(`uploads/media/plate`) === false) {
          fs.mkdirSync(`uploads/media/plate`);
        }

        // check if directory exists
        if (fs.existsSync(dirName) === false) {
          fs.mkdirSync(dirName);
        }

        var path = require('path');
        let newFileName = `station_${station.stationsId}_at_${moment().format('YYYYMMDDhhmmss')}${path.extname(payload.image.filename)}`;

        //write file to storage
        fs.writeFile(`${dirName}/${newFileName}`, data, async writeErr => {
          if (writeErr) {
            console.error('writeFile error');
            console.error(writeErr);
            resolve(undefined);
            return;
          }
          resolve(`https://${process.env.HOST_NAME}/${dirName}/${newFileName}`);
          return;
        });
      });
    } else {
      resolve(undefined);
    }
  });
}
//BEWARE !! This API is use for robot
async function robotInsert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let payload = req.payload;
      var hostname = req.headers.host;

      let station = await StationResource.find({ stationUrl: hostname }, 0, 1);

      //retry to find config with
      if (!station || station.length <= 0) {
        console.log(`can not find station by Url ${hostname} for robotInsert`);
        station = await StationResource.find({ stationLandingPageUrl: hostname }, 0, 1);
      }

      if (station === undefined || station.length < 1) {
        console.log(`can not find station by stationLandingPageUrl ${hostname} for robotInsert`);
        station = await StationResource.find({ stationWebhookUrl: hostname }, 0, 1);
        if (station === undefined || station.length < 1) {
          console.log(`can not find station by WebhookUrl ${hostname} for robotInsert`);
          reject('failed');
          return;
        }
      }
      station = station[0];

      let storeResult = await _storePlateNumberImage(station, payload);

      let customerRecordPlateColor = CUSTOMER_RECORD_PLATE_COLOR.WHITE;
      if (payload.color === 'T') {
        customerRecordPlateColor = CUSTOMER_RECORD_PLATE_COLOR.WHITE;
      } else if (payload.color === 'V') {
        customerRecordPlateColor = CUSTOMER_RECORD_PLATE_COLOR.YELLOW;
      } else if (payload.color === 'X') {
        customerRecordPlateColor = CUSTOMER_RECORD_PLATE_COLOR.BLUE;
      } else if (payload.color === 'D') {
        customerRecordPlateColor = CUSTOMER_RECORD_PLATE_COLOR.RED;
      }

      let newCustomerRecordData = {
        customerRecordPlatenumber: payload.bsx,
        customerRecordPlateImageUrl: storeResult ? storeResult : '',
        customerRecordPlateColor: customerRecordPlateColor,
      };
      if (station) {
        newCustomerRecordData.customerStationId = station.stationsId;
      }
      if (newCustomerRecordData.customerRecordCheckDuration === undefined) {
        newCustomerRecordData.customerRecordCheckDuration = null;
      }

      newCustomerRecordData.customerRecordCheckTime = CustomerFuntion.getCheckTime();

      //phan nay phai lam giong nhu FE dang submit de tranh bi sai format
      newCustomerRecordData.customerRecordCheckDate = moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT);

      let addResult = await CustomerFuntion.addNewCustomerRecord(newCustomerRecordData);
      if (addResult) {
        // Crawl criminals

        const CriminalRecordFunctions = require('../../CustomerCriminalRecord/CustomerCriminalRecordFunctions');
        CriminalRecordFunctions.bulkInsertCriminalRecords(newCustomerRecordData.customerRecordPlatenumber, addResult[0]);

        const customerRecord = await CustomerRecordResourceAccess.findById(addResult[0]);
        // Sync to VAR
        await VarSyncServices.syncCustomerRecord(req.headers, {
          stationCode: station.stationCode,
          data: customerRecord,
        }).catch(function (err) {
          console.error('Failed sync CustomerRecord to VAR in robotInert', err);
        });

        resolve(addResult);
      } else {
        reject('failed');
      }

      resolve('ok');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function registerFromSchedule(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;

      const linkedBooking = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (!linkedBooking) {
        return reject(CUSTOMER_RECORD_ERROR.INVALID_CUSTOMER_SCHEDULE);
      }

      // kiem tra lich hen da duoc tao record dang kiem truoc do chua
      const existedLinkedRecord = await CustomerRecordResourceAccess.find({ customerScheduleId: customerScheduleId });
      if (existedLinkedRecord && existedLinkedRecord.length > 0) {
        return reject(CUSTOMER_RECORD_ERROR.DUPLICATE_LINKED_BOOKING_SCHEDULE);
      }

      let addResult = await CustomerFuntion.insertCustomerRecordFromSchedule(linkedBooking);
      if (addResult) {
        // update customerRecordId for Schedule
        const customerRecordId = addResult[0];
        await CustomerScheduleResourceAccess.updateById(customerScheduleId, { customerRecordId: customerRecordId });

        resolve(addResult);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      if (filter && req.currentUser.stationsId !== undefined) {
        filter.customerStationId = req.currentUser.stationsId;
      }

      if (filter && filter.customerRecordCheckDate) {
        filter.customerRecordCheckDate = moment(filter.customerRecordCheckDate, CUSTOMER_RECORD_DISPLAY_DATE_FORMAT).format(
          CUSTOMER_RECORD_DB_DATE_FORMAT,
        );
      }

      if (filter && filter.customerRecordCheckExpiredDate) {
        filter.customerRecordCheckExpiredDate = moment(filter.customerRecordCheckExpiredDate, CUSTOMER_RECORD_DISPLAY_DATE_FORMAT).format(
          CUSTOMER_RECORD_DB_DATE_FORMAT,
        );
      }

      let customerRecord = await CustomerRecordResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      for (let i = 0; i < customerRecord.length; i++) {
        customerRecord[i] = CustomerRecordModel.fromData(customerRecord[i]);
        customerRecord[i].hasCrime = await CrimeFunction.hasCrime(customerRecord[i].customerRecordPlatenumber);
      }
      let customerRecordCount = await CustomerRecordResourceAccess.customCount(filter, startDate, endDate, searchText, order);
      if (customerRecord && customerRecordCount) {
        resolve({ data: customerRecord, total: customerRecordCount });
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
  exportCustomerRecord,
  importCustomerRecord,
  robotInsert,
  findToday,
  userGetList,
  registerFromSchedule,
};
