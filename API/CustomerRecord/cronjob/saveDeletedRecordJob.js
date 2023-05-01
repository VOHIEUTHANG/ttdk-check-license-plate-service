const Logger = require('../../../utils/logging');
const CustomerRecordResourceAccess = require('../resourceAccess/CustomerRecordResourceAccess');
const CustomerRecordDeletedResourceAccess = require('../resourceAccess/CustomerRecordDeletedResourceAccess');

async function saveDeletedCustomerRecord() {
  Logger.info('SAVE DELETED CUSTOMER RECORD JOB');
  const promiseList = await _splitToBunchOfPromises();

  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
  Logger.info('SAVE DELETED CUSTOMER RECORD JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const deletedRecordBunch = await CustomerRecordResourceAccess.findDeletedRecord(skip, limit);
    if (deletedRecordBunch && deletedRecordBunch.length > 0) {
      const promiseBunch = deletedRecordBunch.map(customerRecord => {
        return new Promise(async resolve => {
          const insertResult = await CustomerRecordDeletedResourceAccess.insert(customerRecord);
          if (insertResult) {
            await CustomerRecordResourceAccess.permanentlyDelete(customerRecord.customerRecordId);
          }
          resolve(true);
        });
      });
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

saveDeletedCustomerRecord();

module.exports = {
  saveDeletedCustomerRecord,
};
