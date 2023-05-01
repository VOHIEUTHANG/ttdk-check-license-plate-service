/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');

const MQTTFunctions = require('../../ThirdParty/MQTTBroker/MQTTBroker');
const TextToSpeechFunctions = require('../../ThirdParty/TextToSpeech/TextToSpeechFunctions');
const StationsResource = require('../Stations/resourceAccess/StationsResourceAccess');
const CustomerRecordResourceAccess = require('./resourceAccess/CustomerRecordResourceAccess');
const CustomerRecordModel = require('./model/CustomerRecordModel');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const { LICENSE_PLATE_COLOR } = require('../CustomerSchedule/CustomerScheduleConstants');
const Logger = require('../../utils/logging');
const Utils = require('../ApiUtils/utilFunctions');
const {
  CHECKING_STATUS,
  CUSTOMER_RECORD_ERROR,
  CUSTOMER_RECORD_DB_DATE_FORMAT,
  CUSTOMER_RECORD_DISPLAY_DATE_FORMAT,
  CHECKING_TIME_07_09,
  CHECKING_TIME_0930_1130,
  CHECKING_TIME_1330_1500,
  CHECKING_TIME_1530_1730,
} = require('./CustomerRecordConstants');

function getCheckTime() {
  let _current = moment();
  let _time0930 = moment('09:30', 'HH:mm');
  let _time1130 = moment('11:30', 'HH:mm');
  let _time1530 = moment('15:30', 'HH:mm');
  let _time1730 = moment('17:30', 'HH:mm');

  if (_time0930.diff(_current) < 0) {
    return CHECKING_TIME_07_09;
  } else if (_time1130.diff(_current) < 0) {
    return CHECKING_TIME_0930_1130;
  } else if (_time1530.diff(_current) < 0) {
    return CHECKING_TIME_1330_1500;
  } else if (_time1730.diff(_current) < 0) {
    return CHECKING_TIME_1530_1730;
  }
  //qua gio lam viec
  return null;
}

async function convertExcelDataToCustomerRecord(excelData, stationsId) {
  let dataStation = await StationsResourceAccess.findById(stationsId);
  if (dataStation === undefined) {
    Logger.error(`can not convertExcelDataToCustomerRecord for station ${stationsId} invalid`);
    return undefined;
  }

  //every imported record were done in the past,
  //when import old records, we will update process to last step
  let lastStepIndex = 0;
  try {
    let dataStationNew = JSON.parse(dataStation.stationCheckingConfig);
    lastStepIndex = dataStationNew[dataStationNew.length - 1].stepIndex;
  } catch (error) {
    Logger.error(`can not convertExcelDataToCustomerRecord - Station ${stationsId} can not parse stationCheckingConfig`);
  }

  //get index of last step
  let customerRecordState = lastStepIndex;

  //convert to Array CustomerRecord
  let arrData = [];
  for (let dataCounter = 0; dataCounter < excelData.length; dataCounter++) {
    const record = excelData[dataCounter];

    //find existing record
    let existedRecord = await CustomerRecordResourceAccess.customSearchByExpiredDate(
      {
        customerRecordPlatenumber: record.customerRecordPlatenumber,
        customerStationId: stationsId,
      },
      0,
      1,
      record.customerRecordCheckExpiredDate,
      record.customerRecordCheckExpiredDate,
    );

    //skip record if duplicated
    if (existedRecord && existedRecord.length > 0) {
      continue;
    }

    let _newPlateNumber = Utils.removeSpecialChars(record.customerRecordPlatenumber);
    let _customerRecordData = {
      customerRecordFullName: record.customerRecordFullName,
      customerRecordPhone: record.customerRecordPhone,
      customerRecordPlatenumber: _newPlateNumber,
      customerRecordEmail: record.customerRecordEmail,
      customerStationId: stationsId,
      customerRecordCheckDuration: null, //prevent DB crash
      customerRecordCheckDate: moment().format('DD/MM/YYYY'), //prevent DB crash
      customerRecordCheckExpiredDate: record.customerRecordCheckExpiredDate
        ? moment(record.customerRecordCheckExpiredDate, 'DD/MM/YYYY').add(1, 'h').toDate()
        : null,
      customerRecordState: customerRecordState,
      customerRecordCheckStatus: CHECKING_STATUS.COMPLETED, //Auto complete all old record when import
    };

    arrData.push(_customerRecordData);
  }

  return arrData;
}

async function _retriveVoicesUrlByState(stationsId, state) {
  let stationConfigs = await StationsResource.findById(stationsId);
  if (stationConfigs) {
    if (stationConfigs.stationCheckingConfig) {
      try {
        let configsStates = JSON.parse(stationConfigs.stationCheckingConfig);
        if (configsStates.length > 0) {
          for (let i = 0; i < configsStates.length; i++) {
            const stateObj = configsStates[i];
            if (stateObj.stepIndex === state) {
              return stateObj.stepVoiceUrl;
            }
          }
        } else {
          //Can not find config
          console.error(`can not find stationCheckingConfig for stationsId ${stationsId}`);
        }
      } catch (error) {
        //Config has error
        console.error(error);
        console.error(`stationCheckingConfig error for stationsId ${stationsId}`);
      }
    }
  } else {
    //Can not find config
    console.error(`Can not find config for stationsId ${stationsId}`);
  }

  return undefined;
}

async function notifyCustomerStatusChanged(updatedCustomerRecord) {
  let plateSpeeches = await TextToSpeechFunctions.getPlateSpeechUrls(updatedCustomerRecord.customerRecordPlatenumber);
  let processSpeech = await _retriveVoicesUrlByState(updatedCustomerRecord.customerStationId, updatedCustomerRecord.customerRecordState);
  //if state do not have voice Url, then we do not need to speech plate number
  if (processSpeech === undefined || processSpeech.trim() === '') {
    plateSpeeches = [];
  }

  MQTTFunctions.publishJson(`RECORD_UPDATE_${updatedCustomerRecord.customerStationId}`, {
    when: new Date(),
    ...CustomerRecordModel.fromData(updatedCustomerRecord),
    plateSpeeches: plateSpeeches,
    processSpeech: processSpeech ? processSpeech : '',
  });
}

async function notifyCustomerStatusAdded(newCustomerRecord) {
  let plateSpeeches = await TextToSpeechFunctions.getPlateSpeechUrls(newCustomerRecord.customerRecordPlatenumber);
  let processSpeech = await _retriveVoicesUrlByState(newCustomerRecord.customerStationId, newCustomerRecord.customerRecordState);
  //if state do not have voice Url, then we do not need to speech plate number
  if (processSpeech === undefined || processSpeech.trim() === '') {
    plateSpeeches = [];
  }

  if (plateSpeeches === undefined || plateSpeeches.length === 0) {
    plateSpeeches = [];
    processSpeech = [];
  }

  MQTTFunctions.publishJson(`RECORD_ADD_${newCustomerRecord.customerStationId}`, {
    when: new Date(),
    ...CustomerRecordModel.fromData(newCustomerRecord),
    plateSpeeches: plateSpeeches,
    processSpeech: processSpeech ? processSpeech : '',
  });
}

async function notifyCustomerStatusDeleted(newCustomerRecord) {
  let plateSpeeches = await TextToSpeechFunctions.getPlateSpeechUrls(newCustomerRecord.customerRecordPlatenumber);
  let processSpeech = await _retriveVoicesUrlByState(newCustomerRecord.customerStationId, newCustomerRecord.customerRecordState);
  //if state do not have voice Url, then we do not need to speech plate number
  if (processSpeech === undefined || processSpeech.trim() === '') {
    plateSpeeches = [];
  }
  MQTTFunctions.publishJson(`RECORD_DELETE_${newCustomerRecord.customerStationId}`, {
    when: new Date(),
    ...CustomerRecordModel.fromData(newCustomerRecord),
    plateSpeeches: plateSpeeches,
    processSpeech: processSpeech ? processSpeech : '',
  });
}

async function updateCustomerRecordById(customerRecordId, customerRecordData) {
  let oldRecord = await CustomerRecordResourceAccess.findById(customerRecordId);
  if (oldRecord === undefined) {
    console.error(`can not updateCustomerRecordById ${customerRecordId} because record is undefined`);
    return undefined;
  }

  //if update process state, then record time of changing state
  if (customerRecordData.customerRecordState !== undefined) {
    //update process check date to NOW
    customerRecordData.customerRecordProcessCheckDate = new Date();

    let recordStation = await StationsResource.findById(oldRecord.customerStationId);
    if (recordStation === undefined) {
      console.error(`can not updateCustomerRecordById ${customerRecordId} because station ${oldRecord.customerStationId} is undefined`);
      return undefined;
    }

    //check config and update to new step duration
    let checkConfig = JSON.parse(recordStation.stationCheckingConfig);
    try {
      checkConfig = JSON.parse(recordStation.stationCheckingConfig);
    } catch (error) {
      console.error(error);
    }

    //invalid config then we show error
    if (checkConfig === undefined) {
      console.error(
        `can not updateCustomerRecordById ${customerRecordId} because checkConfig of station ${oldRecord.customerStationId} is undefined`,
      );
      return undefined;
    }

    let validConfig = false;
    for (let i = 0; i < checkConfig.length; i++) {
      const stepConfig = checkConfig[i];
      if (stepConfig.stepIndex === customerRecordData.customerRecordState) {
        validConfig = true;
        customerRecordData.customerRecordCheckStepDuration = stepConfig.stepDuration;
      }
    }

    //invalid config then we show error
    if (validConfig === false) {
      console.error(`can not updateCustomerRecordById ${customerRecordId} because config ${customerRecordData.customerRecordState} is undefined`);
      return undefined;
    }
  }

  let result = await CustomerRecordResourceAccess.updateById(customerRecordId, customerRecordData);

  if (result) {
    if (customerRecordData.customerRecordState !== undefined) {
      let updatedRecord = await CustomerRecordResourceAccess.findById(customerRecordId);
      await notifyCustomerStatusChanged(updatedRecord);
    }
    return result;
  }
  return undefined;
}

function checkCustomerRecordDate(customerRecordData, autoFill = true) {
  if (customerRecordData.customerRecordCheckDate && customerRecordData.customerRecordCheckDuration) {
    if (Utils.isInvalidStringValue(customerRecordData.customerRecordCheckExpiredDate)) {
      customerRecordData.customerRecordCheckExpiredDate = moment(customerRecordData.customerRecordCheckDate, CUSTOMER_RECORD_DB_DATE_FORMAT)
        .add(customerRecordData.customerRecordCheckDuration, 'month')
        .format(CUSTOMER_RECORD_DB_DATE_FORMAT);
    }
  }

  return customerRecordData;
}

async function addNewCustomerRecord(customerRecordData, skipSerial) {
  let customerRecordPlatenumber = customerRecordData.customerRecordPlatenumber;

  checkCustomerRecordDate(customerRecordData);

  if (customerRecordData.customerRecordCheckTime === null) {
    customerRecordData.customerRecordCheckTime = getCheckTime();
  }
  if (!Utils.checkingValidPlateNumber(customerRecordPlatenumber)) {
    throw CUSTOMER_RECORD_ERROR.INVALID_PLATE_NUMBER;
  }

  //Fill customer data based on history data
  let resultPlate = await CustomerRecordResourceAccess.find({ customerRecordPlatenumber: customerRecordPlatenumber }, 0, 20);
  if (resultPlate !== undefined && resultPlate.length > 0) {
    if (customerRecordData.customerRecordFullName === undefined) {
      customerRecordData.customerRecordFullName = resultPlate[0].customerRecordFullName;
    }
    if (customerRecordData.customerRecordPhone === undefined) {
      customerRecordData.customerRecordPhone = resultPlate[0].customerRecordPhone;
    }
    if (customerRecordData.customerRecordEmail === undefined) {
      customerRecordData.customerRecordEmail = resultPlate[0].customerRecordEmail;
    }

    //mark if this customer comeback
    customerRecordData.returnNumberCount = resultPlate.length;
  }

  //kiem tra xem co trung lich trong ngay khong
  for (let i = 0; i < resultPlate.length; i++) {
    const _existingPlate = resultPlate[i];
    if (_existingPlate.customerRecordCheckStatus === CHECKING_STATUS.CANCELED) {
      continue;
    }

    if (
      customerRecordData.customerRecordCheckDate !== null &&
      _existingPlate.customerRecordCheckDate !== null &&
      customerRecordData.customerRecordCheckDate === _existingPlate.customerRecordCheckDate
    ) {
      console.info(`Duplicate ${customerRecordData.customerRecordPlatenumber} customerRecordCheckDate ${customerRecordData.customerRecordCheckDate}`);
      throw CUSTOMER_RECORD_ERROR.DUPLICATED_RECORD_IN_ONE_DAY;
    } else if (
      customerRecordData.customerRecordCheckExpiredDate !== null &&
      _existingPlate.customerRecordCheckExpiredDate !== null &&
      customerRecordData.customerRecordCheckExpiredDate === _existingPlate.customerRecordCheckExpiredDate
    ) {
      console.info(
        `Duplicate ${customerRecordData.customerRecordPlatenumber} customerRecordCheckExpiredDate ${customerRecordData.customerRecordCheckExpiredDate}`,
      );
      throw CUSTOMER_RECORD_ERROR.DUPLICATED_RECORD_IN_ONE_DAY;
    }
  }
  if (!skipSerial) {
    await _addRecordSerial(customerRecordData);
  }
  let result = await CustomerRecordResourceAccess.insert(customerRecordData);
  if (result) {
    //get inserted data
    let newRecord = await CustomerRecordResourceAccess.findById(result[0]);

    //notify to realtime data
    if (newRecord && newRecord.length > 0) {
      await notifyCustomerStatusAdded(newRecord[0]);
    }
    return result;
  }

  return undefined;
}

async function _addRecordSerial(customerRecord) {
  const checkDate = customerRecord.customerRecordCheckDate;
  const checkTime = customerRecord.customerRecordCheckTime;
  let serialNumber = 1;
  let customerRecordList = await CustomerRecordResourceAccess.find(
    { customerRecordCheckDate: checkDate, customerRecordCheckTime: checkTime, customerStationId: customerRecord.customerStationId },
    0,
    1,
    { key: 'serialNumber', value: 'desc' },
  );

  if (customerRecordList && customerRecordList.length > 0) {
    if (customerRecordList[0].serialNumber) {
      serialNumber = customerRecordList[0].serialNumber + 1;
    } else {
      serialNumber = customerRecordList.length + 1;
    }
  }

  customerRecord.serialNumber = serialNumber;

  customerRecord.serialSortValue = _createSerialSortValue(checkTime, serialNumber);
}

function _createSerialSortValue(time, serialNumber) {
  let result = '';

  if (time) {
    const separateTime = time.split('-');
    let startTime = separateTime[0];
    let endTime = separateTime[1];

    startTime = startTime.split('h');
    endTime = endTime.split('h');

    result += Utils.padLeadingZeros(startTime[0], 2) + Utils.padLeadingZeros(startTime[1], 2);
    result += Utils.padLeadingZeros(endTime[0], 2) + Utils.padLeadingZeros(endTime[1], 2);
    result += Utils.padLeadingZeros(serialNumber, 4);
  } else {
    result = '-----';
  }

  return result;
}

function insertCustomerRecordFromSchedule(bookingSchedule) {
  const customerRecord = { customerScheduleId: bookingSchedule.customerScheduleId };
  _autoFillDataFromBooking(bookingSchedule, customerRecord);
  return addNewCustomerRecord(customerRecord);
}

function _autoFillDataFromBooking(bookingSchedule, customerRecordData) {
  if (bookingSchedule.licensePlates && bookingSchedule.licensePlates !== '') {
    customerRecordData.customerRecordPlatenumber = bookingSchedule.licensePlates;
  }
  if (bookingSchedule.phone && bookingSchedule.phone !== '') {
    customerRecordData.customerRecordPhone = bookingSchedule.phone;
  }
  if (bookingSchedule.fullnameSchedule && bookingSchedule.fullnameSchedule !== '') {
    customerRecordData.customerRecordFullName = bookingSchedule.fullnameSchedule;
  }
  if (bookingSchedule.email && bookingSchedule.email !== '') {
    customerRecordData.customerRecordEmail = bookingSchedule.email;
  }
  if (bookingSchedule.licensePlateColor) {
    let plateColor = 'white';
    switch (bookingSchedule.licensePlateColor) {
      case LICENSE_PLATE_COLOR.BLUE:
        plateColor = 'blue';
        break;
      case LICENSE_PLATE_COLOR.YELLOW:
        plateColor = 'yellow';
        break;
      case LICENSE_PLATE_COLOR.RED:
        plateColor = 'red';
        break;
    }
    customerRecordData.customerRecordPlateColor = plateColor;
  }
  customerRecordData.customerStationId = bookingSchedule.stationsId;
  customerRecordData.customerRecordCheckDate = bookingSchedule.dateSchedule;
  customerRecordData.appUserId = bookingSchedule.appUserId;
  customerRecordData.customerRecordCheckTime = bookingSchedule.time;
}

async function deleteRecordOfAppUser(appUserId) {
  const MAX_COUNT = 500;
  const recordList = await CustomerRecordResourceAccess.find({ appUserId: appUserId }, 0, MAX_COUNT);

  if (recordList && recordList.length > 0) {
    const promiseList = recordList.map(record => CustomerRecordResourceAccess.deleteById(record.customerRecordId));
    await Promise.all(promiseList);
  }
}

module.exports = {
  addNewCustomerRecord,
  convertExcelDataToCustomerRecord,
  notifyCustomerStatusChanged,
  notifyCustomerStatusAdded,
  notifyCustomerStatusDeleted,
  updateCustomerRecordById,
  checkCustomerRecordDate,
  getCheckTime,
  insertCustomerRecordFromSchedule,
  deleteRecordOfAppUser,
};
