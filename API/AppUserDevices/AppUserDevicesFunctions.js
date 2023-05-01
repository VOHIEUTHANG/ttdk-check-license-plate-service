// const DeviceDetector = require('node-device-detector');
const AppUserDevicesResourceAccess = require('../AppUserDevices/resourceAccess/AppUserDevicesResourceAccess');

function _detectUserDevice(appUserId, userAgent) {
  const detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
  });

  return detector.detect(userAgent);
}

async function saveUserDevice(appUserId, userAgent) {
  if (!appUserId) return;
  const requestInfo = _detectUserDevice(appUserId, userAgent);
  const userDevice = requestInfo.device || {};
  const userOS = requestInfo.os || {};

  const data = {
    appUserId: appUserId,
    deviceName: userOS.name || '',
    deviceType: userDevice.type || '',
    deviceBrand: userDevice.brand || '',
    deviceModel: userDevice.model || '',
    deviceCode: userDevice.code || '',
  };

  await AppUserDevicesResourceAccess.insert(data);
}

module.exports = {
  saveUserDevice,
};
