/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const Stations = require('./StationsRoute');

module.exports = [
  //Station Record APIs
  { method: 'POST', path: '/Stations/insert', config: Stations.insert },
  { method: 'POST', path: '/Stations/find', config: Stations.find },
  { method: 'POST', path: '/Stations/findById', config: Stations.findById },
  { method: 'POST', path: '/Stations/getDetailByUrl', config: Stations.findByUrl },
  { method: 'POST', path: '/Stations/user/getDetailByStationCode', config: Stations.findByStationCode },

  { method: 'POST', path: '/Stations/updateById', config: Stations.updateById },
  { method: 'POST', path: '/Stations/resetAllDefaultMp3', config: Stations.resetAllDefaultMp3 },
  { method: 'POST', path: '/Stations/reportAllInactiveStation', config: Stations.reportAllInactiveStation },
  { method: 'POST', path: '/Stations/reportAllActiveStation', config: Stations.reportAllActiveStation },
  { method: 'POST', path: '/Stations/updateConfigSMTP', config: Stations.updateConfigSMTP },
  { method: 'POST', path: '/Stations/updateConfigSMS', config: Stations.updateConfigSMS },
  { method: 'POST', path: '/Stations/updateConfigZNS', config: Stations.updateConfigZNS },
  { method: 'POST', path: '/Stations/updateCustomSMTP', config: Stations.updateCustomSMTP },
  { method: 'POST', path: '/Stations/updateCustomSMSBrand', config: Stations.updateCustomSMSBrand },
  { method: 'POST', path: '/Stations/enableAdsForStation', config: Stations.enableAdsForStation },
  { method: 'POST', path: '/Stations/updateLeftAdBanner', config: Stations.updateLeftAdBanner },
  { method: 'POST', path: '/Stations/updateRightAdBanner', config: Stations.updateRightAdBanner },
  { method: 'POST', path: '/Stations/exportExcel', config: Stations.exportStationExcel },
  { method: 'POST', path: '/Stations/user/getList', config: Stations.userGetListStation },
  { method: 'POST', path: '/Stations/user/getDetail', config: Stations.userGetDetailStation },
  { method: 'POST', path: '/Stations/user/getAllExternal', config: Stations.userGetAllExternalStation },
  { method: 'POST', path: '/Stations/getAllStationArea', config: Stations.getAllStationArea },
  { method: 'POST', path: '/Stations/user/getAllStationArea', config: Stations.userGetAllStationArea },
  { method: 'POST', path: '/Stations/user/getListScheduleDate', config: Stations.userGetListScheduleDate },
  { method: 'POST', path: '/Stations/user/getListScheduleTime', config: Stations.userGetListScheduleTime },

  { method: 'POST', path: '/Stations/advanceUser/getListScheduleDate', config: Stations.userGetListScheduleDate },
  { method: 'POST', path: '/Stations/advanceUser/getListScheduleTime', config: Stations.userGetListScheduleTime },
  { method: 'POST', path: '/Stations/advanceUser/updateById', config: Stations.advanceUserUpdateById },
  { method: 'POST', path: '/Stations/advanceUser/getDetailById', config: Stations.advanceUserFindById },
];
