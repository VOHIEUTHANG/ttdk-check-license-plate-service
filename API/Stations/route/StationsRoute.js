/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'Stations';
const Manager = require(`../manager/${moduleName}Manager`);
const moment = require('moment');
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { VEHICLE_TYPE } = require('../../CustomerSchedule/CustomerScheduleConstants');

const insertSchema = {
  stationsName: Joi.string().required(),
  stationCode: Joi.string().alphanum().required(),
  stationsLogo: Joi.string().allow(''),
  stationsHotline: Joi.string().allow('').default('099999999'),
  stationsAddress: Joi.string().allow('Cục đăng kiểm Việt Nam'),
  stationsEmail: Joi.string().email(),
  stationsCertification: Joi.string().allow(''),
  stationsVerifyStatus: Joi.number(),
  stationTotalMachine: Joi.number().min(0),
  stationsManager: Joi.string().allow(''),
  stationsLicense: Joi.string().allow(''),
  stationsBanner: Joi.string().allow(''),
  stationsNote: Joi.string().allow(''),
};

const updateSchema = {
  stationsName: Joi.string(),
  stationUrl: Joi.string(),
  stationCheckingAuto: Joi.number(),
  stationsEmail: Joi.string().email(),
  stationBookingConfig: Joi.array().items({
    index: Joi.number(),
    time: Joi.string(),
    limitSmallCar: Joi.number(),
    limitOtherVehicle: Joi.number(),
    limitRoMooc: Joi.number(),
    enableBooking: Joi.number(),
  }),
  stationCheckingConfig: Joi.array().items({
    stepIndex: Joi.number().required(),
    stepVoice: Joi.string().allow(''),
    stepLabel: Joi.string().required(),
    stepDuration: Joi.number().required(),
    stepVoiceUrl: Joi.string().allow(''),
  }),
  isDeleted: Joi.number(),
  stationStatus: Joi.number(),
  stationContractStatus: Joi.number(),
  stationsLogo: Joi.string().allow(''),
  stationsColorset: Joi.string().allow(''),
  stationsHotline: Joi.string().allow(''),
  stationsAddress: Joi.string().allow(''),
  stationEnableUseSMS: Joi.number().allow([1, 0]),
  stationUseCustomSMTP: Joi.number().allow([1, 0]),
  stationCustomSMTPConfig: Joi.string().allow(''),
  stationUseCustomSMSBrand: Joi.number().allow([1, 0]),
  stationCustomSMSBrandConfig: Joi.string().allow(''),
  stationEnableUseZNS: Joi.number().allow([1, 0]),
  stationEnableUseSMS: Joi.number().allow([1, 0]),
  stationUseCustomZNS: Joi.number().allow([1, 0]),
  stationCustomZNSConfig: Joi.string().allow(''),
  stationLandingPageUrl: Joi.string().allow(''),
  stationWebhookUrl: Joi.string().allow(''),
  stationMapSource: Joi.string().allow(''),
  isHidden: Joi.number(),
  stationsCertification: Joi.string().allow(''),
  stationsVerifyStatus: Joi.number(),
  stationTotalMachine: Joi.number().min(0),
  stationsManager: Joi.string().allow(''),
  stationsManagerPhone: Joi.string().allow(''),
  stationsLicense: Joi.string().allow(''),
  stationsBanner: Joi.string().allow(''),
  stationsNote: Joi.string().allow(''),
  stationArea: Joi.string(),
  totalSmallCar: Joi.number().integer(),
  totalOtherVehicle: Joi.number().integer(),
  totalRoMooc: Joi.number().integer(),
  availableStatus: Joi.number().integer(),
  totalInspectionLine: Joi.number().integer(),
  limitSchedule: Joi.number().integer(),
  enableConfigAllowBookingOverLimit: Joi.number().integer(),
  enableConfigAutoConfirm: Joi.number().integer(),
  enableConfigBookingOnToday: Joi.number().integer(),
};

const filterSchema = {
  stationsName: Joi.string(),
  stationUrl: Joi.string(),
  isDeleted: Joi.number(),
  stationStatus: Joi.number(),
  stationContractStatus: Joi.number(),
  stationsEmail: Joi.string().email(),
  stationArea: Joi.string(),
  availableStatus: Joi.number().integer(),
};

module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'insert');
    },
  },
  updateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }], //TODO Remove later
    // pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  advanceUserUpdateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object({
          ...updateSchema,
          totalSmallCar: Joi.number().integer().min(0), // limit min totalVehicle per day
          totalOtherVehicle: Joi.number().integer().min(0),
          totalRoMooc: Joi.number().integer().min(0),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  find: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(''),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(500),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  exportStationExcel: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(''),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(500),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportStationExcel');
    },
  },
  userGetListStation: {
    tags: ['api', `${moduleName}`],
    description: `userGetList  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(''),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListStation');
    },
  },
  userGetAllExternalStation: {
    tags: ['api', `${moduleName}`],
    description: `userGetList  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().allow(''),
        filter: Joi.object({
          stationArea: Joi.string(),
          availableStatus: Joi.number().integer(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetAllExternalStation');
    },
  },
  findById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  advanceUserFindById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  findByUrl: {
    tags: ['api', `${moduleName}`],
    description: `find by url ${moduleName}`,
    validate: {
      payload: Joi.object({
        stationsUrl: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findByUrl');
    },
  },
  findByStationCode: {
    tags: ['api', `${moduleName}`],
    description: `findByStationCode ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      payload: Joi.object({
        stationCode: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findByStationCode');
    },
  },
  resetAllDefaultMp3: {
    tags: ['api', `${moduleName}`],
    description: `resetAllDefaultMp3 ${moduleName}`,
    validate: {},
    handler: function (req, res) {
      Response(req, res, 'resetAllDefaultMp3');
    },
  },

  reportAllInactiveStation: {
    tags: ['api', `${moduleName}`],
    description: `reportAllInactiveStation  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().allow(''),
        filter: Joi.object({
          stationArea: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportAllInactiveStation');
    },
  },
  reportAllActiveStation: {
    tags: ['api', `${moduleName}`],
    description: `reportAllActiveStation  ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string().allow(''),
        filter: Joi.object({
          stationArea: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportAllActiveStation');
    },
  },
  updateConfigSMS: {
    tags: ['api', `${moduleName}`],
    description: `Config SMS`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
        smsUrl: Joi.string(),
        smsUserName: Joi.string(),
        smsPassword: Joi.string(),
        smsBrand: Joi.string(),
        smsToken: Joi.string(),
        smsCPCode: Joi.string(), //<<use for SOAP Client
        smsServiceId: Joi.string(), //<<use for SOAP Client
        smsProvider: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateConfigSMS');
    },
  },
  updateConfigZNS: {
    tags: ['api', `${moduleName}`],
    description: `Config ZNS`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0).required(),
        znsUrl: Joi.string(),
        znsUserName: Joi.string(),
        znsPassword: Joi.string(),
        znsBrand: Joi.string(),
        znsToken: Joi.string(),
        znsCPCode: Joi.string(), //<<use for SOAP Client
        znsServiceId: Joi.string(), //<<use for SOAP Client
        znsProvider: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateConfigZNS');
    },
  },
  updateConfigSMTP: {
    tags: ['api', `${moduleName}`],
    description: `Config SMTP`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        smtpHost: Joi.string().required(),
        smtpServiceName: Joi.string(),
        smtpPort: Joi.number().required(),
        smtpSecure: Joi.string().required(),
        smtpAuth: Joi.object({
          user: Joi.string().required(),
          pass: Joi.string().required(),
        }).required(),
        smtpTls: Joi.object({
          rejectUnauthorized: Joi.boolean().required(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateConfigSMTP');
    },
  },
  updateCustomSMTP: {
    tags: ['api', `${moduleName}`],
    description: `CusTom SMTP`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        CustomSMTP: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateCustomSMTP');
    },
  },
  updateCustomSMSBrand: {
    tags: ['api', `${moduleName}`],
    description: `CusTom SMTP`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationUseCustomSMSBrand: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateCustomSMSBrand');
    },
  },
  enableAdsForStation: {
    tags: ['api', `${moduleName}`],
    description: `turn on/off for Ad of station`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationsEnableAd: Joi.number().min(0).max(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'enableAdsForStation');
    },
  },
  updateRightAdBanner: {
    tags: ['api', `${moduleName}`],
    description: `update Right Ad Banner`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationsCustomAdBannerRight: Joi.string().allow('').required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateRightAdBanner');
    },
  },
  updateLeftAdBanner: {
    tags: ['api', `${moduleName}`],
    description: `update Left Ad Banner`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().min(0),
        stationsCustomAdBannerLeft: Joi.string().allow('').required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateLeftAdBanner');
    },
  },
  userGetListScheduleDate: {
    tags: ['api', `${moduleName}`],
    description: `userGetListScheduleDate ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        startDate: Joi.string().example(moment().format('DD/MM/YYYY')).required(),
        endDate: Joi.string().example(moment().add(30, 'days').format('DD/MM/YYYY')).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListScheduleDate');
    },
  },
  userGetListScheduleTime: {
    tags: ['api', `${moduleName}`],
    description: `userGetListScheduleTime ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationsId: Joi.number().integer().min(0).required(),
        date: Joi.string().example(moment().format('DD/MM/YYYY')).required(),
        vehicleType: Joi.number().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListScheduleTime');
    },
  },
  getAllStationArea: {
    tags: ['api', `${moduleName}`],
    description: `get all station area`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'getAllStationArea');
    },
  },
  userGetAllStationArea: {
    tags: ['api', `${moduleName}`],
    description: `get all station area`,
    pre: [{ method: CommonFunctions.verifyTokenOrAllowEmpty }],
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'getAllStationArea');
    },
  },
  userGetDetailStation: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetailStation');
    },
  },
};
