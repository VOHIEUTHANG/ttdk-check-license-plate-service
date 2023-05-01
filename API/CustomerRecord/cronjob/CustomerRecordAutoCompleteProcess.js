/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const RecordResource = require('../resourceAccess/CustomerRecordResourceAccess');
const { CHECKING_STATUS } = require('../CustomerRecordConstants');
const Logger = require('../../../utils/logging');

async function completeProcessForAllRecord(station) {
  Logger.info(`completeProcessForAllRecord ${station.stationsId}`);
  return new Promise(async (resolve, reject) => {
    if (station === undefined) {
      return undefined;
    }
    let processes = {};
    try {
      processes = JSON.parse(station.stationCheckingConfig);
    } catch (error) {
      Logger.error(`can not parse config of station ${station.stationsId}`);
      Logger.error(error);
      resolve(undefined);
      return;
    }

    let lastStepIndex = 0;
    //get latest index of step
    //-> if car already gone to end of sequence, we will skip it
    for (let i = 0; i < processes.length; i++) {
      const processConfig = processes[i];
      if (processConfig.stepIndex > lastStepIndex) {
        lastStepIndex = processConfig.stepIndex;
      }
    }

    let completedData = {
      customerRecordState: lastStepIndex,
      customerRecordCheckStatus: CHECKING_STATUS.COMPLETED,
    };

    let completeFilter = {
      customerStationId: station.stationsId,
    };

    await RecordResource.updateAll(completedData, completeFilter);
    resolve('done');
  });
}

module.exports = {
  completeProcessForAllRecord,
};
