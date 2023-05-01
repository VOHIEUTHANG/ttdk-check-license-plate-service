'use strict';
const moduleName = 'SMSMessage';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { SMS_MESSAGE_STATUS } = require('../SMSMessageConstants');
const moment = require('moment');

const insertSchema = {
  smsMessageContent: Joi.string().required(),
  smsMessageNote: Joi.string().default('AUTO_SYNC'),
  smsMessageOrigin: Joi.string().default('BIDV').required(),
  smsMessageStatus: Joi.string().default(SMS_MESSAGE_STATUS.NEW),
  smsReceiveDate: Joi.string().default(moment().format('YYYY/MM/DD')),
  smsReceiveTime: Joi.string().default(moment().format('HH:mm')),
  smsHash: Joi.string().required(),
};

const filterSchema = {
  smsMessageStatus: Joi.string().allow([
    SMS_MESSAGE_STATUS.COMPLETED,
    SMS_MESSAGE_STATUS.CANCELED,
    SMS_MESSAGE_STATUS.FAILED,
    SMS_MESSAGE_STATUS.PENDING,
    SMS_MESSAGE_STATUS.NEW,
  ]),
  smsMessageOrigin: Joi.string(),
  smsMessageContent: Joi.string(),
};

const updateSchema = {
  smsMessageStatus: Joi.string().allow([
    SMS_MESSAGE_STATUS.COMPLETED,
    SMS_MESSAGE_STATUS.CANCELED,
    SMS_MESSAGE_STATUS.FAILED,
    SMS_MESSAGE_STATUS.PENDING,
    SMS_MESSAGE_STATUS.NEW,
  ]),
  smsMessageOrigin: Joi.string(),
  smsMessageNote: Joi.string(),
  smsMessageContent: Joi.string(),
  smsMessageAppUserId: Joi.number().min(0),
  isDeleted: Joi.number().allow([0, 1]),
  isHidden: Joi.number().allow([0, 1]),
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
        filter: Joi.object({
          ...filterSchema,
          smsMessageStationId: Joi.number().min(0),
        }),
        startDate: Joi.string(),
        endDate: Joi.string(),
        searchText: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  getList: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        startDate: Joi.string(),
        endDate: Joi.string(),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getList');
    },
  },
  getDetailById: {
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
        id: Joi.number().min(0).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getDetailById');
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
        id: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  updateDataMessage: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
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
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  robotInsert: {
    tags: ['api', `${moduleName}`],
    description: `robotInsert ${moduleName}`,
    // validate: {
    //   query: Joi.object({
    //     phoneNumber: Joi.string().required(),
    //     apiKey: Joi.string().required(),
    //   }).unknown(),
    //   payload: Joi.object({
    //     number: Joi.string().required(),
    //     message: Joi.string().required(),
    //     type: Joi.string().required(),
    //   })
    // },
    handler: function (req, res) {
      Response(req, res, 'robotInsert');
    },
  },
};
