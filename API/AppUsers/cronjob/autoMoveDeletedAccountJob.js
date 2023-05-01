const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const AppUserDeletedResourceAccess = require('../resourceAccess/AppUserDeletedResourceAccess');

async function moveDeletedAccounts() {
  Logger.info('MOVE DELETED ACCOUNT JOB');
  const promiseList = await _splitToBunchOfPromises();

  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
  Logger.info('MOVE DELETED ACCOUNT JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const deletedUserBunch = await AppUsersResourceAccess.findDeletedRecord(skip, limit);
    if (deletedUserBunch && deletedUserBunch.length > 0) {
      const promiseBunch = deletedUserBunch.map(appUser => {
        return new Promise(async resolve => {
          // delete record
          // save record to another table
          const addResult = await AppUserDeletedResourceAccess.insert(appUser);

          if (addResult) {
            await AppUsersResourceAccess.permanentlyDelete(appUser.appUserId);
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

moveDeletedAccounts();

module.exports = {
  moveDeletedAccount: moveDeletedAccounts,
};
