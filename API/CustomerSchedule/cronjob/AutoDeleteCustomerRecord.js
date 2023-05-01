/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../../utils/logging');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerRecordResourceAccess = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');

async function autoDeleteCustomerRecord() {
  Logger.info('AUTO DELETE CUSTOMER RECORD WHEN BOOKING SCHEDULE IS CANCELED !');
  const promiseList = await _splitToBunchOfPromises();
  for (let promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const canceledScheduleBunch = await CustomerScheduleResourceAccess.find({ CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED }, skip, limit);
    if (canceledScheduleBunch && canceledScheduleBunch.length > 0) {
      const promiseBunch = canceledScheduleBunch.map(schedule => _deleteLinkedCustomerRecord(schedule.customerRecordId));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _deleteLinkedCustomerRecord(customerRecordID) {
  if (customerRecordID) {
    const linkedRecord = await CustomerRecordResourceAccess.findById(customerRecordID);
    if (linkedRecord) {
      const deleteResult = await CustomerRecordResourceAccess.deleteById(customerRecordID);
      if (deleteResult) {
        Logger.info('DELETE CUSTOMER RECORD ID ', customerRecordID, ' SUCCESS !');
      } else {
        Logger.error('DELETE CUSTOMER RECORD ID ', customerRecordID, ' FAIL !');
      }
    }
  }
}

module.exports = {
  autoDeleteCustomerRecord,
};
