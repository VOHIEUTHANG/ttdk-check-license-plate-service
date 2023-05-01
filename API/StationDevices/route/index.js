/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const StationDevices = require('./StationDevicesRoute');

module.exports = [
  { method: 'POST', path: '/StationDevices/insert', config: StationDevices.insert },
  { method: 'POST', path: '/StationDevices/findById', config: StationDevices.findById },
  { method: 'POST', path: '/StationDevices/find', config: StationDevices.find },
  { method: 'POST', path: '/StationDevices/updateById', config: StationDevices.updateById },
  { method: 'POST', path: '/StationDevices/deleteById', config: StationDevices.deleteById },
];
