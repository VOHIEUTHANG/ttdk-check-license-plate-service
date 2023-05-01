/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');

const StationsResourceAccess = require('../resourceAccess/StationsResourceAccess');
const StationFunctions = require('../StationsFunctions');
const Logger = require('../../../utils/logging');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const AppUserFunctions = require('../../AppUsers/AppUsersFunctions');
const AppUserResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const SystemConfigurationFunction = require('../../SystemConfigurations/SystemConfigurationsFunctions');
const StationIntroductionFunction = require('../../StationIntroduction/StationIntroductionFunctions');
const CustomerStatisticalFunction = require('../../CustomerStatistical/CustomerStatisticalFunctions');
const StationVNPayResourceAccess = require('../../StationVNPay/resourceAccess/StationVNPayResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const StationWorkScheduleFunctions = require('../../StationWorkSchedule/StationWorkScheduleFunctions');
const StationsWorkScheduleResourceAccess = require('../../StationWorkSchedule/resourceAccess/StationsWorkScheduleResourceAccess');
const StationDetailPublicModel = require('../model/StationDetailPublicModel');
const { logStationsChanged } = require('../../SystemAppLogChangeStation/SystemAppLogChangeStationFunctions');

const { WORKING_STATUS } = require('../../StationWorkSchedule/StationWorkScheduleConstants');
const { NOT_FOUND, UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { STATIONS_AREA } = require('../data/StationsArea');
const { STATION_TYPE, STATION_STATUS, STATION_ERROR, BOOKING_STATUS, BOOKING_ENABLE, BOOKING_ON_CURRENT_DATE } = require('../StationsConstants');
const { SCHEDULE_STATUS, VEHICLE_TYPE, SCHEDULE_CACHE_KEYS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const ExcelFunction = require('../../../ThirdParty/Excel/excelFunction');
const { ALLOW_VEHICLE_TYPE_STATUS } = require('../../StationWorkSchedule/StationWorkScheduleConstants');

const VarSyncServices = require('../../../ThirdParty/VARConnector/VarSyncServices');
const { getLimitVehicleByType } = require('../../CustomerSchedule/CustomerScheduleFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsData = req.payload;
      let registerResult = await StationFunctions.registerNewStation(stationsData);

      if (registerResult) {
        let nonVietnameseName = UtilsFunction.nonAccentVietnamese(stationsData.stationsName);
        nonVietnameseName = UtilsFunction.replaceAll(nonVietnameseName, ' ', '');
        //Register first admin user for new station
        let registerUserResult = undefined;
        let generatorIndex = 0;

        //loop until registration finish or react 100 times
        let retryMaxTime = 100;
        let retry = 0;
        while (registerUserResult === undefined) {
          const username = stationsData.stationCode + 'admin' + (generatorIndex === 0 ? '' : generatorIndex);
          let adminUserData = {
            username,
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: '',
            password: '123456789',
            stationsId: registerResult[0],
            appUserRoleId: 1, //Mặc định user đầu tiên là user admin của trạm đó
          };

          const _existingAppUser = await AppUserResourceAccess.find({ username }, undefined, 0);

          if (!_existingAppUser || _existingAppUser.length <= 0) {
            registerUserResult = await AppUserFunctions.createNewUser(adminUserData);
          }

          if (!registerUserResult) {
            generatorIndex = generatorIndex + 1;
            retry++;
          }
          if (retryMaxTime === retry) {
            reject('failed');
          }
        }

        //insert StationIntroduction
        let stationIntro = StationIntroductionFunction.createDefaultStationIntroduction();
        await StationIntroductionFunction.updateStationIntro(registerResult, stationIntro);

        //insert category default for station
        const StationNewsCategoryFunction = require('../../StationNewsCategory/StationNewsCategoryFunctions');
        await StationNewsCategoryFunction.initNewCategoriesForStation({
          stationsId: registerResult,
        });

        resolve(registerResult);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
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
      if (!order) {
        order = {
          key: 'stationCode',
          value: 'asc',
        };
      }

      let stations = await StationsResourceAccess.customSearch(filter, searchText, skip, limit, order);
      let stationsCount = await StationsResourceAccess.customCount(filter, searchText, order);
      if (stations && stationsCount) {
        // parse data
        stations.forEach(station => {
          station.stationBookingConfig = JSON.parse(station.stationBookingConfig || {});
          station.stationCheckingConfig = JSON.parse(station.stationCheckingConfig || {});
        });
        resolve({ data: stations, total: stationsCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetListStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      if (!order) {
        order = {
          key: 'stationCode',
          value: 'asc',
        };
      }

      if (!filter) {
        filter = {};
      }

      //chi lay thong tin cac tram chua duoc an
      filter.isHidden = 0;

      let stations = await StationsResourceAccess.customSearch(filter, searchText, skip, limit, order);

      if (stations && stations.length > 0) {
        const StationDetailPublicModel = require('../model/StationDetailPublicModel');
        for (let i = 0; i < stations.length; i++) {
          stations[i] = StationDetailPublicModel.fromData(stations[i]);
        }

        let stationsCount = await StationsResourceAccess.customCount(filter, searchText, order);
        resolve({ data: stations, total: stationsCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetAllExternalStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let searchText = req.payload.searchText;
      let filter = req.payload.filter || {};

      //chi lay thong tin cac tram chua duoc an
      filter.isHidden = 0;
      filter.stationType = STATION_TYPE.EXTERNAL;

      const MAX_LIMIT_COUNT = 500;

      let stationsList = [];
      // load data from redis
      if (process.env.REDIS_ENABLE) {
        const redisKey = `ALL_STATIONS`;
        const cacheData = await RedisInstance.getJson(redisKey);
        stationsList = cacheData;
      }

      if (!stationsList || stationsList === null || stationsList.length === 0) {
        stationsList = await StationsResourceAccess.customSearch(filter, undefined, 0, MAX_LIMIT_COUNT);
        // cache data
        if (process.env.REDIS_ENABLE) {
          const redisKey = `ALL_STATIONS`;
          await RedisInstance.setWithExpire(redisKey, JSON.stringify(stationsList));
        }
      }

      let outputResponse = { data: [], total: 0 };
      if (stationsList && stationsList.length > 0) {
        //neu co search text thi loc lai danh sach cho dung
        if (UtilsFunction.isNotEmptyStringValue(searchText)) {
          stationsList = stationsList.filter(_station => _station.stationArea === searchText);
        }

        if (UtilsFunction.isNotEmptyStringValue(filter.stationArea)) {
          stationsList = stationsList.filter(_station => _station.stationArea === filter.stationArea);
        }

        //!! IMPORTANT !! SECURE !! Mapping model to prevent data leak.
        for (let i = 0; i < stationsList.length; i++) {
          const stationConfigs = JSON.parse(stationsList[i].stationBookingConfig);
          const isDisableBooking = stationConfigs.every(config => config.enableBooking !== BOOKING_ENABLE);

          stationsList[i] = {
            stationsId: stationsList[i].stationsId,
            stationsName: stationsList[i].stationsName,
            stationCode: stationsList[i].stationCode,
            stationMapSource: stationsList[i].stationMapSource,
            stationsAddress: stationsList[i].stationsAddress,
            stationStatus: isDisableBooking ? STATION_STATUS.BLOCK : stationsList[i].stationStatus,
            availableStatus: stationsList[i].availableStatus,
            stationArea: stationsList[i].stationArea,
            stationBookingConfig: stationsList[i].stationBookingConfig,
          };
        }

        let stationsCount = stationsList.length;

        outputResponse = { data: stationsList, total: stationsCount };
      }

      resolve(outputResponse);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.id;
      let stationsData = req.payload.data;

      if (stationsData.stationBookingConfig) {
        try {
          stationsData.stationBookingConfig = JSON.stringify(stationsData.stationBookingConfig);
          // StationFunctions.sortCheckingConfigStep(stationsData.stationBookingConfig);
        } catch (error) {
          stationsData.stationBookingConfig = '';
        }
      }

      let oldStations = await StationsResourceAccess.findById(stationsId);

      if (!oldStations) {
        return reject(NOT_FOUND);
      }

      if (stationsData.stationCheckingConfig) {
        //compare to old config and find changes
        if (oldStations) {
          let oldConfigs = oldStations.stationCheckingConfig;
          if (JSON.stringify(oldConfigs) !== JSON.stringify(stationsData.stationCheckingConfig)) {
            //update voice data for each step in checking process
            await StationFunctions.updateVoiceDataForConfig(stationsData.stationCheckingConfig);
          }
        }
        stationsData.stationCheckingConfig = JSON.stringify(stationsData.stationCheckingConfig);
      }

      await _autoCalculateVehicleCount(stationsId, stationsData);

      let result = await StationsResourceAccess.updateById(stationsId, stationsData);
      if (result) {
        //TODO check performance later
        // const syncStationData = await StationsResourceAccess.findById(stationsId);
        // Sync data to VAR
        // await VarSyncServices.syncStationInfo(req.headers, {
        //   stationCode: oldStations.stationCode,
        //   data: syncStationData,
        // }).catch(function (err) {
        //   console.error('Update stations to VAR failed', err);
        // });
        await logStationsChanged(oldStations, stationsData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _autoCalculateVehicleCount(stationsId, stationsData) {
  const totalSmallCar = stationsData.totalSmallCar;
  const totalOtherVehicle = stationsData.totalOtherVehicle;
  const totalRoMooc = stationsData.totalRoMooc;

  if (totalSmallCar >= 0 || totalOtherVehicle >= 0) {
    let targetStation = await StationsResourceAccess.findById(stationsId);
    let currentBookingConfig = targetStation.stationBookingConfig;
    currentBookingConfig = JSON.parse(currentBookingConfig);

    const enableBookingCount = currentBookingConfig.filter(config => config.enableBooking).length;

    if (enableBookingCount > 0) {
      if (totalSmallCar >= 0) {
        const vehicleCount = Math.floor(totalSmallCar / enableBookingCount);
        currentBookingConfig.forEach(booking => {
          if (booking.enableBooking) {
            booking.limitSmallCar = vehicleCount;
          } else {
            booking.limitSmallCar = 0;
          }
        });
      }

      if (totalOtherVehicle >= 0) {
        const vehicleCount = Math.floor(totalOtherVehicle / enableBookingCount);
        currentBookingConfig.forEach(booking => {
          if (booking.enableBooking) {
            booking.limitOtherVehicle = vehicleCount;
          } else {
            booking.limitOtherVehicle = 0;
          }
        });
      }

      if (totalRoMooc && totalRoMooc >= 0) {
        const vehicleCount = Math.floor(totalRoMooc / enableBookingCount);
        currentBookingConfig.forEach(booking => {
          if (booking.enableBooking) {
            booking.limitRoMooc = vehicleCount;
          } else {
            booking.limitRoMooc = 0;
          }
        });
      }
    } else {
      return Logger.error('STATION DO NOT HAVE ANY ENABLE BOOKING CONFIGURATION !');
    }

    const stationBookingConfig = JSON.stringify(currentBookingConfig);
    stationsData.stationBookingConfig = stationBookingConfig;
  }
}
async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.id;
      let stationData = await StationFunctions.getStationDetailById(stationsId);
      if (stationData) {
        //TODO check performance later
        // //nếu không có sẵn quảng cáo thì lấy quảng cáo hệ thống chèn vào
        // if (stationData.stationsEnableAd) {
        //   let configuration = await SystemConfigurationFunction.getSystemAdConfigurations();
        //   if (stationData.stationsCustomAdBannerLeft === undefined || stationData.stationsCustomAdBannerLeft === '') {
        //     stationData.stationsCustomAdBannerLeft = configuration.systemLeftBannerAd;
        //   }
        //   if (stationData.stationsCustomAdBannerRight === undefined || stationData.stationsCustomAdBannerRight === '') {
        //     stationData.stationsCustomAdBannerRight = configuration.systemRightBannerAd;
        //   }
        // }

        // // Report data:
        // const report = await CustomerStatisticalFunction.getReportTotalByStations(stationsId);
        // stationData.report = report;

        // // vnpay data
        // const vnpayData = await StationVNPayResourceAccess.find({ stationsId: stationsId });
        // if (vnpayData && vnpayData.length > 0) {
        //   stationData.vnpayData = vnpayData[0];
        // }
        resolve(stationData);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findByUrl(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsUrl = req.payload.stationsUrl;
      let result = await StationFunctions.getStationDetailByUrl(stationsUrl);
      if (result) {
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

async function findByStationCode(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationCode = req.payload.stationCode;

      let station = await StationsResourceAccess.find({
        stationCode: stationCode,
      });

      if (station && station.length > 0) {
        station = station[0];
        const publicData = StationDetailPublicModel.fromData(station);
        return resolve(publicData);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetDetailStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let station = await StationsResourceAccess.findById(id);

      if (station) {
        const publicData = StationDetailPublicModel.fromData(station);
        return resolve(publicData);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function resetAllDefaultMp3() {
  await StationFunctions.resetAllDefaultMp3();
}

async function reportAllActiveStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let activeStationCount = [];

      for (let stationArea of STATIONS_AREA) {
        const totalActiveStationCount = await StationsResourceAccess.customCount({
          stationArea: stationArea.value,
          stationStatus: STATION_STATUS.ACTIVE,
        });

        activeStationCount.push({
          stationArea: stationArea.value,
          totalActiveStationCount: totalActiveStationCount || 0,
        });
      }

      const reportData = _getLargestStationCountByArea(activeStationCount);

      return resolve({ data: reportData, total: reportData.length });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

function _getLargestStationCountByArea(StationAreaList) {
  StationAreaList.sort((a, b) =>
    a.totalActiveStationCount < b.totalActiveStationCount ? 1 : a.totalActiveStationCount > b.totalActiveStationCount ? -1 : 0,
  );
  return StationAreaList;
}

async function reportAllInactiveStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter || {};
      const searchText = req.payload.searchText;

      const MAX_COUNT = 500;
      let reportData = [];
      const inactiveStations = await StationsResourceAccess.customSearch(
        { stationStatus: STATION_STATUS.BLOCK, ...filter },
        searchText,
        0,
        MAX_COUNT,
      );

      if (inactiveStations && inactiveStations.length > 0) {
        reportData = inactiveStations.map(station => ({
          stationsId: station.stationsId,
          stationsName: station.stationsName,
          stationCode: station.stationCode,
          stationArea: station.stationArea,
        }));
      }

      resolve({ data: reportData, total: reportData.length });
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateConfigSMTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let smtpHost = req.payload.smtpHost;
      let smtpPort = req.payload.smtpPort;
      let smtpSecure = req.payload.smtpSecure;
      let smtpAuth = req.payload.smtpAuth;
      let smtpTls = req.payload.smtpTls;
      let stationData = {
        stationCustomSMTPConfig: {
          smtpHost: smtpHost,
          smtpPort: smtpPort,
          smtpSecure: smtpSecure,
          smtpAuth: smtpAuth,
          smtpTls: smtpTls,
          smtpServiceName: req.payload.smtpServiceName,
        },
      };
      stationData.stationCustomSMTPConfig = JSON.stringify(stationData.stationCustomSMTPConfig);

      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, stationData);
      if (result) {
        await logStationsChanged(previousData, stationData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateConfigSMS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let smsUrl = req.payload.smsUrl;
      let smsUserName = req.payload.smsUserName;
      let smsPassword = req.payload.smsPassword;
      let smsBrand = req.payload.smsBrand;

      let stationData = {};
      let stationCustomSMSBrandConfig = {
        smsUrl: smsUrl,
        smsUserName: smsUserName,
        smsPassword: smsPassword,
        smsBrand: smsBrand,
        smsCPCode: req.payload.smsCPCode, //<<use for SOAP Client
        smsServiceId: req.payload.smsServiceId, //<<use for SOAP Client
        smsProvider: req.payload.smsProvider,
      };

      const { SMS_PROVIDER } = require('../../CustomerMessage/CustomerMessageConstant');
      if (req.payload.smsProvider === SMS_PROVIDER.VIETTEL) {
        stationCustomSMSBrandConfig.smsBrand = req.payload.smsCPCode;
      }

      if (req.payload.smsBrand) {
        stationCustomSMSBrandConfig.smsBrand = req.payload.smsBrand;
      }

      if (req.payload.smsToken) {
        stationCustomSMSBrandConfig.smsToken = req.payload.smsToken;
      }

      if (req.payload.smsCPCode) {
        stationCustomSMSBrandConfig.smsCPCode = req.payload.smsCPCode;
      }

      if (req.payload.smsServiceId) {
        stationCustomSMSBrandConfig.smsServiceId = req.payload.smsServiceId;
      }

      stationData.stationCustomSMSBrandConfig = JSON.stringify(stationCustomSMSBrandConfig);
      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, stationData);
      if (result) {
        await logStationsChanged(previousData, stationData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateConfigZNS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let znsUrl = req.payload.znsUrl;
      let znsUserName = req.payload.znsUserName;
      let znsPassword = req.payload.znsPassword;
      let znsBrand = req.payload.znsBrand;

      let stationData = {};
      let stationCustomZNSConfig = {
        znsUrl: znsUrl,
        znsUserName: znsUserName,
        znsPassword: znsPassword,
        znsBrand: znsBrand,
        znsCPCode: req.payload.znsCPCode, //<<use for SOAP Client
        znsServiceId: req.payload.znsServiceId, //<<use for SOAP Client
        znsProvider: req.payload.znsProvider,
      };

      if (req.payload.znsBrand) {
        stationCustomZNSConfig.znsBrand = req.payload.znsBrand;
      }

      if (req.payload.znsToken) {
        stationCustomZNSConfig.znsToken = req.payload.znsToken;
      }

      if (req.payload.znsCPCode) {
        stationCustomZNSConfig.znsCPCode = req.payload.znsCPCode;
      }

      if (req.payload.znsServiceId) {
        stationCustomZNSConfig.znsServiceId = req.payload.znsServiceId;
      }

      stationData.stationCustomZNSConfig = JSON.stringify(stationCustomZNSConfig);

      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, stationData);
      if (result) {
        await logStationsChanged(previousData, stationData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateCustomSMTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let stationUseCustomSMTP = req.payload.CustomSMTP;
      let stationData = {
        stationUseCustomSMTP: stationUseCustomSMTP,
      };
      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, stationData);
      if (result) {
        await logStationsChanged(previousData, stationData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateCustomSMSBrand(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let stationUseCustomSMSBrand = req.payload.stationUseCustomSMSBrand;
      let stationData = {
        stationUseCustomSMSBrand: stationUseCustomSMSBrand,
      };
      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, stationData);
      if (result) {
        await logStationsChanged(previousData, stationData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateRightAdBanner(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let stationsCustomAdBannerRight = req.payload.stationsCustomAdBannerRight;
      const updatedData = {
        stationsCustomAdBannerRight: stationsCustomAdBannerRight,
      };

      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, updatedData);
      if (result) {
        await logStationsChanged(previousData, updatedData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateLeftAdBanner(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let stationsCustomAdBannerLeft = req.payload.stationsCustomAdBannerLeft;
      const updatedData = {
        stationsCustomAdBannerLeft: stationsCustomAdBannerLeft,
      };

      let previousData = (await StationsResourceAccess.findById(stationsId)) || {};
      let result = await StationsResourceAccess.updateById(stationsId, updatedData);
      if (result) {
        await logStationsChanged(previousData, updatedData, req.currentUser, stationsId);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function enableAdsForStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let stationsEnableAd = req.payload.stationsEnableAd;

      let result = await StationsResourceAccess.updateById(stationsId, {
        stationsEnableAd: stationsEnableAd,
      });
      if (result) {
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

function getBookingStatusFromBookingConfig(stationBookingConfigs) {
  for (let i = 0; i < stationBookingConfigs.length; i++) {
    const _config = stationBookingConfigs[i];
    if (_config.enableBooking) {
      return BOOKING_STATUS.AVAILABLE;
    }
  }
  return BOOKING_STATUS.FULL;
}

async function _checkBookingStatusByDate(selectedStation, scheduleDate, vehicleType) {
  //skip ngay nghi tet
  const nationalHolidays = [
    '21/01/2023',
    '22/01/2023',
    '23/01/2023',
    '24/01/2023',
    '25/01/2023',
    '26/01/2023',
    '29/04/2023',
    '30/04/2023',
    '01/05/2023',
    '02/05/2023',
    '02/09/2023',
    '03/09/2023',
    '04/09/2023',
    '05/09/2023',
  ];
  if (nationalHolidays.indexOf(scheduleDate) >= 0) {
    return undefined;
  }

  const stationBookingConfigs = JSON.parse(selectedStation.stationBookingConfig || '{}');

  let _bookingDate = { scheduleDate: scheduleDate, scheduleDateStatus: BOOKING_STATUS.AVAILABLE };

  const workStatus = await StationWorkScheduleFunctions.getWorkStatusListByDate(selectedStation.stationsId, scheduleDate);
  const maxBookingsCount = _calculateMaxBookingCount(stationBookingConfigs, vehicleType, workStatus, selectedStation.totalRoMooc);

  const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];

  let successBookingsCount = undefined;
  if (process.env.REDIS_ENABLE) {
    let redisKey = SCHEDULE_CACHE_KEYS.SUCCESS_SCHEDULE_COUNT_BY_STATION;
    redisKey = redisKey.replace('{stationsId}', `${selectedStation.stationsId}`);
    redisKey = redisKey.replace('{scheduleDate}', `${scheduleDate}`);
    redisKey = redisKey.replace('{vehicleType}', `${vehicleType}`);
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      successBookingsCount = cacheData.successBookingsCount;
    }
  }

  let selectingVehicleType = vehicleType;

  if (successBookingsCount === undefined) {
    successBookingsCount = await CustomerScheduleResourceAccess.customCount({
      stationsId: selectedStation.stationsId,
      dateSchedule: scheduleDate,
      CustomerScheduleStatus: successBookingStatus,
      vehicleType: selectingVehicleType,
    });
  }

  if (process.env.REDIS_ENABLE) {
    let redisKey = SCHEDULE_CACHE_KEYS.SUCCESS_SCHEDULE_COUNT_BY_STATION;
    redisKey = redisKey.replace('{stationsId}', `${selectedStation.stationsId}`);
    redisKey = redisKey.replace('{scheduleDate}', `${scheduleDate}`);
    redisKey = redisKey.replace('{vehicleType}', `${vehicleType}`);
    if (successBookingsCount !== undefined && successBookingsCount !== null) {
      await RedisInstance.setWithExpire(redisKey, JSON.stringify({ successBookingsCount: successBookingsCount * 1 }));
    }
  }

  if (successBookingsCount !== undefined && successBookingsCount >= maxBookingsCount) {
    _bookingDate.scheduleDateStatus = BOOKING_STATUS.FULL;
  } else {
    _bookingDate.scheduleDateStatus = getBookingStatusFromBookingConfig(stationBookingConfigs);
  }

  _bookingDate.totalSchedule = maxBookingsCount;
  _bookingDate.totalBookingSchedule = successBookingsCount;

  const scheduleDayOff = await StationsWorkScheduleResourceAccess.find({ scheduleDayOff: scheduleDate, stationsId: selectedStation.stationsId });
  if (scheduleDayOff && scheduleDayOff.length > 0) {
    const timeList = JSON.parse(scheduleDayOff[0].scheduleTime);
    const isFullDayOff = timeList.every(timeVal => timeVal.isWorking === WORKING_STATUS.NOT_ACTIVE);
    if (isFullDayOff) {
      // remove dayOff from list schedule
      return undefined;
    }
  }

  return _bookingDate;
}
async function _checkingBookingDateStatus(selectedStation, startDate, endDate, vehicleType) {
  // checking is valid date
  let startDateMoment = moment(startDate, 'DD/MM/YYYY');
  let endDateMoment = moment(endDate, 'DD/MM/YYYY');
  let diffDateCount = endDateMoment.diff(startDateMoment, 'days');

  let listScheduleStatus = [];

  for (let dayCounter = 0; dayCounter < diffDateCount; dayCounter++) {
    const _scheduleDate = moment(startDateMoment).add(dayCounter, 'days').format('DD/MM/YYYY');
    listScheduleStatus.push(_checkBookingStatusByDate(selectedStation, _scheduleDate, vehicleType));
  }

  listScheduleStatus = await Promise.all(listScheduleStatus);

  //loc cac item bi undefined
  listScheduleStatus = listScheduleStatus.filter(item => item !== undefined);

  return listScheduleStatus;
}

function _calculateMaxBookingCount(stationBookingConfigs, vehicleType, workStatus) {
  switch (vehicleType) {
    case VEHICLE_TYPE.CAR:
      if (workStatus.enableSmallCar === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
        return 0;
      }
      break;
    case VEHICLE_TYPE.OTHER:
      if (workStatus.enableOtherVehicle === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
        return 0;
      }
      break;
    case VEHICLE_TYPE.RO_MOOC:
      if (workStatus.enableRoMooc === ALLOW_VEHICLE_TYPE_STATUS.DISABLE) {
        return 0;
      }
      break;
  }

  const maxBookingsCount = stationBookingConfigs.reduce((acc, config) => {
    let _scheduleLimit = 0;
    if (config.enableBooking && !workStatus.timeOffList.includes(config.time)) {
      _scheduleLimit = getLimitVehicleByType(vehicleType, config);
    }
    return acc + _scheduleLimit;
  }, 0);

  return maxBookingsCount;
}

async function listAllAvailableScheduleDate() {
  console.log(`listAllAvailableScheduleDate`);
  const vehicleType = VEHICLE_TYPE.RO_MOOC;
  let _stationList = await StationsResourceAccess.find();
  for (let i = 0; i < _stationList.length; i++) {
    const selectedStation = _stationList[i];
    if (selectedStation.stationStatus === 0) {
      continue;
    }
    // console.log(selectedStation.stationBookingConfig)
    // console.log(selectedStation.stationBookingConfig.indexOf(`enableBooking":1`))
    if (selectedStation.stationBookingConfig.indexOf(`enableBooking":1`) < 0) {
      continue;
    }
    let startDate = moment().format('DD/MM/YYYY');

    if (!selectedStation) {
      console.error(`userGetListScheduleDate ${STATION_ERROR.INVALID_STATION} ${stationsId}`);
      return reject(STATION_ERROR.INVALID_STATION);
    }

    const limitSchedule = selectedStation.limitSchedule || 30;
    let endDate = moment().add(limitSchedule, 'days').format('DD/MM/YYYY');

    const listScheduleStatus = await _checkingBookingDateStatus(selectedStation, startDate, endDate, vehicleType);
    const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];
    let totalSuccessBookingCount = await CustomerScheduleResourceAccess.customCount({
      stationsId: selectedStation.stationsId,
      CustomerScheduleStatus: successBookingStatus,
      vehicleType: vehicleType,
    });
    for (let counterSchedule = 0; counterSchedule < listScheduleStatus.length; counterSchedule++) {
      const _schedule = listScheduleStatus[counterSchedule];
      if (_schedule.scheduleDateStatus === 1) {
        console.log(
          `${selectedStation.stationCode} | ${totalSuccessBookingCount} | ${_schedule.scheduleDate} | ${_schedule.totalBookingSchedule} / ${_schedule.totalSchedule} | ${endDate}`,
        );
        break;
      }
    }
  }
}
// listAllAvailableScheduleDate();
async function userGetListScheduleDate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationsId = req.payload.stationsId;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      const vehicleType = req.payload.vehicleType;

      const selectedStation = await StationsResourceAccess.findById(stationsId);

      if (!selectedStation) {
        console.error(`userGetListScheduleDate ${STATION_ERROR.INVALID_STATION} ${stationsId}`);
        return reject(STATION_ERROR.INVALID_STATION);
      }
      // default booking on tomorrow
      startDate = moment().add(1, 'day').format('DD/MM/YYYY');

      //neu user khong phai la nhan vien trung tam thi chi dat tu ngay mai
      if (req.currentUser && req.currentUser.appUserRoleId > 0 && selectedStation.enableConfigBookingOnToday === BOOKING_ON_CURRENT_DATE.ENABLE) {
        startDate = moment().format('DD/MM/YYYY');
      }

      const limitSchedule = selectedStation.limitSchedule || 30;
      endDate = moment().add(limitSchedule, 'days').format('DD/MM/YYYY');

      const listScheduleStatus = await _checkingBookingDateStatus(selectedStation, startDate, endDate, vehicleType);

      resolve(listScheduleStatus);
    } catch (error) {
      Logger.error(__filename, error);
      reject('failed');
    }
  });
}

async function userGetListScheduleTime(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationsId = req.payload.stationsId;
      const targetDate = req.payload.date;
      const vehicleType = req.payload.vehicleType;

      let _diffCurrentDay = moment(targetDate, 'DD/MM/YYYY').diff(moment(), 'days');
      if (_diffCurrentDay < 0) {
        console.error(`${STATION_ERROR.WRONG_BOOKING_CONFIG} targetDate: ${targetDate}`);
        return reject(STATION_ERROR.WRONG_BOOKING_CONFIG);
      }
      const selectedStation = await StationsResourceAccess.findById(stationsId);

      if (!selectedStation) {
        console.error(`userGetListScheduleTime ${STATION_ERROR.INVALID_STATION} ${stationsId}`);
        return reject(STATION_ERROR.INVALID_STATION);
      }

      const stationBookingConfigs = JSON.parse(selectedStation.stationBookingConfig);

      const scheduleTimeStatusPromiseList = stationBookingConfigs.map(async _bookingConfig => {
        const _scheduleLimit = getLimitVehicleByType(vehicleType, _bookingConfig);

        const time = _bookingConfig.time;
        let timeStatus = { scheduleTime: time, scheduleTimeStatus: BOOKING_STATUS.AVAILABLE };

        if (!_bookingConfig.enableBooking) {
          timeStatus.scheduleTimeStatus = BOOKING_STATUS.FULL;
        } else {
          const successBookingStatus = [SCHEDULE_STATUS.CLOSED, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW];
          const successBookingsCount = await CustomerScheduleResourceAccess.customCount({
            stationsId: selectedStation.stationsId,
            dateSchedule: targetDate,
            time: time,
            vehicleType: vehicleType,
            CustomerScheduleStatus: successBookingStatus,
          });
          if (_scheduleLimit === 0 || (successBookingsCount && successBookingsCount >= _scheduleLimit)) {
            timeStatus.scheduleTimeStatus = BOOKING_STATUS.FULL;
          }
          timeStatus.totalSchedule = _scheduleLimit;
          timeStatus.totalBookingSchedule = successBookingsCount;
        }

        const isDayOff = await StationWorkScheduleFunctions.checkUserBookingOnDayOff(targetDate, time, selectedStation.stationsId, vehicleType);
        if (isDayOff) {
          timeStatus.scheduleTimeStatus = BOOKING_STATUS.FULL;
        }

        return timeStatus;
      });

      const scheduleTimeStatusList = await Promise.all(scheduleTimeStatusPromiseList);

      resolve(scheduleTimeStatusList);
    } catch (error) {
      Logger.error(__filename, error);
      reject('failed');
    }
  });
}

async function getAllStationArea(rea) {
  return STATIONS_AREA;
}

async function exportStationExcel(req) {
  return new Promise(async (resolve, reject) => {
    let fileName = 'DSTram' + moment().format('YYYYMMDDHHmm') + '_' + req.currentUser.staffId + '.xlsx';
    const filepath = 'uploads/exportExcel/' + fileName;
    try {
      let filter = req.payload.filter || {};
      let searchText = req.payload.searchText;
      let order = req.payload.order;
      let skip = undefined;
      let limit = undefined;

      const stations = await StationsResourceAccess.customSearch(filter, searchText, skip, limit, order);

      if (stations && stations.length > 0) {
        let newData = await _exportRecordToExcel(stations, filepath);
        if (newData) {
          let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + filepath;
          return resolve(newExcelUrl);
        } else {
          console.error(`error exportCustomerRecord Customer Record: ${UNKNOWN_ERROR}`);
          return reject(UNKNOWN_ERROR);
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _exportRecordToExcel(records, filepath) {
  let count = 0;

  const workSheetName = 'Danh sách trạm đăng kiểm';
  const dataRows = [];

  //worksheet title
  const workSheetTitle = [
    '', //break 1 columns
    '', //break 1 columns
    '', //break 1 columns
    'Danh sách trung tâm đăng kiểm',
  ];
  dataRows.push(workSheetTitle);

  dataRows.push(['']); //break 1 rows

  //table headers
  const workSheetColumnNames = [
    'Số TT',
    'Mã trạm',
    'Tên trạm',
    'Khu vực',
    'Loại',
    'Số dây chuyền',
    'Số nhân viên',
    'Trạng thái',
    'Kích hoạt online',
    'Năng suất dây chuyền',
    'Năng suất nhận lịch online',
    'Địa chỉ',
    'Hotline',
    'Email',
    'Tên giám đốc',
    'Số điện thoại giám đốc',
    'Ghi chú',
  ];
  dataRows.push(workSheetColumnNames);

  //Table data
  for (let record of records) {
    let totalStaff = await AppUserResourceAccess.count({
      stationsId: record.stationsId,
    });

    const stationTypeList = ['D', 'S', 'V'];
    const stationCode = record.stationCode;
    const stationType = stationTypeList.find(type => stationCode.includes(type));

    const stationArea = STATIONS_AREA.find(area => area.value === record.stationArea);

    const bookingConfig = JSON.parse(record.stationBookingConfig || {});

    const isActiveOnlineBooking = bookingConfig.some(config => config.enableBooking);

    const totalLimitVehiclePerDay = bookingConfig.reduce((acc, config) => {
      let totalVehicle = 0;
      if (config.enableBooking) {
        totalVehicle += config.limitOtherVehicle + config.limitSmallCar + config.limitRoMooc;
      }
      return acc + totalVehicle;
    }, 0);

    count += 1;
    dataRows.push([
      count,
      record.stationCode,
      record.stationsName,
      stationArea ? stationArea.area : '',
      stationType,
      record.totalInspectionLine, // so day chuyen
      totalStaff ? totalStaff : 0, // so nhan vien
      record.stationStatus ? 'Hoạt động' : 'Tạm dừng',
      isActiveOnlineBooking ? 'Kích hoạt online' : 'Tắt kích hoạt online',
      record.totalInspectionLine ? record.totalInspectionLine * 40 : '',
      `${totalLimitVehiclePerDay} phương tiện / ngày`,
      record.stationsAddress,
      record.stationsHotline,
      record.stationsEmail,
      record.stationsManager,
      record.stationsManagerPhone,
      record.stationsNote,
    ]);
  }

  ExcelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
  return 'OK';
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  findByUrl,
  findByStationCode,
  resetAllDefaultMp3,
  reportAllInactiveStation,
  reportAllActiveStation,
  updateConfigSMTP,
  updateConfigSMS,
  updateConfigZNS,
  updateCustomSMTP,
  updateCustomSMSBrand,
  updateLeftAdBanner,
  updateRightAdBanner,
  enableAdsForStation,
  userGetAllExternalStation,
  userGetListStation,
  userGetListScheduleDate,
  userGetDetailStation,
  userGetListScheduleTime,
  updateConfigZNS,
  getAllStationArea,
  exportStationExcel,
};
