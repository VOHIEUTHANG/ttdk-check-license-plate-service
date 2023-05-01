const AppDevices = require('./AppDevicesRoute');

module.exports = [
  { method: 'POST', path: '/AppDevices/insert', config: AppDevices.insert },
  { method: 'POST', path: '/AppDevices/findById', config: AppDevices.findById },
  { method: 'POST', path: '/AppDevices/find', config: AppDevices.find },
  { method: 'POST', path: '/AppDevices/updateById', config: AppDevices.updateById },
  { method: 'POST', path: '/AppDevices/deleteById', config: AppDevices.deleteById },
  { method: 'POST', path: '/AppDevices/user/getList', config: AppDevices.userGetListDevice },
  { method: 'POST', path: '/AppDevices/user/registerDevice', config: AppDevices.userRegisterDevice },
];
