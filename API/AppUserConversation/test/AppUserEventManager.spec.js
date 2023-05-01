/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const Model = require('../resourceAccess/AppUserMembershipResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let id;
  let token = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('insert membership', done => {
    const body = {
      appUserMembershipTitle: faker.name.title(),
      appUserMembershipDescription: faker.name.jobDescriptor(),
      appUserMembershipInvitationRequired: Math.random() * 100,
      appUserMembershipAssetRequired: 1,
      appUserMembershipAssetF1Required: 10,
      appUserMembershipBonusPrize: 1,
      appUserMembershipBonusPrizeType: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsersMembership/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        id = res.body.data[0];
        done();
      });
  });

  it('get list membership', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsersMembership/find`)
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

  it('Delete membership by id', done => {
    const body = {
      id: id,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsersMembership/deleteById`)
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

  it('Update membership by id', done => {
    const body = {
      id: id,
      data: {
        appUserMembershipTitle: faker.name.title(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsersMembership/updateById`)
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

  it('get membership by id', done => {
    const body = {
      id: id,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsersMembership/findById`)
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
