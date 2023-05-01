const StationWorkSchedule = require('./StationWorkScheduleRoute');

module.exports = [
  { method: 'POST', path: '/StationWorkSchedule/insert', config: StationWorkSchedule.insert },
  { method: 'POST', path: '/StationWorkSchedule/find', config: StationWorkSchedule.find },
  { method: 'POST', path: '/StationWorkSchedule/findById', config: StationWorkSchedule.findById },
  { method: 'POST', path: '/StationWorkSchedule/updateById', config: StationWorkSchedule.updateById },
  { method: 'POST', path: '/StationWorkSchedule/deleteById', config: StationWorkSchedule.deleteById },
  { method: 'POST', path: '/StationWorkSchedule/advanceUser/addDayOff', config: StationWorkSchedule.advanceUserAddDayOff },
  { method: 'POST', path: '/StationWorkSchedule/advanceUser/getListDayOff', config: StationWorkSchedule.advanceUserGetListDayOff },
  { method: 'POST', path: '/StationWorkSchedule/advanceUser/updateDayOff', config: StationWorkSchedule.advanceUserUpdateDayOff },
];
