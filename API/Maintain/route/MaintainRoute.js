/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'Maintain';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

let insertSchema = {
  status: Joi.boolean(),
};

module.exports = {
  getSystemStatus: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} getSystemStatus`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      // headers: Joi.object({
      //   authorization: Joi.string(),
      // }).unknown(),
      payload: Joi.object(),
    },
    handler: function (req, res) {
      Response(req, res, 'getSystemStatus');
    },
  },
  maintainAll: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} all`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'maintainAll');
    },
  },
  maintainGoogleAds: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} deposit`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'maintainGoogleAds');
    },
  },
  maintainLiveGame: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} live game`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'maintainLiveGame');
    },
  },
  maintainTransfer: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} transfer`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'maintainTransfer');
    },
  },
  maintainWithdraw: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} withdraw`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'maintainWithdraw');
    },
  },
  maintainSignup: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} signup`,
    pre: [{ method: CommonFunctions.verifyToken }],
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
      Response(req, res, 'maintainSignup');
    },
  },
};
