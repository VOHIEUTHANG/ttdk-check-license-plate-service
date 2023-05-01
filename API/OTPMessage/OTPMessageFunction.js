/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const moment = require('moment');
const { OTP_CONFIRM_STATUS, OTP_ERROR } = require('./OTPMessageConstant');
const OTPMessageResourAccess = require('./resourceAccess/OTPMessageResourceAccess');

async function sendOTPToPhoneNumberByCall(phoneNumber, otp) {
  const { sendVoiceOTP } = require('../../ThirdParty/StringeeOTPAPI/StringeeOtpFunctions');
  let sendResult = await sendVoiceOTP(phoneNumber, otp);
  return sendResult;
}

async function sendOTPToPhoneNumberBySMS(phoneNumber, otp) {
  const { sendSMSMessage } = require('../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
  let _message = `TTDK.COM.VN gui ma OTP kich hoat cua quy khach la ${otp}. Vui long khong chia se ma nay cho bat ky ai.`;
  let sendResult = await sendSMSMessage(phoneNumber, _message);
  return sendResult;
}

async function sendOTPToEmail(email, otp) {
  const { generateNewOTPEmail } = require('../../ThirdParty/Email/EmailGenerator');
  let _emailContent = generateNewOTPEmail('', otp);

  const { sendEmail } = require('../../ThirdParty/Email/EmailClient');
  let sendOtpResult = await sendEmail(email, _emailContent.subject, _emailContent.body, _emailContent.htmlBody);

  return sendOtpResult;
}

async function confirmOTPById(id, otpCode) {
  let _existingOTPList = await OTPMessageResourAccess.find(
    {
      otp: otpCode,
      id: id,
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
      return undefined;
    }

    let storeResult = await OTPMessageResourAccess.updateById(_existingOTPList.otpMessageId, {
      confirmStatus: OTP_CONFIRM_STATUS.CONFIRMED,
      confirmedAt: new Date(),
    });

    if (storeResult !== undefined) {
      return 'success';
    } else {
      console.error(OTP_ERROR.CONFIRM_OTP_FAILED);
      return undefined;
    }
  } else {
    console.error(OTP_ERROR.CONFIRM_OTP_FAILED);
    return undefined;
  }
  return undefined;
}

module.exports = {
  sendOTPToPhoneNumberByCall,
  sendOTPToPhoneNumberBySMS,
  sendOTPToEmail,
  confirmOTPById,
};
