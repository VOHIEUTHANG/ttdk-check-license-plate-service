/* Copyright (c) 2022 TORITI LIMITED 2022 */

const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');

const { checkResponseStatus } = require('../../Common/test/Common');
const TestFunctions = require('../../Common/test/CommonTestFunctions');
const Model = require('../resourceAccess/StationIntroductionResourceAccess');

const app = require('../../../server');
const { modelName } = require('../resourceAccess/StationIntroductionResourceAccess');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe(`Tests ${Model.modelName}`, function () {
  let stationsId = 0;
  let stationUrl = '';
  let token = '';
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  fakeUserName = fakeUserName.replace("'", '');

  async function getStationDetails(stationId) {
    const body = {
      id: stationId,
    };
    return new Promise((resolve, reject) => {
      chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/Stations/getDetailById`)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .end((err, res) => {
          if (err) {
            console.error(err);
            reject(err);
          }
          checkResponseStatus(res, 200);
          resolve(res.body.data);
        });
    });
  }

  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      token = staffData.token;
      let stationData = await getStationDetails(staffData.stationsId);
      stationsId = staffData.stationsId;
      stationUrl = stationData.stationUrl.replace('https://', '');
      resolve();
    }).then(() => done());
  });

  it('POST /StationsIntro/stationIntroductionDetail', done => {
    const body = {
      stationUrl: stationUrl,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/stationIntroductionDetail`)
      // .set("Authorization", `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('POST /StationIntroduction/updateStationIntro', done => {
    const body = {
      id: stationsId,
      data: {
        stationIntroductionTitle: 'not updated',
        slideBanners: 'not updated',
        stationIntroductionSlogan: 'not updated',
        stationIntroductionContent: 'not updated',
        stationIntroductionMedia: 'not updated',
        stationIntroSection1Content: 'not updated',
        stationIntroSection1Media: 'not updated',
        stationIntroSection2Content: 'not updated',
        stationIntroSection2Media: 'not updated',
        stationIntroServices: 'not updated',
        stationFacebookUrl: 'not updated',
        stationTwitterUrl: 'not updated',
        stationYoutubeUrl: 'not updated',
        stationInstagramUrl: 'not updated',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${modelName}/updateStationIntro`)
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
