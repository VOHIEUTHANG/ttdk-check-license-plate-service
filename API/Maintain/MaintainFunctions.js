/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../utils/logging');

let systemStatus = {
  all: true,
  liveGame: true,
  enableGoogleAds: true,
  transfer: true,
  withdraw: true,
  signup: true,
};

//Maintain button for		ALL WEB
async function maintainAll(enable) {
  Logger.info('Maintain', systemStatus);
  if (enable === true) {
    systemStatus.all = true;
  } else {
    systemStatus.all = false;
  }
}

//Maintain button for		Live Game
async function maintainLiveGame(enable) {
  if (enable === true) {
    systemStatus.liveGame = true;
  } else {
    systemStatus.liveGame = false;
  }
  Logger.info('Maintain', systemStatus);
}

//Maintain button for		Deposit
async function maintainGoogleAds(enable) {
  if (enable === true) {
    systemStatus.enableGoogleAds = true;
  } else {
    systemStatus.enableGoogleAds = false;
  }
  Logger.info('Maintain', systemStatus);
}

//Maintain button for		Transfer Deposit / Withdraw
async function maintainTransfer(enable) {
  if (enable === true) {
    systemStatus.transfer = true;
  } else {
    systemStatus.transfer = false;
  }
  Logger.info('Maintain', systemStatus);
}

//Maintain button for		Withdraw
async function maintainWithdraw(enable) {
  if (enable === true) {
    systemStatus.withdraw = true;
  } else {
    systemStatus.withdraw = false;
  }
  Logger.info('Maintain', systemStatus);
}

//Maintain button for		Signup New USER
async function maintainSignup(enable) {
  if (enable === true) {
    systemStatus.signup = true;
  } else {
    systemStatus.signup = false;
  }
  Logger.info('Maintain', systemStatus);
}

module.exports = {
  maintainAll,
  maintainGoogleAds,
  maintainLiveGame,
  maintainTransfer,
  maintainWithdraw,
  maintainSignup,
  systemStatus: systemStatus,
};
