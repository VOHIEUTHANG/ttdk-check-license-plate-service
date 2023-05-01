/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const app = require('../../../server');

describe(`Tests customer Statistical `, function () {
  let token = '';
  let staffToken = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let userData = await TestFunctions.loginUser();
      token = userData.token;
      let staffData = await TestFunctions.loginStaff();
      staffToken = staffData.token;
      resolve();
    }).then(() => done());
  });
  it(`Report`, done => {
    const body = { stationsId: 1 };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerStatistical/report`)
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

  it(`Report by startDate and EndDate`, done => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerStatistical/report`)
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

  it(`Report all station by startDate and EndDate`, done => {
    const body = {
      startDate: '2021-10-20T23:43:53.000Z',
      endDate: '2021-10-23T23:43:53.000Z',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerStatistical/reportAllStation`)
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
});
