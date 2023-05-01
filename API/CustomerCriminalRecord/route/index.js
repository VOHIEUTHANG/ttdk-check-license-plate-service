const CustomerCriminalRecord = require('./CustomerCriminalRecordRoute');

module.exports = [
  { method: 'POST', path: '/CustomerCriminalRecord/insert', config: CustomerCriminalRecord.insert },
  { method: 'POST', path: '/CustomerCriminalRecord/find', config: CustomerCriminalRecord.find },
  { method: 'POST', path: '/CustomerCriminalRecord/findById', config: CustomerCriminalRecord.findById },
  { method: 'POST', path: '/CustomerCriminalRecord/updateById', config: CustomerCriminalRecord.updateById },
  { method: 'POST', path: '/CustomerCriminalRecord/deleteById', config: CustomerCriminalRecord.deleteById },
  { method: 'POST', path: '/CustomerCriminalRecord/fetchNewRecords', config: CustomerCriminalRecord.fetchNewRecords },
  { method: 'POST', path: '/CustomerCriminalRecord/advanceUser/fetchNewRecords', config: CustomerCriminalRecord.advanceUserFetchNewRecords },
  { method: 'POST', path: '/CustomerCriminalRecord/user/fetchCrimeRecords', config: CustomerCriminalRecord.fetchCrimeRecords },
];
