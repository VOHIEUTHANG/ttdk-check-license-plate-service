/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const API_SID = process.env.STRINGEE_API_SID;
const API_SECRET = process.env.STRINGEE_API_SECRET;
const STRINGEE_OTP_PHONE = process.env.STRINGEE_OTP_PHONE;

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

function _createTokenStringee() {
  const payload = {
    jti: `${API_SID}-${Date.now()}`, //JWT ID
    iss: API_SID, //API key sid
    exp: new Date() - 1 + 3600 * 24, //expiration time 24h
    rest_api: true,
  };
  const header = {
    typ: 'JWT',
    alg: 'HS256', // only support HS256
    cty: 'stringee-api;v=1',
  };

  return jwt.sign(payload, API_SECRET, {
    header: header,
  });
}

const STRINGEE_ACTIONS = {
  // Mã xác thực của quý khách là
  OTP_WELCOME_MESSAGE: {
    action: 'play',
    fileName: 'UKBGANCWLV-1666340883400.wav',
    bargeIn: false,
    loop: 1,
  },
  1: {
    action: 'play',
    fileName: 'IMCCMXFLZN-1666340913990.wav',
    bargeIn: false,
    loop: 1,
  },
  2: {
    action: 'play',
    fileName: 'VNTSYSJIWX-1666340923002.wav',
    bargeIn: false,
    loop: 1,
  },
  3: {
    action: 'play',
    fileName: 'UJAZUWIYYL-1666340932660.wav',
    bargeIn: false,
    loop: 1,
  },
  4: {
    action: 'play',
    fileName: 'LZYJEVWDWG-1666340943810.wav',
    bargeIn: false,
    loop: 1,
  },
  5: {
    action: 'play',
    fileName: 'TVWZGMEANP-1666340955318.wav',
    bargeIn: false,
    loop: 1,
  },
  6: {
    action: 'play',
    fileName: 'XKXVRHXCIX-1666340963776.wav',
    bargeIn: false,
    loop: 1,
  },
  7: {
    action: 'play',
    fileName: 'RVPIUFNLQW-1666340972659.wav',
    bargeIn: false,
    loop: 1,
  },
  8: {
    action: 'play',
    fileName: 'EZRTAATNCD-1666340979932.wav',
    bargeIn: false,
    loop: 1,
  },
  9: {
    action: 'play',
    fileName: 'QYYBQJOONA-1666340987959.wav',
    bargeIn: false,
    loop: 1,
  },
  0: {
    action: 'play',
    fileName: 'HNVDDMMJOJ-1666340902199.wav',
    bargeIn: false,
    loop: 1,
  },
};
async function sendVoiceOTP(phoneNumber, otp) {
  console.log(`sendVoiceOTP: ${phoneNumber} - ${otp}`);
  if (!phoneNumber || phoneNumber === null || phoneNumber.trim() === '') {
    return undefined;
  }
  //if phoneNumber start with 0
  if (phoneNumber.indexOf('0') === 0) {
    phoneNumber = phoneNumber.replace('0', '84');
  } else if (phoneNumber.indexOf('840') === 0) {
    phoneNumber = phoneNumber.replace('0', '');
  }

  let _action = [STRINGEE_ACTIONS.OTP_WELCOME_MESSAGE];
  let _otpActionList = otp.split('');
  for (let i = 0; i < _otpActionList.length; i++) {
    const _otpAction = _otpActionList[i];
    _action.push(STRINGEE_ACTIONS[_otpAction]);
  }

  let token = _createTokenStringee();

  let reqBody = {
    from: {
      type: 'external',
      number: STRINGEE_OTP_PHONE,
      alias: STRINGEE_OTP_PHONE,
    },
    to: [
      {
        type: 'external',
        number: phoneNumber,
        alias: phoneNumber,
      },
    ],
    answer_url: 'https://developer.stringee.com/scco_helper/simple_project_answer_url?record=false&appToPhone=auto&recordFormat=mp3',
    actions: _action,
  };

  const api = 'https://api.stringee.com';
  const { body } = await chai
    .request(`${api}`)
    .post(`/v1/call2/callout`)
    .set('Content-type', 'application/json')
    .set('X-STRINGEE-AUTH', token)
    .send(reqBody);
  console.log(body);
  return true;
}

module.exports = {
  sendVoiceOTP,
};
