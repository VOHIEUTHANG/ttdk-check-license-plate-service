/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const moment = require('moment');
const moduleName = 'CustomerStatistical';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
module.exports = {
  reportCustomer: {
    tags: ['api', `${moduleName}`],
    description: `report ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        // Start Date is optional
        startDate: Joi.string().allow(null, ''),
        // End Date is optional
        endDate: Joi.string().allow(null, ''),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'customerReportByStation');
    },
  },
  advanceUserReportCustomer: {
    tags: ['api', `${moduleName}`],
    description: `report ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        // Start Date is optional
        startDate: Joi.string().allow(null, ''),
        // End Date is optional
        endDate: Joi.string().allow(null, ''),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'customerReportByStation');
    },
  },
  reportAllStation: {
    tags: ['api', `${moduleName}`],
    description: `report ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string(),
        endDate: Joi.string(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'reportAllStation');
    },
  },
};
