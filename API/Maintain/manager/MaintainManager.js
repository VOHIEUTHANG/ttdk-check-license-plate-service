/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const MaintainFunctions = require('../MaintainFunctions');
const Logger = require('../../../utils/logging');

async function maintainAll(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainAll(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function maintainGoogleAds(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainGoogleAds(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function maintainLiveGame(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainLiveGame(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function maintainTransfer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainTransfer(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function maintainWithdraw(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainWithdraw(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function maintainSignup(req) {
  return new Promise(async (resolve, reject) => {
    try {
      MaintainFunctions.maintainSignup(req.payload.status);
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getSystemStatus(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(MaintainFunctions.systemStatus);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  maintainAll,
  maintainGoogleAds,
  maintainLiveGame,
  maintainTransfer,
  maintainWithdraw,
  maintainSignup,
  getSystemStatus,
};
