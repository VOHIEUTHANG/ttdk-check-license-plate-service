const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const AppUserVehicleDeletedResourceAccess = require('../resourceAccess/AppUserVehicleDeletedResourceAccess');

async function moveDeletedVehicle() {
  Logger.info('MOVE DELETED VEHICLE JOB');
  const deleteInactiveUserPromiseList = await _splitToBunchOfPromises();

  for (promiseBunch of deleteInactiveUserPromiseList) {
    await Promise.all(promiseBunch);
  }
  Logger.info('MOVE DELETED VEHICLE JOB DONE');
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const deletedRecords = await AppUserVehicleResourceAccess.findDeletedRecord(skip, limit);
    if (deletedRecords && deletedRecords.length > 0) {
      const promiseBunch = deletedRecords.map(vehicle => {
        return new Promise(async resolve => {
          // save record to another table
          const insertResult = await AppUserVehicleDeletedResourceAccess.insert(vehicle);

          if (insertResult) {
            await AppUserVehicleResourceAccess.permanentlyDelete(vehicle.appUserVehicleId);
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

moveDeletedVehicle();

module.exports = {
  deleteInactiveUsers: moveDeletedVehicle,
};
