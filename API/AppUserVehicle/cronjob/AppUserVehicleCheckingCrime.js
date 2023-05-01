const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const CustomerCriminalRecordFunctions = require('../../CustomerCriminalRecord/CustomerCriminalRecordFunctions');
const CustomerCriminalResourceAccess = require('../../CustomerCriminalRecord/resourceAccess/CustomerCriminalRecordResourceAccess');

async function checkingCustomerViolations() {
  Logger.info('CHECKING CUSTOMER VIOLATIONS');

  let skip = 0;
  while (true) {
    const vehicleBunch = await AppUserVehicleResourceAccess.find({}, skip, 10);
    if (vehicleBunch && vehicleBunch.length > 0) {
      const checkCrimePromiseList = vehicleBunch.map(vehicle => _checkingUserCrime(vehicle));
      await Promise.all(checkCrimePromiseList);
    } else {
      break;
    }
    skip += 10;
  }
}

async function _checkingUserCrime(vehicle) {
  const vehiclePlateNumber = vehicle.vehicleIdentity;
  const crimeList = await CustomerCriminalRecordFunctions.crawlCriminalRecord(vehiclePlateNumber, 1);

  for (crime of crimeList) {
    // insert customer crime data
    const crimeTime = moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate();
    const previousData = await CustomerCriminalResourceAccess.find(
      { customerRecordPlatenumber: vehiclePlateNumber, crimeRecordTime: crimeTime },
      0,
      1,
    );

    if (!previousData || previousData.length <= 0) {
      const criminalData = {
        customerRecordPlatenumber: vehiclePlateNumber,
        crimeRecordContent: crime.behavior,
        crimeRecordStatus: crime.status,
        crimeRecordTime: moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate(),
        crimeRecordPIC: crime.provider,
        crimeRecordLocation: crime.violationAddress,
        crimeRecordContact: crime.contactPhone,
      };

      await CustomerCriminalResourceAccess.insert(criminalData);
    }

    // thong bao den nguoi dung neu ho co phat nguoi chua xy ly
    await CustomerMessageFunctions.createCrimeNotification(crime, vehicle.appUserId, vehicle.appUserVehicleId);
  }
}

module.exports = {
  checkingCustomerViolations,
};
