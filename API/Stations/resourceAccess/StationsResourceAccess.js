/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { STATION_STATUS, VERIFY_STATUS, STATION_CONTACT_STATUS, STATION_TYPE } = require('../StationsConstants');
const { AVAILABLE_STATUS, BOOKING_ON_CURRENT_DATE, AUTO_CONFIRM_SCHEDULE, BOOKING_OVER_LIMIT } = require('../StationsConstants');
const {
  CHECKING_TIME_07_09,
  CHECKING_TIME_0930_1130,
  CHECKING_TIME_1330_1500,
  CHECKING_TIME_1530_1730,
} = require('../../CustomerRecord/CustomerRecordConstants');
const tableName = 'Stations';
const primaryKeyField = 'stationsId';

function _getDefaultCheckingConfig() {
  let defaultConfig = [
    {
      stepIndex: 0,
      stepLabel: 'Nhận xe cuối dây chuyền',
      stepVoice: 'Nhận xe cuối dây chuyền',
      stepDuration: 10, //minutes
      stepVoiceUrl: `https://${process.env.HOST_NAME}/uploads/voices/nhan-xe-cuoi-day-chuyen.mp3`,
    },
    {
      stepIndex: 1,
      stepLabel: 'Nộp phí đường bộ cửa 1',
      stepVoice: 'Nộp phí đường bộ cửa 1',
      stepDuration: 10, //minutes
      stepVoiceUrl: `https://${process.env.HOST_NAME}/uploads/voices/nop-phi-duong-bo-cua-1.mp3`,
    },
    {
      stepIndex: 2,
      stepLabel: 'Nhận giấy tờ xe cửa 2',
      stepVoice: 'Nhận giấy tờ xe cửa 2',
      stepDuration: 10, //minutes
      stepVoiceUrl: `https://${process.env.HOST_NAME}/uploads/voices/nhan-giay-to-xe-cua-2.mp3`,
    },
    {
      stepIndex: 3,
      stepLabel: 'Ra xe, chờ dán tem',
      stepVoice: 'Ra xe, chờ dán tem',
      stepDuration: 10, //minutes
      stepVoiceUrl: `https://${process.env.HOST_NAME}/uploads/voices/ra-xe-cho-dan-tem.mp3`,
    },
    {
      stepIndex: 4,
      stepLabel: 'Trả kết quả kiểm định cửa 4',
      stepVoice: 'Trả kết quả kiểm định cửa 4',
      stepDuration: 10, //minutes
      stepVoiceUrl: `https://${process.env.HOST_NAME}/uploads/voices/tra-ket-qua-kiem-dinh-cua-4.mp3`,
    },
  ];
  return JSON.stringify(defaultConfig);
}

function _getDefaultBookingConfig() {
  let defaultBookingConfig = [
    {
      index: 0,
      time: CHECKING_TIME_07_09,
      limitSmallCar: 40,
      limitOtherVehicle: 20,
      limitRoMooc: 5,
      enableBooking: 1,
    },
    {
      index: 1,
      time: CHECKING_TIME_0930_1130,
      limitSmallCar: 40,
      limitOtherVehicle: 20,
      limitRoMooc: 5,
      enableBooking: 1,
    },
    {
      index: 2,
      time: CHECKING_TIME_1330_1500,
      limitSmallCar: 40,
      limitOtherVehicle: 20,
      limitRoMooc: 5,
      enableBooking: 1,
    },
    {
      index: 3,
      time: CHECKING_TIME_1530_1730,
      limitSmallCar: 40,
      limitOtherVehicle: 20,
      limitRoMooc: 5,
      enableBooking: 1,
    },
  ];
  return JSON.stringify(defaultBookingConfig);
}

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('stationsId').primary();
          table.string('stationsName');
          table.string('stationCode');
          table.string('stationUrl').defaultTo('');
          table.string('stationLandingPageUrl').defaultTo('');
          table.string('stationWebhookUrl').defaultTo('');
          table.string('stationBookingConfig', 2000).defaultTo(_getDefaultBookingConfig());
          table.string('stationCheckingConfig', 2000).defaultTo(_getDefaultCheckingConfig());
          table.boolean('stationCheckingAuto').defaultTo(false);
          table.boolean('stationUseCustomSMTP').defaultTo(false);
          table.string('stationCustomSMTPConfig', 2000).defaultTo('');
          table.boolean('stationUseCustomSMSBrand').defaultTo(false);
          table.string('stationCustomSMSBrandConfig', 2000).defaultTo('');
          table.string('stationMapSource', 2000).defaultTo('');
          table.boolean('stationEnableUseZNS').defaultTo(false);
          table.boolean('stationEnableUseSMS').defaultTo(false);
          table.boolean('stationUseCustomZNS').defaultTo(false);
          table.string('stationCustomZNSConfig', 2000).defaultTo('');
          table.string('stationsColorset').defaultTo('black');
          table.string('stationsLogo', 500).defaultTo('');
          table.string('stationsHotline', 500).defaultTo('');
          table.string('stationsEmail').defaultTo('');
          table.string('stationsAddress', 500).defaultTo('');
          table.string('stationArea');
          table.integer('stationStatus').defaultTo(STATION_STATUS.ACTIVE);
          table.integer('stationType').defaultTo(STATION_TYPE.EXTERNAL);
          table.integer('stationTotalMachine').defaultTo(2);
          table.integer('stationContractStatus').defaultTo(STATION_CONTACT_STATUS.NEW);
          table.string('stationsCertification', 500).defaultTo('');
          table.string('stationsBanner').defaultTo('');
          table.string('stationsNote', 2000).defaultTo('');
          table.integer('totalSmallCar').defaultTo(0);
          table.integer('totalOtherVehicle').defaultTo(0);
          table.integer('totalRoMooc').defaultTo(0);
          table.integer('totalInspectionLine').defaultTo(1);
          table.integer('limitSchedule').defaultTo(30);
          table.integer('enableConfigAllowBookingOverLimit').defaultTo(BOOKING_OVER_LIMIT.DISABLE); // cho phép đặt lịch quá giới hạn
          table.integer('enableConfigAutoConfirm').defaultTo(AUTO_CONFIRM_SCHEDULE.ENABLE); // tự động xác nhận lịch hẹn
          table.integer('enableConfigBookingOnToday').defaultTo(BOOKING_ON_CURRENT_DATE.DISABLE); // mở đặt lịch cho ngày hiện tại
          table.string('stationLastActiveAt');
          // Status đăng ký bộ công thương
          table.integer('stationsVerifyStatus').defaultTo(VERIFY_STATUS.NOT_REGISTER);
          table.string('stationsManager', 500).defaultTo('');
          table.string('stationsManagerPhone');
          table.string('stationsLicense', 500).defaultTo('');
          //các field dành cho module quảng cáo
          table.boolean('stationsEnableAd').defaultTo(false); //Hiển thị quảng cáo
          table.string('stationsCustomAdBannerLeft').defaultTo(''); //Link quảng cáo trên trang thông báo (bên trái)
          table.string('stationsCustomAdBannerRight').defaultTo(''); //Link quảng cáo trên trang thông báo (bên phải)
          table.integer('availableStatus').defaultTo(AVAILABLE_STATUS.DEFAULT);
          timestamps(table);
          table.index('stationType');
          table.index('stationStatus');
          table.index('stationUrl');
          table.index('stationWebhookUrl');
          table.index('stationCode');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          resolve();
        });
    });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, searchText, skip, limit, order) {
  let queryBuilder = DB(tableName);
  let filterData = JSON.parse(JSON.stringify(filter));

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('stationsName', 'like', `%${searchText}%`)
        .orWhere('stationCode', 'like', `%${searchText}%`)
        .orWhere('stationsAddress', 'like', `%${searchText}%`)
        .orWhere('stationArea', 'like', `%${searchText}%`);
    });
  }

  queryBuilder.where(filterData);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('updatedAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, searchText, skip, limit, order) {
  let query = _makeQueryBuilderByFilter(filter, searchText, skip, limit, order);
  return await query.select();
}

async function customCount(filter, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, searchText, undefined, undefined, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  primaryKeyField,
  customSearch,
  customCount,
  _getDefaultBookingConfig,
};
