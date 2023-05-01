/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationsResource = require('../../Stations/resourceAccess/StationsResourceAccess');
const CustomerAutoProcess = require('./CustomerRecordAutoUpdateProcess');
const CustomerAutoComplete = require('./CustomerRecordAutoCompleteProcess');

async function autoUpdateProcessForStation() {
  console.log(`autoUpdateProcessForStation`);
  if (process.env.ENABLE_AUTOPROCESS === 0) {
    return;
  }
  let stationsList = await StationsResource.find(
    {
      stationCheckingAuto: true,
    },
    undefined,
    undefined,
  );

  if (stationsList && stationsList.length > 0) {
    let promiseList = [];
    for (let i = 0; i < stationsList.length; i++) {
      const station = stationsList[i];
      const promise = new Promise(async (resolve, reject) => {
        let result = await CustomerAutoProcess.updateProcessForAllRecord(station);
        resolve(result);
      });

      promiseList.push(promise);
    }

    Promise.all(promiseList).then(values => {
      console.log(`autoUpdateProcessForStation ${values}`);
    });
  }
}

async function autoCompleteProcessForAllStation() {
  console.log(`autoUpdateProcessForStation`);
  if (process.env.ENABLE_AUTOPROCESS === 0) {
    return;
  }
  let stationsList = await StationsResource.find({}, undefined, undefined);

  if (stationsList && stationsList.length > 0) {
    let promiseList = [];
    for (let i = 0; i < stationsList.length; i++) {
      const station = stationsList[i];
      const promise = new Promise(async (resolve, reject) => {
        let result = await CustomerAutoComplete.completeProcessForAllRecord(station);
        resolve(result);
      });

      promiseList.push(promise);
    }

    await Promise.all(promiseList).then(values => {
      console.log(`autoCompleteProcessForAllStation ${values}`);
    });
  }
}

module.exports = {
  autoUpdateProcessForStation,
  autoCompleteProcessForAllStation,
};
