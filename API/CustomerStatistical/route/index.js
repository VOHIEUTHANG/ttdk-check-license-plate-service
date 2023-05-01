const CustomerStatistical = require('./CustomerStatisticalRoute');

module.exports = [
  { method: 'POST', path: '/CustomerStatistical/report', config: CustomerStatistical.reportCustomer },
  { method: 'POST', path: '/CustomerStatistical/advanceUser/report', config: CustomerStatistical.advanceUserReportCustomer },
  { method: 'POST', path: '/CustomerStatistical/reportAllStation', config: CustomerStatistical.reportAllStation },
];
