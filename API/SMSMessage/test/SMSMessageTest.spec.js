const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const messages = require('./messageTest');
const { SMS_MESSAGE_STATUS } = require('../SMSMessageConstants');
require('dotenv').config();
const crypto = require('crypto');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Test Station`, () => {
  let staffToken = '';
  let stationToken = '';
  let txHash = '';
  let stationId;
  before(done => {
    new Promise(async (resolve, reject) => {
      let staffData = await TestFunctions.loginStaff();
      staffToken = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('login station', done => {
    const body = {
      username: 'tramtest123admin',
      password: '123456789',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/loginUser`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationToken = res.body.data.token;
        stationId = res.body.data.stationId;
        done();
      });
  });

  let keys = Object.keys(messages);
  for (let i = 0; i < keys.length; i++) {
    let hash = crypto.randomBytes(5).toString('hex');
    it('create deposit transaction', done => {
      const body = {
        paymentAmount: 100,
        transactionRef: '123456789',
      };
      chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/PaymentDepositTransaction/user/requestDeposit`)
        .send(body)
        .set('Authorization', `Bearer ${stationToken}`)
        .end((err, res) => {
          if (err) {
            console.error(err);
          }
          let query = res.body.data.split('?tnxRef=')[1];
          txHash = query.split('&token=')[0];
          checkResponseStatus(res, 200);
          done();
        });
    });
    it('insert sms message ' + i, done => {
      const body = {
        smsMessageContent: messages[keys[i]].replace('{{SMS_REF}}', 'TRTGW' + txHash),
        smsMessageNote: 'AUTO_SYNC',
        smsMessageOrigin: keys[i].split('_')[0],
        smsMessageStatus: SMS_MESSAGE_STATUS.NEW,
        smsMessageStationId: stationId,
        smsReceiveDate: '2022/10/21',
        smsReceiveTime: '06:34',
        smsHash: hash,
      };
      chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/SMSMessage/insert`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(body)
        .end((err, res) => {
          if (err) {
            console.error(err);
          }
          checkResponseStatus(res, 200);
          msgId = res.body.data;
          done();
        });
    });

    it('should error create sms message ' + i, done => {
      const body = {
        smsMessageContent: messages[keys[i]],
        smsMessageNote: 'AUTO_SYNC',
        smsMessageOrigin: keys[i].split('_')[0],
        smsMessageStatus: SMS_MESSAGE_STATUS.NEW,
        smsReceiveDate: '2022/10/21',
        smsReceiveTime: '06:34',
        smsHash: hash,
      };
      chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/SMSMessage/user/create`)
        .set('Authorization', `Bearer ${stationToken}`)
        .send(body)
        .end((err, res) => {
          if (err) {
            console.error(err);
          }
          checkResponseStatus(res, 500);
          done();
        });
    });
    txHash = '';
  }

  it('find sms message', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/find`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('get list sms message', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/user/getList`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('update sms message', done => {
    const body = {
      id: msgId,
      data: {
        smsMessageStatus: SMS_MESSAGE_STATUS.COMPLETED,
        smsMessageOrigin: 'Agribank',
        smsMessageNote: 'test',
        isDeleted: 1,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/updateById`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('update sms message', done => {
    const body = {
      id: msgId,
      data: {
        smsMessageStatus: SMS_MESSAGE_STATUS.COMPLETED,
        smsMessageOrigin: 'Agribank',
        smsMessageNote: 'test',
        isDeleted: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/SMSMessage/user/updateDataMessage`)
      .set('Authorization', `Bearer ${stationToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
});
