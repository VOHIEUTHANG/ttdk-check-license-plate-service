/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const StaffNotification = require('./StaffNotificationRoute');

module.exports = [
  { method: 'POST', path: '/StaffNotification/insert', config: StaffNotification.insert },
  { method: 'POST', path: '/StaffNotification/findById', config: StaffNotification.findById },
  { method: 'POST', path: '/StaffNotification/find', config: StaffNotification.find },
  { method: 'POST', path: '/StaffNotification/updateById', config: StaffNotification.updateById },
  { method: 'POST', path: '/StaffNotification/deleteById', config: StaffNotification.deleteById },
];
