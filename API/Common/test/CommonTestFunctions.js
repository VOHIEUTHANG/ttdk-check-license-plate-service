/* Copyright (c) 2022 TORITI LIMITED 2022 */

const chai = require('chai');
const { checkResponseStatus } = require('./Common');

async function loginStaff() {
  const body = {
    username: 'string',
    password: 'string',
  };
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/Staff/loginStaff`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
          reject(undefined);
        }
        checkResponseStatus(res, 200);
        resolve(res.body.data);
      });
  });
}

async function loginUser() {
  const body = {
    username: 'tramdevadmin',
    password: '123456789',
  };
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/loginUser`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        resolve(res.body.data);
      });
  });
}

async function loginCustomer() {
  const body = {
    phoneNumber: '0335647164',
    password: '123456789',
  };
  return new Promise((resolve, reject) => {
    chai
      .request(`0.0.0.0:${process.env.PORT}`)
      .post(`/AppUsers/loginUserByPhone`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        resolve(res.body.data);
      });
  });
}
module.exports = {
  loginStaff,
  loginUser,
  loginCustomer,
};
