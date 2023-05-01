/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'Upload';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  uploadMediaFile: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} upload media`,
    // pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }], //TODO Delete later
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      parse: true,
    },
    handler: function (req, res) {
      Response(req, res, 'uploadMediaFile');
    },
  },
  advanceUserUploadMediaFile: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} upload media`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      parse: true,
    },
    handler: function (req, res) {
      Response(req, res, 'uploadMediaFile');
    },
  },
  uploadAdMediaFile: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} upload media`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      parse: true,
    },
    handler: function (req, res) {
      Response(req, res, 'uploadAdMediaFile');
    },
  },
  advanceUserUploadAdMediaFile: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} upload media`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        imageData: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    payload: {
      maxBytes: 10 * 1024 * 1024, //10 mb
      parse: true,
    },
    handler: function (req, res) {
      Response(req, res, 'uploadAdMediaFile');
    },
  },
  uploadUserAvatar: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} upload media`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        image: Joi.binary().encoding('base64'),
        imageFormat: Joi.string().default('png'),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'uploadUserAvatar');
    },
  },
};
