'use strict';
const moment = require('moment');
const moduleName = 'AppUserVehicleExpired';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const { VEHICLE_PLATE_TYPE, VEHICLE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');

const insertSchema = {
  appUserId: Joi.number(),
  stationsId: Joi.number().integer(),
  vehicleIdentity: Joi.string().required(),
  vehiclePlateColor: Joi.string()
    .valid([VEHICLE_PLATE_TYPE.BLUE, VEHICLE_PLATE_TYPE.RED, VEHICLE_PLATE_TYPE.WHITE, VEHICLE_PLATE_TYPE.YELLOW])
    .required(),
  vehicleRegistrationCode: Joi.string().allow('', null),
  vehicleType: Joi.number().integer().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]).required(),
  vehicleBrandName: Joi.string().allow('', null),
  vehicleBrandModel: Joi.string().allow('', null),
  vehicleRegistrationImageUrl: Joi.string().allow('', null),
  vehicleExpiryDate: Joi.string().example(moment().add(3, 'months').format('DD/MM/YYYY')),
  certificateSeries: Joi.string().allow('', null),
};

const updateSchema = {
  vehiclePlateColor: Joi.string().valid([VEHICLE_PLATE_TYPE.BLUE, VEHICLE_PLATE_TYPE.RED, VEHICLE_PLATE_TYPE.WHITE, VEHICLE_PLATE_TYPE.YELLOW]),
  vehicleRegistrationCode: Joi.string().allow('', null),
  vehicleType: Joi.number().integer().valid([VEHICLE_TYPE.CAR, VEHICLE_TYPE.OTHER, VEHICLE_TYPE.RO_MOOC]),
  vehicleBrandName: Joi.string().allow('', null),
  vehicleBrandModel: Joi.string().allow('', null),
  vehicleRegistrationImageUrl: Joi.string().allow('', null),
  vehicleExpiryDate: Joi.string().example(moment().add(1, 'year').format('DD/MM/YYYY')),
  certificateSeries: Joi.string().allow('', null),
};

const filterSchema = {
  vehicleType: Joi.number().integer(),
  appUserId: Joi.number(),
  vehicleExpiryDate: Joi.string(),
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
    description: `find ${moduleName}`,
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
        searchText: Joi.string(),
        startDate: Joi.string(),
        endDate: Joi.string(),
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
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
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
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'deleteById');
    },
  },
};
