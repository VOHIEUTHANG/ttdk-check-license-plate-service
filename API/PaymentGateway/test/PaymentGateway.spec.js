/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
// const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/PaymentMethodResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, () => {
  let token = '';
  let paymentMethodId = '';
  let userToken = '';
  before(done => {
    new Promise(async (resolve, reject) => {
      let staffData = await TestFunctions.loginStaff();
      token = staffData.token;
      let userDate = await TestFunctions.loginUser();
      userToken = userDate.token;
      resolve();
    }).then(() => done());
  });

  it('insert payment method', done => {
    const body = {
      paymentMethodName: 'MOMO',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PaymentMethod/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        paymentMethodId = res.body.data[0];
        done();
      });
  });

  it('find payment method', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PaymentMethod/find`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('getList payment method for user', done => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PaymentMethod/getList`)
      .set('Authorization', `Bearer ${userToken}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('getList payment method for user (no token)', done => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PaymentMethod/getList`)
      .set('Authorization', ``)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('update payment method', done => {
    const body = {
      id: paymentMethodId,
      data: {
        paymentMethodName: 'MOMO',
      },
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PaymentMethod/updateById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('delete payment method', done => {
    const body = {
      id: paymentMethodId,
    };

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/PaymentMethod/deleteById`)
      .set('Authorization', `Bearer ${token}`)
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
