/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const AppUserWorkInfo = require('./AppUserWorkInfoRoute');

module.exports = [
  // { method: 'POST', path: '/AppUserWorkInfo/insert', config: AppUserWorkInfo.insert },
  { method: 'POST', path: '/AppUserWorkInfo/findById', config: AppUserWorkInfo.findById },
  // { method: 'POST', path: '/AppUserWorkInfo/find', config: AppUserWorkInfo.find },
  { method: 'POST', path: '/AppUserWorkInfo/updateById', config: AppUserWorkInfo.updateById },
  // { method: 'POST', path: '/AppUserWorkInfo/deleteById', config: AppUserWorkInfo.deleteById }
];
