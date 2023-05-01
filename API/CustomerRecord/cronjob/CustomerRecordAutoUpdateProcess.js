/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');

const RecordResource = require('../resourceAccess/CustomerRecordResourceAccess');
const CustomerRecordFunctions = require('../CustomerRecordFunctions');

async function updateProcessForAllRecord(station) {
  console.log(`updateProcessForAllRecord ${station.stationsId}`);
  return new Promise(async (resolve, reject) => {
    if (station === undefined) {
      return undefined;
    }
    let processes = {};
    try {
      processes = JSON.parse(station.stationCheckingConfig);
    } catch (error) {
      console.error(`can not parse config of station ${station.stationsId}`);
      console.error(error);
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

    let startDate = moment().format('DD/MM/YYYY');
    let endDate = moment().format('DD/MM/YYYY');

    //go to largest index to smallest, to prevent duplicate checking for records
    for (let i = processes.length - 1; i >= 0; i--) {
      const processConfig = processes[i];
      //we skip last step
      if (processConfig.stepIndex < lastStepIndex) {
        //find all processing records of today
        let recordList = await RecordResource.findRecordByProcessCheckDate(
          {
            customerRecordState: processConfig.stepIndex,
            customerStationId: station.stationsId,
          },
          undefined,
          undefined,
          startDate,
          endDate,
        );

        //check time different (time passed) for each record
        for (let recordCounter = 0; recordCounter < recordList.length; recordCounter++) {
          const recordData = recordList[recordCounter];
          let customerRecordId = recordData.customerRecordId;
          //get time diff from NOW
          let timeDiff = moment(recordData.customerRecordProcessCheckDate).toNow(true);
          if (timeDiff.indexOf('minutes') > -1) {
            timeDiff = parseInt(timeDiff.replace('minutes', '').trim());
          } else if (timeDiff.indexOf('hours') > -1) {
            timeDiff = parseInt(timeDiff.replace('hours', '').trim());
            timeDiff = timeDiff * 60;
          } else if (timeDiff.indexOf('hour') > -1) {
            timeDiff = parseInt(timeDiff.replace('hour', '').trim());
            timeDiff = timeDiff * 60;
          }

          //compare time diff to process duration
          if (timeDiff >= processConfig.stepDuration) {
            let customerRecordData = {
              customerRecordState: processConfig.stepIndex + 1,
            };

            //update state and notify it
            let result = await CustomerRecordFunctions.updateCustomerRecordById(customerRecordId, customerRecordData);
            if (result) {
              console.log(`Auto update success ${customerRecordId}`);
            } else {
              console.error(`Auto update error ${customerRecordId}`);
            }
          }
        }
      }
    }
    resolve('done');
  });
}

module.exports = {
  updateProcessForAllRecord,
};
