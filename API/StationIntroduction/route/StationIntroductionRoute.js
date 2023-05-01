/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'StationIntroduction';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

const updateSchema = {
  stationIntroductionTitle: Joi.string(),
  slideBanners: Joi.string(),
  stationIntroductionSlogan: Joi.string(),
  stationIntroductionContent: Joi.string(),
  stationIntroductionMedia: Joi.string(),
  stationIntroSection1Content: Joi.string(),
  stationIntroSection1Media: Joi.string(),
  stationIntroSection2Content: Joi.string(),
  stationIntroSection2Media: Joi.string(),
  stationIntroServices: Joi.string(),
  stationFacebookUrl: Joi.string(),
  stationTwitterUrl: Joi.string(),
  stationYoutubeUrl: Joi.string(),
  stationInstagramUrl: Joi.string(),
};

module.exports = {
  findById: {
    tags: ['api', `${moduleName}`],
    description: `findById ${moduleName}`,
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
  advanceUserGetDetail: {
    tags: ['api', `${moduleName}`],
    description: `advanceUserGetDetail ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
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
  advanceUserUpdateStationIntro: {
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
      Response(req, res, 'updateById');
    },
  },
  stationIntroductionDetail: {
    tags: ['api', `${moduleName}`],
    description: `get details ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationUrl: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getStationIntroductionDetail');
    },
  },
  advanceUserStationIntroductionDetail: {
    tags: ['api', `${moduleName}`],
    description: `get details ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        stationUrl: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getStationIntroductionDetail');
    },
  },
};
