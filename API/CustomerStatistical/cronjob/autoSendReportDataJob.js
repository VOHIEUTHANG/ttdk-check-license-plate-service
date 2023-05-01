const moment = require('moment');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const RoleUserView = require('../../AppUsers/resourceAccess/RoleUserView');
const AppUserRoleResourceAccess = require('../../AppUserRole/resourceAccess/AppUserRoleResourceAccess');

const { DEFAULT_LIMIT_DEVICES, DEFAULT_STAFF_PER_DEVICES, DEFAULT_MAX_VEHICLE_PER_DEVICES_PER_DAY } = require('../CustomerStatisticalConstants');
const { CUSTOMER_RECORD_DISPLAY_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { adminEmail } = require('../../SystemConfigurations/adminEmail');
const { STATION_STATUS } = require('../../Stations/StationsConstants');
const { sendReportDataEmail } = require('../../Email/EmailFunctions');
const Logger = require('../../../utils/logging');

async function sendReportData() {
  const MAX_COUNT = 500;
  const allStationList = await StationResourceAccess.find({}, 0, MAX_COUNT);
  if (!allStationList || allStationList.length <= 0) {
    return;
  }

  const activeStationList = allStationList.filter(station => station.stationStatus === STATION_STATUS.ACTIVE);

  const deployedStationList = allStationList.filter(station => {
    const bookingConfig = JSON.parse(station.stationBookingConfig || '{}');
    return bookingConfig.some(config => config.enableBooking);
  });

  const stationReportData = _reportStationData(allStationList.length, activeStationList.length, deployedStationList.length);
  const inspectionLineReportData = _reportInspectionLine(activeStationList, deployedStationList);
  const stationUserReportData = await _reportStationUser(inspectionLineReportData.inspectionLineExpect);
  const inspectionCapacity = _reportInspectionCapacity(
    inspectionLineReportData.inspectionLineExpect,
    inspectionLineReportData.inspectionLineActual,
    allStationList,
  );

  const totalParams = {
    today: moment().subtract(1, 'day').format('DD/MM/YYYY'),
    ...stationReportData,
    ...inspectionLineReportData,
    ...stationUserReportData,
    ...inspectionCapacity,
  };

  await _notifyActiveStatusToStation(adminEmail, totalParams);
}

function _reportInspectionLine(activeStationList, deployedStationList) {
  const inspectionLineExpect = activeStationList.reduce((acc, station) => acc + station.totalInspectionLine, 0);
  const inspectionLineActual = deployedStationList.reduce((acc, station) => acc + station.totalInspectionLine, 0);

  return {
    inspectionLineExpect: inspectionLineExpect,
    inspectionLineActual: inspectionLineActual,
  };
}

async function _reportStationUser(inspectionLineExpect) {
  const ADMIN_ROLE_ID = 1;
  const MAX_COUNT = 20;
  const roles = await AppUserRoleResourceAccess.find({}, 0, MAX_COUNT);
  let stationUserCount = 0;
  if (roles && roles.length > 0) {
    // remove admin of station
    const stationUserRoles = roles.filter(role => role.appUserRoleId !== ADMIN_ROLE_ID).map(role => role.appUserRoleId);

    const filter = { appUserRoleId: stationUserRoles || [] };
    stationUserCount = await RoleUserView.customCount(filter);
  }

  return {
    stationUserExpect: inspectionLineExpect * DEFAULT_STAFF_PER_DEVICES,
    stationUserActual: stationUserCount || 0,
  };
}

function _reportInspectionCapacity(inspectionLineExpect, inspectionLineActual, allStationList) {
  const inspectionCarCount = allStationList.reduce((acc, station) => {
    const bookingConfig = JSON.parse(station.stationBookingConfig || {});
    const totalCarCount = bookingConfig.reduce((acc, configTime) => {
      return acc + configTime.enableBooking ? configTime.limitSmallCar : 0;
    }, 0);

    return acc + totalCarCount;
  }, 0);

  const inspectionOtherVehicleCount = allStationList.reduce((acc, station) => {
    const bookingConfig = JSON.parse(station.stationBookingConfig || {});
    const totalOtherVehicleCount = bookingConfig.reduce((acc, configTime) => {
      return acc + configTime.enableBooking ? configTime.limitOtherVehicle : 0;
    }, 0);

    return acc + totalOtherVehicleCount;
  }, 0);

  const inspectionRomoocVehicleCount = allStationList.reduce((acc, station) => {
    const bookingConfig = JSON.parse(station.stationBookingConfig || {});
    const totallRoMooc = bookingConfig.reduce((acc, configTime) => {
      return acc + configTime.enableBooking ? configTime.limitRoMooc : 0;
    }, 0);

    return acc + totallRoMooc;
  }, 0);

  return {
    inspectionExpect: inspectionLineExpect * DEFAULT_MAX_VEHICLE_PER_DEVICES_PER_DAY,
    inspectionActual: inspectionLineActual * DEFAULT_MAX_VEHICLE_PER_DEVICES_PER_DAY,
    inspectionOnline: {
      inspectionCarCount: inspectionCarCount,
      inspectionOtherVehicleCount: inspectionOtherVehicleCount + inspectionRomoocVehicleCount,
    },
  };
}

async function _notifyActiveStatusToStation(stationEmailStringList, bodyParams) {
  const subjectParams = { today: moment().format(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT) };

  const bossEmailList = stationEmailStringList.split(';');

  for (let bossMail of bossEmailList) {
    const sendMailResult = await sendReportDataEmail(bossMail, subjectParams, bodyParams);

    if (sendMailResult) {
      Logger.info(`SEND MAIL TO ${bossMail} SUCCESS !`);
    } else {
      Logger.error(`SEND MAIL TO ${bossMail} FAILURE !`);
    }
  }
}

function _reportStationData(totalStationCount, activeStationCount, deployedStationCount) {
  const stationData = {
    total: totalStationCount,
    activeStation: activeStationCount,
    deployedStation: deployedStationCount,
  };

  stationData.inactiveStation = stationData.total - stationData.activeStation;
  stationData.blockStation = stationData.total - stationData.deployedStation;

  return stationData;
}

sendReportData();

module.exports = {
  sendReportData,
};
