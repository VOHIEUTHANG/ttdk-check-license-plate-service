/* Copyright (c) 2022 TORITI LIMITED 2022 */

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const VMG_HOST_URL = process.env.VMG_HOST_URL || 'https://api.brandsms.vn';
const VMG_TOKEN =
  process.env.VMG_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c24iOiJ2dHNzIiwic2lkIjoiOWY3ZWFhYjItMTE2Ni00M2M5LWFjZjYtYjljYWJjZjNjYTg1Iiwib2J0IjoiIiwib2JqIjoiIiwibmJmIjoxNjU1NDM4OTgzLCJleHAiOjE2NTU0NDI1ODMsImlhdCI6MTY1NTQzODk4M30.iQ9FdtyX2R-bntxDXsyKsMHmbpkmdb3YZSp1730trcU';
const VMG_BRANDNAME = process.env.VMG_BRANDNAME || 'TTDK 29-14D';
const REPORT_URL_SMS_VMG = process.env.REPORT_URL_SMS_VMG || 'http://report-api.brandsms.vn/api';
const VMG_OTT_HOST_URL = process.env.VMG_OTT_HOST_URL || 'https://api-ott.brandsms.vn';

async function checkStatusByClientID(programCode, referentId, time) {
  if (programCode == undefined && referentId == undefined) return;
  if (time === undefined) {
    time = '';
  }
  let body = {
    programCode: programCode,
    referentId: referentId,
    sendDate: time,
  };
  return new Promise((resolve, reject) => {
    chai
      .request(REPORT_URL_SMS_VMG)
      .post('/Brandname/ReportDetailSend')
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('token', VMG_TOKEN)
      .send(JSON.stringify(body))
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
      });
  });
}

async function sendZNSMessage(phoneNumber, messageContent, customConfig, trackId, templateId, templateData) {
  console.info(`VMG sendZNSMessage ${phoneNumber} - ${trackId} - ${messageContent}`);
  let requestUrl = VMG_HOST_URL;
  let requestToken = VMG_TOKEN;
  let requestBrandname = VMG_BRANDNAME;

  if (customConfig) {
    requestUrl = customConfig.znsApiUrl;
    requestToken = customConfig.znsApiToken;
    requestBrandname = customConfig.znsAPIBrand;
  }

  let body = {
    from: requestBrandname,
    type: 1, //1: Chăm sóc khách hàng, 2: Quảng cáo
    serviceType: 1, //1: Zalo, 2:Viber
    messages: [
      {
        to: phoneNumber,
        requestID: trackId ? trackId : '',
        scheduled: '',
        templateId: templateId,
        templateData: templateData,
      },
    ],
  };
  console.log(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    chai
      .request('https://api-ott.brandsms.vn')
      .post('/api/ott/send')
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('token', requestToken)
      .send(JSON.stringify(body))
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        console.log(res.body);
        console.log(res.text);
        resolve(res.text);
      });
  });
}

async function createClient(znsApiUrl, znsApiToken, znsAPIBrand) {
  const invalidClient = undefined;
  if (znsApiUrl === undefined || znsApiUrl === null || znsApiUrl.trim() === '') {
    console.error(`invalid znsApiUrl ${znsApiUrl}`);
    return invalidClient;
  }

  if (znsApiToken === undefined || znsApiToken === null || znsApiToken.trim() === '') {
    console.error(`invalid znsApiToken ${znsApiToken}`);
    return invalidClient;
  }

  if (znsAPIBrand === undefined || znsAPIBrand === null || znsAPIBrand.trim() === '') {
    console.error(`invalid znsAPIBrand ${znsAPIBrand}`);
    return invalidClient;
  }

  const newClient = {
    znsApiUrl: znsApiUrl,
    znsApiToken: znsApiToken,
    znsAPIBrand: znsAPIBrand,
  };
  return newClient;
}

module.exports = {
  checkStatusByClientID,
  sendZNSMessage,
  createClient,
};
