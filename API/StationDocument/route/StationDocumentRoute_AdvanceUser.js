/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const moduleName = 'StationDocument';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const CommonFunctions = require('../../Common/CommonFunctions');
const { CUSTOMER_RECORD_DISPLAY_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const Response = require('../../Common/route/response').setup(Manager);

module.exports = {
  advanceUserGetListDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetListDocument ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          documentPublishedDay: Joi.string().example(moment().format(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT)),
        }),
        startDate: Joi.string().example(moment().format(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT)),
        endDate: Joi.string().example(moment().add(30, 'days').format(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT)),
        searchText: Joi.string(),
        skip: Joi.number().default(0),
        limit: Joi.number().default(20),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'advanceUserGetListDocument');
    },
  },
  advanceUserGetDetailDocument: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetDetailDocument ${moduleName}`,
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
      Response(req, res, 'advanceUserGetDetailDocument');
    },
  },
};
