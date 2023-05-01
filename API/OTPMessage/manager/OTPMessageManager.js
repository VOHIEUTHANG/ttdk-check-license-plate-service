/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';

const moment = require('moment');

const OTPMessageResourAccess = require('../resourceAccess/OTPMessageResourceAccess');
const { ERROR } = require('../../Common/CommonConstant');
const { OTP_CONFIRM_STATUS, OTP_ERROR } = require('../OTPMessageConstant');
const { sendOTPToPhoneNumberBySMS, sendOTPToEmail } = require('../OTPMessageFunction');
const utilitiesFunction = require('../../ApiUtils/utilFunctions');

async function userRequestPhoneOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.phoneNumber;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );

      let newOTP = utilitiesFunction.randomInt(999999);
      newOTP = utilitiesFunction.padLeadingZeros(newOTP, 6);

      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];
        await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          otp: newOTP,
        });
      } else {
        let storeResult = await OTPMessageResourAccess.insert({
          id: id,
          otp: newOTP,
          expiredTime: 10,
        });

        if (!storeResult) {
          console.error(OTP_ERROR.CAN_NOT_STORE_OTP);
          return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
        }
      }

      let otpResult = await sendOTPToPhoneNumberBySMS(id, newOTP);
      if (!otpResult) {
        console.error(OTP_ERROR.SEND_OTP_FAILED);
        return reject(OTP_ERROR.SEND_OTP_FAILED);
      }

      resolve('success');
    } catch (e) {
      console.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function userConfirmPhoneOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { otp, phoneNumber } = req.payload;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          otp: otp,
          id: phoneNumber,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];

        let otpDurationDiff = moment().diff(moment(_existingOTPList.createdAt), 'minute');
        if (otpDurationDiff > _existingOTPList.expiredTime) {
          await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
            confirmedAt: new Date(),
          });
          console.error(OTP_ERROR.OTP_EXPIRED);
          return reject(OTP_ERROR.OTP_EXPIRED);
        }

        let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        });

        if (storeResult !== undefined) {
          const { verifyUserPhoneNumber } = require('../../AppUsers/AppUsersFunctions');
          await verifyUserPhoneNumber(phoneNumber);

          return resolve('success');
        } else {
          console.error(OTP_ERROR.CONFIRM_OTP_FAILED);
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
      } else {
        console.error(OTP_ERROR.CONFIRM_OTP_FAILED);
        return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
      }
    } catch (e) {
      console.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function userRequestEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.email;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          id: id,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );

      let newOTP = utilitiesFunction.randomInt(999999);
      newOTP = utilitiesFunction.padLeadingZeros(newOTP, 6);

      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];
        await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          otp: newOTP,
        });
      } else {
        let storeResult = await OTPMessageResourAccess.insert({
          id: id,
          otp: newOTP,
          expiredTime: 10,
        });

        if (!storeResult) {
          console.error(OTP_ERROR.CAN_NOT_STORE_OTP);
          return reject(OTP_ERROR.CAN_NOT_STORE_OTP);
        }
      }

      let otpResult = await sendOTPToEmail(id, newOTP);
      if (!otpResult) {
        console.error(OTP_ERROR.SEND_OTP_FAILED);
        return reject(OTP_ERROR.SEND_OTP_FAILED);
      }

      resolve('success');
    } catch (e) {
      console.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

async function userConfirmEmailOTP(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { otp, email } = req.payload;

      let _existingOTPList = await OTPMessageResourAccess.find(
        {
          otp: otp,
          id: email,
          confirmStatus: OTP_CONFIRM_STATUS.NOT_CONFIRMED,
        },
        0,
        10,
      );
      if (_existingOTPList && _existingOTPList.length > 0) {
        _existingOTPList = _existingOTPList[0];

        let otpDurationDiff = moment().diff(moment(_existingOTPList.createdAt), 'minute');
        if (otpDurationDiff > _existingOTPList.expiredTime) {
          await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
            confirmStatus: OTP_CONFIRM_STATUS.EXPIRED,
            confirmedAt: new Date(),
          });
          console.error(OTP_ERROR.OTP_EXPIRED);
          return reject(OTP_ERROR.OTP_EXPIRED);
        }

        let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
          confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        });

        if (storeResult !== undefined) {
          return resolve('success');
        } else {
          console.error(OTP_ERROR.CONFIRM_OTP_FAILED);
          return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
        }
      } else {
        console.error(OTP_ERROR.CONFIRM_OTP_FAILED);
        return reject(OTP_ERROR.CONFIRM_OTP_FAILED);
      }
    } catch (e) {
      console.error(`error userRequestPhoneOTP`, e);
      reject('failed');
    }
  });
}

module.exports = {
  userRequestPhoneOTP,
  userConfirmPhoneOTP,
  userRequestEmailOTP,
  userConfirmEmailOTP,
};
