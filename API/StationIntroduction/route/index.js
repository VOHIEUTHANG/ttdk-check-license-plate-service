const StationIntroduction = require('./StationIntroductionRoute');

module.exports = [
  { method: 'POST', path: '/StationIntroduction/updateStationIntro', config: StationIntroduction.updateById },
  { method: 'POST', path: '/StationIntroduction/findById', config: StationIntroduction.findById },
  { method: 'POST', path: '/StationIntroduction/stationIntroductionDetail', config: StationIntroduction.stationIntroductionDetail },

  { method: 'POST', path: '/StationIntroduction/advanceUser/getDetail', config: StationIntroduction.advanceUserGetDetail },
  { method: 'POST', path: '/StationIntroduction/advanceUser/updateStationIntro', config: StationIntroduction.advanceUserUpdateStationIntro },
  {
    method: 'POST',
    path: '/StationIntroduction/advanceUser/stationIntroductionDetail',
    config: StationIntroduction.advanceUserStationIntroductionDetail,
  },
];
