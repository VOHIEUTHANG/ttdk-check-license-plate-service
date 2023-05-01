/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'PaymentGateway';
const Manager = require(`../manager/PaymentGatewayManager`);
const Joi = require('joi');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');

module.exports = {
  receivePaymentVNPAY: {
    tags: ['api', `${moduleName}`],
    description: 'Receive a payment from VNPAYQR',
    handler: function (req, res) {
      return new Promise((resolve, reject) => {
        Manager.receivePaymentVNPAY(req, res).then(result => {
          res(result);
        });
      });
    },
  },
  //This API is used for mobile only with payment method app-to-app via ATM card
  //with this redirect URL, SDK from VNPAY will callback to our app
  finishVNPAYPayment: {
    tags: ['api', `${moduleName}`],
    description: 'finish a payment from VNPAY',
    handler: function (req, res) {
      res(Handler.finishPayment(req));
    },
  },
  verifyVNPAYPayment: {
    tags: ['api', `${moduleName}`],
    description: 'Verify after paid from VNPAY',
    handler: function (req, res) {
      Response(req, res, 'verifyVNPAYPayment');
    },
  },
  makePaymentRequestVNPAY: {
    tags: ['api', `${moduleName}`],
    description: 'Make payment request to VNPAY',
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string().description('Bearer {token}'),
      }).unknown(),
      payload: Joi.object({
        customerReceiptId: Joi.number().min(1).required().default(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'makePaymentRequestVNPAY');
    },
  },
  advanceUserMakePaymentRequestVNPAY: {
    tags: ['api', `${moduleName}`],
    description: 'Make payment request to VNPAY',
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string().description('Bearer {token}'),
      }).unknown(),
      payload: Joi.object({
        customerReceiptId: Joi.number().min(1).required().default(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'makePaymentRequestVNPAY');
    },
  },
  receivePaymentMOMO: {
    tags: ['api', `${moduleName}`],
    description: 'Receive a payment from MOMO',
    validate: {
      //do not know if body of request from MOMO is.
      payload: Joi.object({
        // partnerCode: Joi.string(),
        // accessKey: Joi.string(),
        // amount: Joi.number(),
        // partnerRefId: Joi.string(),
        // partnerTransId: Joi.string().allow(''),
        // transType: Joi.string(),
        // momoTransId: Joi.string(),
        // status: Joi.number(),
        // message: Joi.string(),
        // responseTime: Joi.number(),
        // storeId: Joi.string(),
        // signature: Joi.string(),
      })
        .unknown()
        .allow(null),
    },
    handler: function (req, res) {
      Response(req, res, 'receivePaymentMOMO');
    },
  },
  makePaymentRequestMOMO: {
    tags: ['api', `${moduleName}`],
    description: 'Make payment request to MOMO',
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string().description('Bearer {token}'),
      }).unknown(),
      payload: Joi.object({
        servicePackageId: Joi.number().min(1).required().default(1),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'makePaymentRequestMOMO');
    },
  },
};
