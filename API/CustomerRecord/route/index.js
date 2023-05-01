/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const CustomerRecord = require('./CustomerRecordRoute');

module.exports = [
  //Customer Record APIs
  { method: 'POST', path: '/CustomerRecord/insert', config: CustomerRecord.insert },
  { method: 'POST', path: '/CustomerRecord/advanceUser/insert', config: CustomerRecord.advanceUserInsert },
  { method: 'POST', path: '/CustomerRecord/find', config: CustomerRecord.find },
  { method: 'POST', path: '/CustomerRecord/getList', config: CustomerRecord.userGetList },
  { method: 'POST', path: '/CustomerRecord/advanceUser/getList', config: CustomerRecord.advanceUserUserGetList },
  { method: 'POST', path: '/CustomerRecord/todayCustomerRecord', config: CustomerRecord.findToday },
  { method: 'POST', path: '/CustomerRecord/advanceUser/todayCustomerRecord', config: CustomerRecord.advanceUserFindToday },
  { method: 'POST', path: '/CustomerRecord/getDetailById', config: CustomerRecord.findById },
  { method: 'POST', path: '/CustomerRecord/updateById', config: CustomerRecord.updateById },
  { method: 'POST', path: '/CustomerRecord/advanceUser/updateById', config: CustomerRecord.advanceUserUpdateById },
  { method: 'POST', path: '/CustomerRecord/advanceUser/deleteById', config: CustomerRecord.advanceUserDeleteById },
  { method: 'POST', path: '/CustomerRecord/deleteById', config: CustomerRecord.deleteById },
  { method: 'POST', path: '/CustomerRecord/exportExcel', config: CustomerRecord.exportExcelCustomerRecord },
  { method: 'POST', path: '/CustomerRecord/advanceUser/exportExcel', config: CustomerRecord.advanceUserExportExcelCustomerRecord },
  { method: 'POST', path: '/CustomerRecord/importExcel', config: CustomerRecord.importCustomerRecord },
  { method: 'POST', path: '/CustomerRecord/advanceUser/importExcel', config: CustomerRecord.advanceUserImportCustomerRecord },
  { method: 'POST', path: '/CustomerRecord/advanceUser/registerFromSchedule', config: CustomerRecord.registerFromSchedule },
  //BEWARE !! This API is use for robot
  { method: 'POST', path: '/CustomerRecord/robotInsert', config: CustomerRecord.robotInsert },
];
