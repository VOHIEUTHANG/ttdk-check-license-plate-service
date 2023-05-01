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

const Model = require('../resourceAccess/CustomerRecordResourceAccess');

const app = require('../../../server');

describe(`Tests ${Model.modelName}`, function () {
  let token = '';
  let fakeUserName = faker.name.firstName() + faker.name.lastName();
  let testId = 0;
  let testData = {};
  fakeUserName = fakeUserName.replace("'", '');
  before(done => {
    new Promise(async function (resolve, reject) {
      let userData = await TestFunctions.loginUser();
      token = userData.token;
      resolve();
    }).then(() => done());
  });

  it(`Insert ${Model.modelName} full info`, done => {
    let today = new Date();
    let checkDate = `${today.getDate()}/${today.getMonth()}/${today.getFullYear()}`;
    let expiredDate = `${today.getDate()}/${today.getMonth()}/${today.getFullYear() + 1}`;
    const body = {
      customerRecordFullName: fakeUserName,
      customerRecordEmail: faker.internet.email(),
      customerRecordPhone: faker.phone.phoneNumber(),
      customerRecordPlatenumber: '99A999999',
      customerRecordPlateImageUrl: faker.internet.domainName(),
      customerStationId: 1,
      customerRecordCheckDate: checkDate,
      customerRecordCheckExpiredDate: expiredDate,
      customerRecordCheckDuration: 12,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/insert`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        testId = res.body.data[0];
        done();
      });
  });
  it('findById CustomerRecord', done => {
    const body = {
      id: testId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getDetailById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        testData = res.body.data;
        done();
      });
  });
  it('findById CustomerRecord ký tự đặt biệt', done => {
    const body = {
      id: "<>*---===''",
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getDetailById`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          checkResponseStatus(res, 500);
        }
        done();
      });
  });

  it('find CustomerRecord', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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
  it('find todayCustomerRecord', done => {
    const body = {
      filter: {},
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/todayCustomerRecord`)
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

  it('find CustomerRecord customerRecordFullName', done => {
    const body = {
      filter: {
        customerRecordFullName: "''<>*/#",
      },
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('updateById CustomerRecord', done => {
    const body = {
      id: testId,
      data: {
        customerRecordFullName: faker.name.findName(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/updateById`)
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

  it('updateById CustomerRecord data ký tự đặt biệt', done => {
    const body = {
      id: testId,
      data: {
        customerRecordFullName: "<>''---*",
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/updateById`)
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

  it(`Delete ${Model.modelName}`, done => {
    const body = {
      id: testId,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/deleteById`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        done();
      });
  });
  it('import CuntomerRecord', done => {
    fs.readFile('uploads/exportExcel/file_mau_import.xlsx', function read(err, data) {
      if (err) {
        return null;
      }

      var base64data = Buffer.from(data, 'binary').toString('base64');
      const body = {
        file: base64data,
        fileFormat: 'xlsx',
      };
      chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerRecord/importExcel`)
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

  it('import CuntomerRecord false', done => {
    fs.readFile('uploads/exportExcel/file_mau_import.xlsx', function read(err, data) {
      if (err) {
        return null;
      }

      var base64data = Buffer.from(data, 'binary').toString('base64');
      const body = {
        file: base64data,
        fileFormat: 'docx',
      };
      chai
        .request(`0.0.0.0:${process.env.PORT}`)
        .post(`/CustomerRecord/importExcel`)
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

  it('find start Date', done => {
    const body = {
      filter: {},
      startDate: '2021-10-20T23:43:53.000Z',
      endDate: '2021-10-20T23:43:53.000Z',
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('find startDate < endDate', done => {
    const body = {
      filter: {},
      startDate: '2021-10-20T23:43:53.000Z',
      endDate: '2021-10-23T23:43:53.000Z',
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('startDate and endDate faile is format', done => {
    const body = {
      filter: {},
      startDate: '2021-10',
      endDate: '2021',
      skip: 0,
      limit: 20,
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('find record by filter customerRecordPlatenumber', done => {
    const body = {
      filter: {
        customerRecordPlatenumber: '99A999999',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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
  it('find record by filter customerRecordPhone', done => {
    const body = {
      filter: {
        customerRecordPhone: faker.phone.phoneNumber(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('find record by filter customerRecordFullname', done => {
    const body = {
      filter: {
        customerRecordFullName: fakeUserName,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('find record by filter customerRecordEmail', done => {
    const body = {
      filter: {
        customerRecordFullName: fakeUserName,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/getList`)
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

  it('export Excel', done => {
    const body = {};
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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

  it('export Excel by filter customerRecordEmail ', done => {
    const body = {
      filter: {
        customerRecordFullName: faker.internet.email(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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
  it('export excel by filter customerRecordFullname', done => {
    const body = {
      filter: {
        customerRecordFullName: fakeUserName,
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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
  it('export Excel by filter customerRecordPhone', done => {
    const body = {
      filter: {
        customerRecordPhone: faker.phone.phoneNumber(),
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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
  it('export execel by filter customerRecordPlatenumber', done => {
    const body = {
      filter: {
        customerRecordPlatenumber: '99A999999',
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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

  it('export Excel startDate and endDate faile is format', done => {
    const body = {
      startDate: '2021-10',
      endDate: '2021',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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
  it('export Excel startDate > endDate', done => {
    const body = {
      startDate: '2022-10-20T23:43:53.000Z',
      endDate: '2021-10-19T23:43:53.000Z',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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

  it('export Excel startDate and endDate', done => {
    const body = {
      startDate: '2021-10-20T23:43:53.000Z',
      endDate: '2021-10-23T23:43:53.000Z',
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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
  it('export Excel by filter customerRecordEmail ký đặt biệt ', done => {
    const body = {
      filter: {
        customerRecordFullName: "<>'''*/---",
      },
    };
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/${Model.modelName}/exportExcel`)
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
