/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const AppUserVehicleExpired = require('./AppUserVehicleExpiredRoute');

module.exports = [
  { method: 'POST', path: '/AppUserVehicleExpired/insert', config: AppUserVehicleExpired.insert },
  { method: 'POST', path: '/AppUserVehicleExpired/findById', config: AppUserVehicleExpired.findById },
  { method: 'POST', path: '/AppUserVehicleExpired/find', config: AppUserVehicleExpired.find },
  { method: 'POST', path: '/AppUserVehicleExpired/updateById', config: AppUserVehicleExpired.updateById },
  { method: 'POST', path: '/AppUserVehicleExpired/deleteById', config: AppUserVehicleExpired.deleteById },
];
