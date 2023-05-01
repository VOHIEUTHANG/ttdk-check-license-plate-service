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

const Model = require('../resourceAccess/CustomerScheduleResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let Scheduleid;
  let token = '';
  before(done => {
    new Promise(async function (resolve, reject) {
      let staffData = await TestFunctions.loginUser();
      token = staffData.token;
      resolve();
    }).then(() => done());
  });

  it('Add CustomerSchedule', done => {
    const body = {
      licensePlates: faker.name.findName(),
      phone: faker.phone.phoneNumber(),
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: faker.date.past(),
      time: '7h30',
      stationsId: 0,
      notificationMethod: 'SMS',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/add`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        Scheduleid = res.body.data[0];
        done();
      });
  });

  it('Add CustomerSchedule ký tự đặt biệt', done => {
    const body = {
      licensePlates: "<.?>''---*",
      phone: faker.phone.phoneNumber(),
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: faker.date.past(),
      time: '7h30',
      stationsId: 0,
      notificationMethod: 'SMS',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/add`)
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

  it('Delete CustomerSchedule', done => {
    const body = {
      customerScheduleId: Scheduleid,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/delete`)
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

  it('Delete CustomerSchedule body string', done => {
    const body = {
      customerScheduleId: 'Scheduleid',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });

  it('Delete CustomerSchedule body number false', done => {
    const body = {
      customerScheduleId: 1.5,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });

  it('Delete CustomerSchedule body number false', done => {
    const body = {
      customerScheduleId: 1 * 5,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });
  it('find by Id CustomerSchedule', done => {
    const body = {
      customerScheduleId: Scheduleid,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/findId`)
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

  it('find all CustomerSchedule', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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
  it('find all CustomerSchedule by filter', done => {
    const body = {
      filter: {
        licensePlates: '999aaaaaa',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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
  it('find all CustomerSchedule by filter ký tự đặt biệt', done => {
    const body = {
      filter: {
        licensePlates: "<>.''''``*/---",
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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

  it('seachText customerSchedule', done => {
    const body = {
      searchText: 'string',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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

  it('seachText customerSchedule ký tự đặt biệt', done => {
    const body = {
      searchText: "'<>*/''",
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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
  it('find by time CustomerSchedule', done => {
    const body = {
      filter: {
        time: '7h30',
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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

  it('find by time CustomerSchedule false body is number', done => {
    const body = {
      filter: {
        time: 7.3,
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });
  it('find by time is undefine', done => {
    const body = {
      filter: {
        time: '0h00',
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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
  it('find by time CustomerSchedule fails format', done => {
    const body = {
      filter: {
        time: '0aaa',
      },
      skip: 0,
      limit: 20,
      order: {
        key: 'createdAt',
        value: 'desc',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/list`)
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

  it('update by id CustomerSchedule', done => {
    const body = {
      customerScheduleId: Scheduleid,
      data: {
        licensePlates: 'string',
        phone: 'string',
        email: 'string',
        dateSchedule: 'string',
        time: 'string',
        stationsId: 0,
        isDeleted: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/update`)
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

  it('update by id CustomerSchedule false Id', done => {
    const body = {
      customerScheduleId: 'Scheduleid',
      data: {
        licensePlates: 'string',
        phone: 'string',
        email: 'string',
        dateSchedule: 'string',
        time: 'string',
        stationsId: 0,
        isDeleted: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/update`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }

        done();
      });
  });
  it('update by id CustomerSchedule false data', done => {
    const body = {
      customerScheduleId: 'Scheduleid',
      data: {
        licensePlates: 123,
        phone: 'string',
        email: 'string',
        dateSchedule: 'string',
        time: 'string',
        stationsId: 0,
        isDeleted: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/update`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 200);
        }

        done();
      });
  });

  it('update by id CustomerSchedule false data ký tự đặt biệt', done => {
    const body = {
      customerScheduleId: Scheduleid,
      data: {
        licensePlates: "<>./*-''",
        phone: 'string',
        email: 'string',
        dateSchedule: 'string',
        time: 'string',
        stationsId: 0,
        isDeleted: 0,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/update`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
        }
        checkResponseStatus(res, 500);
        done();
      });
  });
});
