const CustomerSchedule = require('./CustomerScheduleRoute');

module.exports = [
  { method: 'POST', path: '/CustomerSchedule/add', config: CustomerSchedule.insert },
  { method: 'POST', path: '/CustomerSchedule/update', config: CustomerSchedule.updateById },
  { method: 'POST', path: '/CustomerSchedule/findId', config: CustomerSchedule.findById },
  { method: 'POST', path: '/CustomerSchedule/list', config: CustomerSchedule.getList },
  { method: 'POST', path: '/CustomerSchedule/find', config: CustomerSchedule.find },
  { method: 'POST', path: '/CustomerSchedule/delete', config: CustomerSchedule.deleteById },
  { method: 'POST', path: '/CustomerSchedule/exportExcel', config: CustomerSchedule.exportExcelCustomerSchedule },
  { method: 'POST', path: '/CustomerSchedule/reportTotalByDay', config: CustomerSchedule.reportTotalByDay },
  { method: 'POST', path: '/CustomerSchedule/reportTotalScheduleByStation', config: CustomerSchedule.reportTotalScheduleByStation },
  { method: 'POST', path: '/CustomerSchedule/reportTotalScheduleByStationArea', config: CustomerSchedule.reportTotalScheduleByStationArea },

  { method: 'POST', path: '/CustomerSchedule/user/createSchedule', config: CustomerSchedule.userCreateSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/getListSchedule', config: CustomerSchedule.userGetListSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/cancelSchedule', config: CustomerSchedule.userCancelSchedule },
  { method: 'POST', path: '/CustomerSchedule/user/getDetailSchedule', config: CustomerSchedule.userGetDetailSchedule },

  { method: 'POST', path: '/CustomerSchedule/advanceUser/update', config: CustomerSchedule.advanceUserUpdateById },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/list', config: CustomerSchedule.advanceUserGetListSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/cancelSchedule', config: CustomerSchedule.advanceUserCancelSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/exportExcel', config: CustomerSchedule.advanceUserExportSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/insertSchedule', config: CustomerSchedule.advanceUserInsertSchedule },
  { method: 'POST', path: '/CustomerSchedule/advanceUser/searchSchedule', config: CustomerSchedule.advanceUserSearchSchedule },
];
