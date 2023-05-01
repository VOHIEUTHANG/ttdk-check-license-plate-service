/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationNewsResourceAccess');

const app = require('../../../server');
const { modelName } = require('../resourceAccess/StationNewsResourceAccess');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let stationNewsId;
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
  it('insert stationNews', done => {
    const body = {
      stationNewsTitle: fakeUserName,
      stationNewsContent: fakeUserName,
      stationNewsAvatar: fakeUserName,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationNewsId = res.body.data[0];
        done();
      });
  });

  it('getList stationNews', done => {
    const body = {
      filter: {},
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/getList`)
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
  it('get New List', done => {
    const body = {
      skip: 0,
      limit: 20,
      stationsUrl: 'station-dev.kiemdinhoto.vn',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('get New List false stationUrl', done => {
    const body = {
      skip: 0,
      limit: 20,
      stationsUrl: 12,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsList`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('get New Detail', done => {
    const body = {
      id: stationNewsId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsDetail`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('get New Detail number false', done => {
    const body = {
      id: 1 / 2,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsDetail`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('get New Detail number false', done => {
    const body = {
      id: -5,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/StationNews/getNewsDetail`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
  it('getDetailById stationNews', done => {
    const body = {
      id: stationNewsId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/getDetailById`)
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

  it('getDetailById false format stationNews', done => {
    const body = {
      id: 'stationNewsId',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/getDetailById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });

  it('delete by id stationNews', done => {
    const body = {
      id: stationNewsId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/deleteById`)
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

  it('delete by id false format stationNews', done => {
    const body = {
      id: 'a',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/deleteById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
});
