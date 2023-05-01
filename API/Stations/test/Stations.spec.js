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

const Model = require('../resourceAccess/StationsResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  let stationsId = 0;
  let stationData = {};
  fakeUserName = fakeUserName.replace("'", '') + new Date().getSeconds();
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginStaff();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it(`Insert ${Model.modelName}`, done => {
    const body = {
      stationsName: fakeUserName,
      stationCode: fakeUserName,
      stationsEmail: faker.internet.email(),
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationsId = res.body.data[0];
        done();
      });
  });

  it(`Insert ${Model.modelName} (no email)`, done => {
    fakeUserName = faker.name.firstName() + faker.name.lastName();
    fakeUserName = fakeUserName.replace("'", '');
    fakeUserName = fakeUserName + new Date().getSeconds();
    const body = {
      stationsName: fakeUserName,
      stationCode: fakeUserName,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationsId = res.body.data[0];
        done();
      });
  });

  it('findById Stations', done => {
    const body = {
      id: stationsId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/getDetailById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        stationData = res.body.data;
        done();
      });
  });

  it('findById Stations false format', done => {
    const body = {
      id: 'stationsId',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/getDetailById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });
  it('find Stations', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/getList`)
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
  it('find Stations by filter', done => {
    const body = {
      filter: {
        stationsName: 'string',
      },
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/getList`)
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

  it('find Stations by URL', done => {
    const body = {
      filter: {
        stationUrl: 'string',
      },
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/getList`)
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

  it('find Stations by filter ký tự đặt biệt', done => {
    const body = {
      filter: {
        stationsName: "<,.>''''---**-*",
      },
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/getList`)
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
  it('updateById Stations', done => {
    const body = {
      id: stationsId,
      data: {
        stationsName: 'Automation test updated',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateById`)
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });

  it('updateById Stations false id', done => {
    const body = {
      id: 'stationsId',
      data: {
        stationsName: 'Automation test updated',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateById`)
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });
  it('updateById Stations false data', done => {
    const body = {
      id: 'stationsId',
      data: {
        stationsName: 123,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateById`)
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 200);
        }

        done();
      });
  });

  it('updateById Stations false data ký tự đặt biệt', done => {
    const body = {
      id: stationsId,
      data: {
        stationsName: "<./.'''",
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateById`)
      .send(body)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          console.log(err);
        }
        checkResponseStatus(res, 500);
        done();
      });
  });
  it(`setupSMS`, done => {
    const body = {
      stationsId: stationsId,
      smsUrl: 'string',
      smsUserName: fakeUserName,
      smsPassword: 'string',
      smsBrand: 'string',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/UpdateConfigSMS`)
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

  it(`setupSMTP`, done => {
    const body = {
      stationsId: stationsId,
      smtpHost: 'string',
      smtpPort: 0,
      smtpSecure: 'string',
      smtpAuth: {
        user: 'string',
        pass: 'string',
      },
      smtpTls: {
        rejectUnauthorized: false,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/UpdateConfigSMTP`)
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

  it(`update SMSBrand `, done => {
    const body = {
      stationsId: stationsId,
      stationUseCustomSMSBrand: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/UpdateCustomSMSBrand`)
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

  it(`update CustomSMTP `, done => {
    const body = {
      stationsId: stationsId,
      CustomSMTP: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/UpdateCustomSMTP`)
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
  it(`update Right Ad Banner`, done => {
    const body = {
      stationsId: stationsId,
      stationsCustomAdBannerRight: 'http://www.sierraconnection.com/banner8.gif',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateRightAdBanner`)
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
  it(`clean Right Ad Banner (use default banner)`, done => {
    const body = {
      stationsId: stationsId,
      stationsCustomAdBannerRight: '',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateRightAdBanner`)
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
  it(`update Left Ad Banner`, done => {
    const body = {
      stationsId: stationsId,
      stationsCustomAdBannerLeft: 'http://www.sierraconnection.com/banner8.gif',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateLeftAdBanner`)
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

  it(`clean Left Ad Banner (use default banner)`, done => {
    const body = {
      stationsId: stationsId,
      stationsCustomAdBannerLeft: '',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/updateLeftAdBanner`)
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

  it(`enable Ads For Station`, done => {
    const body = {
      stationsId: stationsId,
      stationsEnableAd: 1,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/enableAdsForStation`)
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
  it(`disable Ads For Station`, done => {
    const body = {
      stationsId: stationsId,
      stationsEnableAd: 0,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Stations/enableAdsForStation`)
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
