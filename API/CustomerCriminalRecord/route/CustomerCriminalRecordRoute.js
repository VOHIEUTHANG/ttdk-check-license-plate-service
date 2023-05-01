/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'CustomerCriminalRecord';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const moment = require('moment');

const insertSchema = {
  customerRecordId: Joi.number(),
  customerRecordPlatenumber: Joi.string().required(),
  crimeRecordContent: Joi.string().required(),
  crimeRecordStatus: Joi.string(),
  crimeRecordTime: Joi.string().example(moment().format()),
  crimeRecordPIC: Joi.string(),
  crimeRecordLocation: Joi.string(),
  crimeRecordContact: Joi.string(),
};

const updateSchema = {
  crimeRecordContent: Joi.string(),
  customerRecordPlatenumber: Joi.string(),
  crimeRecordStatus: Joi.string(),
  crimeRecordTime: Joi.string(),
  crimeRecordPIC: Joi.string(),
  crimeRecordLocation: Joi.string(),
  crimeRecordContact: Joi.string(),
};

const filterSchema = {
  customerRecordId: Joi.number(),
  customerRecordPlatenumber: Joi.string(),
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
        searchText: Joi.string(),
        filter: Joi.object(filterSchema),
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
      Response(req, res, 'deleteById');
    },
  },
  fetchNewRecords: {
    tags: ['api', `${moduleName}`],
    description: `fetch new ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        plateNumber: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'fetchNewRecords');
    },
  },
  advanceUserFetchNewRecords: {
    tags: ['api', `${moduleName}`],
    description: `fetch new ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        plateNumber: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'fetchNewRecords');
    },
  },
  fetchCrimeRecords: {
    tags: ['api', `${moduleName}`],
    description: `fetchCrimeRecords ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        plateNumber: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'fetchNewRecords');
    },
  },
  refreshCrimeRecords: {
    tags: ['api', `${moduleName}`],
    description: `refreshCrimeRecords ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        plateNumber: Joi.string().required(),
        customerRecordId: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'refreshCrimeRecords');
    },
  },
};
