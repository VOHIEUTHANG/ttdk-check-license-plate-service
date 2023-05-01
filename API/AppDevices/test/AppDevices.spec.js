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

const Model = require('../resourceAccess/AppDevicesResourceAccess');

const app = require('../../../server');

describe(`Tests AppDevices`, function () {
  let token = '';
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  fakeUserName = fakeUserName.replace("'", '');
  before(done => {
    new Promise(async function (resolve, reject) {
      let userData = await TestFunctions.loginUser();
      token = userData.token;
      resolve();
    }).then(() => done());
  });
  it('updateById AppDevices', done => {
    const body = {
      id: 0,
      data: {
        deviceStatus: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppDevices/UpdateById`)
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

  it('delete by Id AppDevices', done => {
    const body = {
      id: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppDevices/deleteById`)
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
