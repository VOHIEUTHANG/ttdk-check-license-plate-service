const SystemAppLogChangeSchedule = require('./SystemAppLogChangeScheduleRoute');

module.exports = [
  { method: 'POST', path: '/SystemAppLogChangeSchedule/find', config: SystemAppLogChangeSchedule.find },
  { method: 'POST', path: '/SystemAppLogChangeSchedule/advanceUser/find', config: SystemAppLogChangeSchedule.advanceUserGetList },
];
