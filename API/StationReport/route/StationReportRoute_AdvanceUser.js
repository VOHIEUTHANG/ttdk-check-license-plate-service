/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const moduleName = 'StationReport';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const { CUSTOMER_RECORD_DISPLAY_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const Response = require('../../Common/route/response').setup(Manager);

// { method: 'POST', path: '/StationReport/advanceUser/getStationReport', config: StationReportRoute_AdvanceUser.advanceUserGetStationReport },

module.exports = {
  advanceUserSubmitTodayReport: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserSubmitTodayReport ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        totalCustomerCheckingCompleted: Joi.number().min(0).max(999).required(),
        totalCustomerCheckingFailed: Joi.number().min(0).max(999).required(),
        totalCustomerCheckingCanceled: Joi.number().min(0).max(999).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserSubmitTodayReport');
    },
  },
  advanceUserGetTodayReport: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetTodayReport ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetTodayReport');
    },
  },
  advanceUserGetStationReport: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetStationReport ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        startDate: Joi.string().example(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT).required(),
        endDate: Joi.string().example(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetStationReport');
    },
  },
};
