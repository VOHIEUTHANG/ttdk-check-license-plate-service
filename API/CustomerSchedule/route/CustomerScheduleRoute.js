/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'CustomerSchedule';
const Manager = require(`../manager/${moduleName}Manager`);
const moment = require('moment');
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { MESSAGE_CATEGORY } = require('../../CustomerMessage/CustomerMessageConstant');
const { VEHICLE_TYPE, SCHEDULE_TYPE, SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const { CUSTOMER_RECORD_DB_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

const insertSchema = {
  licensePlates: Joi.string().required(),
  phone: Joi.string().required(),
  fullnameSchedule: Joi.string().required(),
  email: Joi.string().email().allow([null, '']),
  dateSchedule: Joi.string().required(),
  time: Joi.string().required(),
  stationsId: Joi.number().required(),
  vehicleType: Joi.number().default(VEHICLE_TYPE.CAR).required(),
  licensePlateColor: Joi.number().required(),
  notificationMethod: Joi.string().valid([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.EMAIL]).default(null).allow(null),
  scheduleType: Joi.number().valid([SCHEDULE_TYPE.VEHICLE_INSPECTION, SCHEDULE_TYPE.NEW_VEHICLE_INSPECTION, SCHEDULE_TYPE.REGISTER_NEW_VEHICLE]),
};

const updateSchema = {
  licensePlates: Joi.string(),
  phone: Joi.string(),
  fullnameSchedule: Joi.string(),
  email: Joi.string().email().allow([null, '']),
  dateSchedule: Joi.string(),
  time: Joi.string(),
  stationsId: Joi.number(),
  isDeleted: Joi.number(),
  vehicleType: Joi.number(),
  licensePlateColor: Joi.number(),
  notificationMethod: Joi.string().valid([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.EMAIL]),
  CustomerScheduleStatus: Joi.number().valid([SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.CANCELED]),
  scheduleNote: Joi.string(),
};

const filterSchema = {
  dateSchedule: Joi.string(),
  time: Joi.string(),
  stationsId: Joi.number(),
  vehicleType: Joi.number(),
  isDeleted: Joi.number(),
  notificationMethod: Joi.string().valid([MESSAGE_CATEGORY.SMS, MESSAGE_CATEGORY.EMAIL]),
  CustomerScheduleStatus: Joi.number(),
  appUserId: Joi.number().integer().min(1),
  scheduleType: Joi.number().integer(),
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
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
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
        customerScheduleId: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateSchedule');
    },
  },
  find: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().example(moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
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
  getList: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().example(moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
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
  advanceUserGetListSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        startDate: Joi.string().example(moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetList');
    },
  },
  advanceUserSearchSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSearchSchedule');
    },
  },
  userGetListSchedule: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object({
          CustomerScheduleStatus: Joi.number().integer(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        // order: Joi.object({
        //   key: Joi.string().default('createdAt').allow(''),
        //   value: Joi.string().default('desc').allow(''),
        // }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListSchedule');
    },
  },
  userGetDetailSchedule: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetailSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetailSchedule');
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
        customerScheduleId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  userInsertSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        stationsId: Joi.number().integer(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userInsertSchedule');
    },
  },
  advanceUserInsertSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        stationsId: Joi.number().integer(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserInsertSchedule');
    },
  },
  userCreateSchedule: {
    tags: ['api', `${moduleName}`],
    description: `insert ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        ...insertSchema,
        scheduleNote: Joi.string(),
        attachmentList: Joi.array().items({
          attachmentName: Joi.string(),
          attachmentUrl: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCreateSchedule');
    },
  },
  userCancelSchedule: {
    tags: ['api', `${moduleName}`],
    description: `userCancelSchedule ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0).required(),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userCancelSchedule');
    },
  },
  reportTotalByDay: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          stationsId: Joi.number(),
        }),
        startDate: Joi.string().default(moment().subtract(10, 'days').format('DD/MM/YYYY')),
        endDate: Joi.string().default(moment().format('DD/MM/YYYY')),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalByDay');
    },
  },
  reportTotalScheduleByStation: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          stationArea: Joi.string(),
        }),
        startDate: Joi.string().example(moment().format('DD/MM/YYYY')),
        endDate: Joi.string().example(moment().add(10, 'days').format('DD/MM/YYYY')),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalScheduleByStation');
    },
  },
  reportTotalScheduleByStationArea: {
    tags: ['api', `${moduleName}`],
    description: `List ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().example(moment().format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
        endDate: Joi.string().example(moment().add(10, 'days').format(CUSTOMER_RECORD_DB_DATE_FORMAT)),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportTotalScheduleByStationArea');
    },
  },
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
  advanceUserCancelSchedule: {
    tags: ['api', `${moduleName}`],
    description: `Delete ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        customerScheduleId: Joi.number().min(0),
        reason: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserCancelSchedule');
    },
  },
  exportExcelCustomerSchedule: {
    tags: ['api', `${moduleName}`],
    description: `Export excel ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportExcelCustomerSchedule');
    },
  },
  advanceUserExportSchedule: {
    tags: ['api', `${moduleName}`],
    description: `Export excel ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportExcelCustomerSchedule');
    },
  },
};
