/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const OTPMessageRouter = require('./OTPMessageRouter');

module.exports = [
  { method: 'POST', path: '/OTPMessage/user/requestPhoneOTP', config: OTPMessageRouter.userRequestPhoneOTP },
  { method: 'POST', path: '/OTPMessage/user/confirmPhoneOTP', config: OTPMessageRouter.userConfirmPhoneOTP },
  // { method: 'POST', path: '/OTPMessage/user/requestEmailOTP', config: OTPMessageRouter.userRequestEmailOTP },
  // { method: 'POST', path: '/OTPMessage/user/confirmEmailOTP', config: OTPMessageRouter.userConfirmEmailOTP },
];
