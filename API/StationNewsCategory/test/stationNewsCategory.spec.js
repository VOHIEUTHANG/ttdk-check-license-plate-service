/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

const app = require('../../../server');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests StationNewsCategory`, function () {
  let stationNewsCategoryId;
  let token = '';
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  fakeUserName = fakeUserName.replace("'", '');
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });
  it('insert stationNewsCategory', done => {
    const body = {
      stationNewsCategoryTitle: fakeUserName,
      stationNewsCategoryContent: fakeUserName,
      stationNewsCategoryAvatar: fakeUserName,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationNewsCategoryId = res.body.data[0];
        done();
      });
  });

  it('find stationNewsCategory', done => {
    const body = {
      filter: {},
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/find`)
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

  it('update by Id stationNewsCategory', done => {
    const body = {
      id: stationNewsCategoryId,
      data: {
        stationNewsCategoryDisplayIndex: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/updateById`)
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

  it('find by Id stationNewsCategory', done => {
    const body = {
      id: stationNewsCategoryId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/findById`)
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

  it('delete by id stationNewsCategory', done => {
    const body = {
      id: stationNewsCategoryId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/deleteById`)
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

  it('delete by id false format stationNewsCategory', done => {
    const body = {
      id: 'a',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/deleteById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('get news category list', done => {
    const body = {
      skip: 0,
      limit: 20,
      stationsUrl: 'station-dev.kiemdinhoto.vn',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/user/getList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('get news category List false stationUrl', done => {
    const body = {
      skip: 0,
      limit: 20,
      stationsUrl: 12,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNewsCategory/user/getList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
});
