const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const AppUserDeletedResourceAccess = require('../resourceAccess/AppUserDeletedResourceAccess');
const { USER_VERIFY_PHONE_NUMBER_STATUS } = require('../AppUsersConstant');

async function deleteInactiveUsers() {
  Logger.info('DELETE INACTIVE USERS JOB');
  const deleteInactiveUserPromiseList = await _splitToBunchOfPromises();

  for (promiseBunch of deleteInactiveUserPromiseList) {
    await Promise.all(promiseBunch);
  }
  Logger.info('DELETE INACTIVE USERS JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];
  const sixtyDaysAgo = moment().subtract(60, 'days').format();

  let skip = 0;
  while (true) {
    const inactiveUserBunch = await AppUsersResourceAccess.customSearch(
      {
        isVerifiedPhoneNumber: USER_VERIFY_PHONE_NUMBER_STATUS.NOT_VERIFIED,
        appUserRoleId: 0,
      },
      skip,
      limit,
      undefined,
      sixtyDaysAgo,
    );
    if (inactiveUserBunch && inactiveUserBunch.length > 0) {
      const promiseBunch = inactiveUserBunch.map(appUser => {
        return new Promise(async resolve => {
          // save record to another table
          const insertResult = await AppUserDeletedResourceAccess.insert(appUser);

          if (insertResult) {
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

deleteInactiveUsers();

module.exports = {
  deleteInactiveUsers,
};
