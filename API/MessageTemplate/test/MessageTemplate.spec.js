/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/MessageTemplateResourceAccess');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
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
  it(`Find`, done => {
    const body = { stationsId: 1 };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/MessageTemplate/find`)
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
