const Logger = require('../../../utils/logging');
const AppUserDeletedResourceAccess = require('../../AppUsers/resourceAccess/AppUserDeletedResourceAccess');
const MessageCustomerResourceAccess = require('../../CustomerMessage/resourceAccess/MessageCustomerResourceAccess');

async function moveMessageCustomerOfDeletedUser() {
  Logger.info('MOVE MESSAGE CUSTOMER JOB');
  const promiseList = await _splitToBunchOfPromises();

  for (let promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
  Logger.info('MOVE MESSAGE CUSTOMER JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const deletedRecords = await AppUserDeletedResourceAccess.find({}, skip, limit);
    if (deletedRecords && deletedRecords.length > 0) {
      const promiseBunch = deletedRecords.map(appUser => {
        return new Promise(async resolve => {
          const userMessages = await MessageCustomerResourceAccess.find({ customerId: appUser.appUserId }, 0, 100);

          if (userMessages && userMessages.length > 0) {
            for (let message of userMessages) {
              const insertResult = await MessageCustomerDeletedResourceAccess.insert(message);
              if (insertResult) {
                // permanently delete the record
                await MessageCustomerResourceAccess.permanentlyDelete(message.messageCustomerId);
              }
            }
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

moveMessageCustomerOfDeletedUser();

module.exports = {
  moveMessageCustomerOfDeletedUser,
};
