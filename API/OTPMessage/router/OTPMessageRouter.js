/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const moduleName = 'OTPMessage';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  userRequestPhoneOTP: {
    tags: ['api', `${moduleName}`],
    description: `userRequestPhoneOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(9).required().alphanum(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestPhoneOTP');
    },
  },
  userConfirmPhoneOTP: {
    tags: ['api', `${moduleName}`],
    description: `userConfirmPhoneOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        phoneNumber: Joi.string().min(9).required().alphanum(),
        otp: Joi.string().min(6).required().max(10),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userConfirmPhoneOTP');
    },
  },
  userRequestEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `userRequestEmailOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().min(6).required().email(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRequestEmailOTP');
    },
  },
  userConfirmEmailOTP: {
    tags: ['api', `${moduleName}`],
    description: `userConfirmEmailOTP ${moduleName}`,
    // pre: [{ method: CommonFunctions.verifyToken }],
    // auth: {
    //   strategy: 'jwt',
    // },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        email: Joi.string().min(6).required().email(),
        otp: Joi.string().min(6).required().max(10),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userConfirmEmailOTP');
    },
  },
};
