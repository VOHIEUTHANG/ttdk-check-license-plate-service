const moment = require('moment');
const Logger = require('../../../utils/logging');
const SMSMessageResourceAccess = require('../resourceAccess/SMSMessageResourceAccess');

async function deleteExpiredSMS() {
  Logger.info('DELETE EXPIRED SMS JOB');
  const promiseList = await _splitToBunchOfPromises();

  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
  Logger.info('DELETE EXPIRED SMS DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];
  const thirtyDaysAgo = moment().subtract(30, 'days').format();
  let skip = 0;
  while (true) {
    const recordBunch = await SMSMessageResourceAccess.customSearch({}, skip, limit, undefined, thirtyDaysAgo);
    if (recordBunch && recordBunch.length > 0) {
      const promiseBunch = recordBunch.map(smsRecord => {
        return new Promise(async resolve => {
          await SMSMessageResourceAccess.permanentlyDelete(smsRecord.smsMessageId);
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

deleteExpiredSMS();

module.exports = {
  deleteExpiredSMS,
};
