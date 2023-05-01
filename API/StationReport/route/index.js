const StationReport = require('./StationReportRoute');
const StationReportRoute_AdvanceUser = require('./StationReportRoute_AdvanceUser');

module.exports = [
  // { method: 'POST', path: '/StationReport/insert', config: StationReport.insert },
  { method: 'POST', path: '/StationReport/find', config: StationReport.find },
  // { method: 'POST', path: '/StationReport/findById', config: StationReport.findById },
  // { method: 'POST', path: '/StationReport/updateById', config: StationReport.updateById },
  // { method: 'POST', path: '/StationReport/deleteById', config: StationReport.deleteById },

  //API danh cho nhan vien tram
  { method: 'POST', path: '/StationReport/advanceUser/submitTodayReport', config: StationReportRoute_AdvanceUser.advanceUserSubmitTodayReport },
  { method: 'POST', path: '/StationReport/advanceUser/getTodayReport', config: StationReportRoute_AdvanceUser.advanceUserGetTodayReport },
  { method: 'POST', path: '/StationReport/advanceUser/getStationReport', config: StationReportRoute_AdvanceUser.advanceUserGetStationReport },
];
