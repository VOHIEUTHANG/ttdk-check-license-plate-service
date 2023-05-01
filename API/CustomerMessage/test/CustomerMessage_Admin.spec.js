/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/CustomerMessageResourceAccess');
const { MESSAGE_CATEGORY } = require('../CustomerMessageConstant');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let messageId;
  let staffToken = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      staffToken = staffData.token;
      done();
      resolve();
    });
  });

  // it('POST /CustomerMessage/sendTestSMS (VIVAS)', done => {
  //   const body = {
  //     "phoneNumber": "0343902960",
  //   };
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerMessage/sendTestSMS`)
  //     .set("Authorization", `Bearer ${staffToken}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  // it('POST /CustomerMessage/sendTestSMS (VIVAS - custom config)', done => {
  //   const body = {
  //     "phoneNumber": "0343902960",
  //     "smsConfig": {
  //       "smsUrl": process.env.SMS_API_URL || 'https://sms.vivas.vn/SMSBNAPINEW',
  //       "smsUserName": process.env.SMS_API_USERNAME || 'vtss',
  //       "smsPassword": process.env.SMS_API_PASSWORD || '1708smsbn',
  //       "smsBrand": process.env.SMS_API_BRAND || 'KiemDinhOto',
  //       "smsProvider": "VIVAS",
  //     },
  //   };

  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerMessage/sendTestSMS`)
  //     .set("Authorization", `Bearer ${staffToken}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  // it('POST /CustomerMessage/sendTestSMS (VIETTEL - custom config)', done => {
  //   const body = {
  //     "phoneNumber": "0343902960",
  //     "smsConfig": {
  //       "smsUrl": process.env.SMS_API_URL || 'http://ams.tinnhanthuonghieu.vn:8009/bulkapi?wsdl',
  //       "smsUserName": process.env.SMS_API_USERNAME || 'smsbrand_ttdk2903v',
  //       "smsPassword": process.env.SMS_API_PASSWORD || 'TTDK2903V@123',
  //       "smsCPCode": process.env.SMS_API_CPCODE || 'TTDK2903V',
  //       "smsServiceId": process.env.SMS_API_SERVICEID || 'TTDK2903V',
  //       "smsProvider": "VIETTEL",
  //     }
  //   };
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerMessage/sendTestSMS`)
  //     .set("Authorization", `Bearer ${staffToken}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  // it('POST /CustomerMessage/sendTestEmail (Custom SMTP)', done => {
  //   const body = {
  //     testEmail: "chaupad@gmail.com",
  //     emailUsername: process.env.SMTP_EMAIL || "contact@vtss.vn",
  //     emailPassword: process.env.SMTP_PASSWORD || "hRExMi24DpkF",
  //     emailConfig: {
  //       emailHost: process.env.SMTP_HOST || "pro17.emailserver.vn",
  //       emailPort: process.env.SMTP_PORT || 465,
  //       emailSecure: process.env.SMTP_SECURE || 1,
  //     },
  //     emailProvider: "CUSTOM"
  //   }
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerMessage/sendTestEmail`)
  //     .set("Authorization", `Bearer ${staffToken}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });

  //GOOGLE tam dung feature nay
  // it('POST /CustomerMessage/sendTestEmail (Gmail)', done => {
  //   const body = {
  //     testEmail: "chaupad@gmail.com",
  //     emailUsername: "trungtamvtss@gmail.com",
  //     emailPassword: "vtss.vn12345",
  //     emailProvider: "GMAIL",
  //   };
  //   chai
  //     .request(`0.0.0.0:${process.env.PORT}`)
  //     .post(`/CustomerMessage/sendTestEmail`)
  //     .set("Authorization", `Bearer ${staffToken}`)
  //     .send(body)
  //     .end((err, res) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       checkResponseStatus(res, 200);
  //       done();
  //     });
  // });
});
