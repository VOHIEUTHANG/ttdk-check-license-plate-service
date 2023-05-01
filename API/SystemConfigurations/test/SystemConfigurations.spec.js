/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/SystemConfigurationsResourceAccess');

const app = require('../../../server');
const { modelName } = require('../resourceAccess/SystemConfigurationsResourceAccess');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let staffToken = '';

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      staffToken = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('clean left banner ad (default empty)', done => {
    const body = {
      systemLeftBannerAd: ``,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/updateById`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
  it('clean right banner ad (default empty', done => {
    const body = {
      systemRightBannerAd: ``,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/updateById`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
  it('update left banner ad', done => {
    const body = {
      systemLeftBannerAd: `https://${process.env.HOST_NAME}/uploads/media/quangcao/leftBanner.gif`,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/updateById`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
  it('update right banner ad', done => {
    const body = {
      systemRightBannerAd: `https://${process.env.HOST_NAME}/uploads/media/quangcao/rightBanner.gif`,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/updateById`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
  it('get system configuration', done => {
    const body = {
      id: 1, //only 1 system configuration, then it is ok to HARDCODE here
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/findById`)
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
