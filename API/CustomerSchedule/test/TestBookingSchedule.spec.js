const faker = require('faker');
const chai = require('chai');
const expect = chai.expect;
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
  let token = '';
  let appUserId;

  before(done => {
    new Promise(async function (resolve, reject) {
      let customer = await TestFunctions.loginCustomer();
      token = customer.token;
      appUserId = customer.appUserId;
      resolve();
    }).then(() => done());
  });

  it('Add Schedule', done => {
    const body = {
      licensePlates: '12D12324',
      phone: '0335647164',
      fullnameSchedule: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      dateSchedule: faker.date.past(),
      time: '7h-9h',
      stationsId: 2,
      notificationMethod: 'SMS',
      vehicleType: 1,
      licensePlateColor: 0,
    };

    const scheduleCountByPhonePromise = Model.count({ phone: body.phone });
    const scheduleCountByUserIdPromise = Model.count({ appUserId: appUserId });

    const MAX_BOOKING_COUNT = 20;

    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/CustomerSchedule/user/createSchedule`)
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }

        scheduleCountByPhonePromise.then(count => {
          if (count < MAX_BOOKING_COUNT) {
            checkResponseStatus(res, 200);
          } else {
            checkResponseStatus(res, 500);
            expect(err === 'BLOCK_USER_BOOKING_SCHEDULE');
          }
        });

        scheduleCountByUserIdPromise.then(count => {
          if (count < MAX_BOOKING_COUNT) {
            checkResponseStatus(res, 200);
          } else {
            checkResponseStatus(res, 500);
            expect(err === 'BLOCK_USER_BOOKING_SCHEDULE');
          }
        });

        done();
      });
  });
});
