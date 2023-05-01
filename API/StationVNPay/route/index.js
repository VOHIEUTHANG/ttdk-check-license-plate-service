const StationVNPay = require('./StationVNPayRoute');

module.exports = [
  { method: 'POST', path: '/StationVNPay/user/insertOrUpdate', config: StationVNPay.userInsertOrUpdate },
  { method: 'POST', path: '/StationVNPay/insertOrUpdate', config: StationVNPay.insertOrUpdate },
  { method: 'POST', path: '/StationVNPay/getDetailByStationId', config: StationVNPay.getDetailByStationId },
];
