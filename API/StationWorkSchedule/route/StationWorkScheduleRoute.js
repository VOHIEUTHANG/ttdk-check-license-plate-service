/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const moduleName = 'StationWorkSchedule';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const Response = require('../../Common/route/response').setup(Manager);

const insertSchema = {
  stationsId: Joi.number().min(1).required(),
  scheduleDayOff: Joi.string().example(moment().format('DD/MM/YYYY')).required(),
  scheduleTime: Joi.array()
    .items({
      time: Joi.string(),
      isWorking: Joi.number().valid([0, 1]),
    })
    .required(),
  enableSmallCar: Joi.number(),
  enableRoMooc: Joi.number(),
  enableOtherVehicle: Joi.number(),
};

const updateSchema = {
  scheduleTime: Joi.array().items({
    time: Joi.string(),
    isWorking: Joi.number().valid([0, 1]),
  }),
  enableSmallCar: Joi.number().valid([0, 1]),
  enableRoMooc: Joi.number().valid([0, 1]),
  enableOtherVehicle: Joi.number().valid([0, 1]),
};

const filterSchema = {
  stationsId: Joi.number().integer().min(1),
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
  advanceUserAddDayOff: {
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
        scheduleDayOff: Joi.string().example(moment().format('DD/MM/YYYY')).required(),
        scheduleTime: Joi.array()
          .items({
            time: Joi.string(),
            isWorking: Joi.number().valid([0, 1]),
          })
          .required(),
        enableSmallCar: Joi.number(),
        enableRoMooc: Joi.number(),
        enableOtherVehicle: Joi.number(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userAddDayOff');
    },
  },
  advanceUserUpdateDayOff: {
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
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserUpdateDayOff');
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
        startDate: Joi.string().example(moment().format('DD/MM/YYYY')).required(),
        endDate: Joi.string().example(moment().add(30, 'days').format('DD/MM/YYYY')).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  advanceUserGetListDayOff: {
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
        filter: Joi.object(filterSchema),
        startDate: Joi.string().example(moment().format('DD/MM/YYYY')).required(),
        endDate: Joi.string().example(moment().add(30, 'days').format('DD/MM/YYYY')).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetListDayOff');
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
  deleteById: {
    tags: ['api', `${moduleName}`],
    description: `deleteById ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().integer(),
      }),
    },
    handler(req, res) {
      Response(req, res, 'deleteById');
    },
  },
};
