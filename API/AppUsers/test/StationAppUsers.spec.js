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

const Model = require('../resourceAccess/AppUsersResourceAccess');

const app = require('../../../server');

describe(`Tests Station ${Model.modelName}`, function () {
  let token = '';
  let userData = {};
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  before(done => {
    new Promise(async function (resolve, reject) {
      userData = await TestFunctions.loginUser();
      token = userData.token;

      resolve();
    }).then(() => done());
  });

  ///STATION USER TEST
  it('Register station user (no role)', done => {
    fakeUserName = faker.name.firstName() + faker.name.lastName() + (new Date() - 1);
    fakeUserName = fakeUserName.replace(`'`, '');
    const body = {
      lastName: 'string',
      firstName: 'string',
      username: fakeUserName,
      email: faker.internet.email(),
      password: '123456789',
      phoneNumber: 'string',
      stationsId: userData.stationsId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/registerStationUser`)
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

  it('Register station user with role > admin (1)', done => {
    fakeUserName = faker.name.firstName() + faker.name.lastName() + (new Date() - 1);
    fakeUserName = fakeUserName.replace(`'`, '');
    const body = {
      lastName: 'string',
      firstName: 'string',
      username: fakeUserName,
      email: faker.internet.email(),
      password: '123456789',
      phoneNumber: 'string',
      stationsId: userData.stationsId,
      appUserRoleId: 2,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/registerStationUser`)
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

  it('Not allowed Register station user with role = admin (1)', done => {
    fakeUserName = faker.name.firstName() + faker.name.lastName() + (new Date() - 1);
    fakeUserName = fakeUserName.replace(`'`, '');
    const body = {
      lastName: 'string',
      firstName: 'string',
      username: fakeUserName,
      email: faker.internet.email(),
      password: '123456789',
      phoneNumber: 'string',
      stationsId: userData.stationsId,
      appUserRoleId: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/registerStationUser`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });

  it('Get list users of station', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/stationUserList`)
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

  it('Get info of station user by id', done => {
    const body = {
      id: userData.appUserId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/stationUserDetail`)
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

  it('update info for station user', done => {
    const body = {
      id: userData.appUserId,
      data: {
        firstName: faker.name.firstName(),
        phoneNumber: faker.phone.phoneNumber(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/updateStationUserById`)
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
