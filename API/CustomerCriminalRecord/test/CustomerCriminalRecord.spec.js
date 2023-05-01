/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/CustomerCriminalRecordResourceAccess');

const app = require('../../../server');
const { modelName } = require('../resourceAccess/CustomerCriminalRecordResourceAccess');

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
  //TODO: implement need later
});
