/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppConfig = require('../../config/app');
const Logger = require('../../utils/logging');

function createToken(user, tokenType = 'normalUser') {
  let userData = JSON.parse(JSON.stringify(user));

  userData.tokenType = tokenType;

  return jwt.sign(userData, AppConfig.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: AppConfig.jwt.expiresIn,
  });
}

function decodeToken(token) {
  token = token.replace('Bearer ', '');
  var decoded = undefined;
  try {
    decoded = jwt.verify(token, AppConfig.jwt.secret);
  } catch (err) {
    Logger.error('Token', err);
  }
  return decoded;
}

function decodeTokenWithoutExpired(token) {
  token = token.replace('Bearer ', '');
  var decoded = undefined;
  try {
    decoded = jwt.verify(token, AppConfig.jwt.secret, { ignoreExpiration: true });
  } catch (err) {
    Logger.error('Token', err);
  }
  return decoded;
}

function hashPassword(password, cb) {
  // Generate a salt at level 10 strength
  bcrypt.genSalt(10, (err, salt) => {
    if (!err) {
      bcrypt.hash(password, salt, (err, hash) => {
        return cb(err, hash);
      });
    }
  });
}
module.exports = { createToken, decodeToken, hashPassword, decodeTokenWithoutExpired };
