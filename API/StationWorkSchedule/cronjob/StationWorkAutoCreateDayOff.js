const moment = require('moment');
const Logger = require('../../../utils/logging');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const StationsWorkScheduleResourceAccess = require('../../StationWorkSchedule/resourceAccess/StationsWorkScheduleResourceAccess');
const StationsWorkScheduleFunctions = require('../StationWorkScheduleFunctions');
const { CUSTOMER_RECORD_DB_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { WORKING_STATUS } = require('../StationWorkScheduleConstants');
const { STATION_STATUS } = require('../../Stations/StationsConstants');

async function autoCreateDayOffForStation() {
  Logger.info('CREATING DAY OFF SCHEDULE FOR STATION');

  const sundayList = _getSundayList(40);

  for (sunday of sundayList) {
    const promiseList = await _splitToBunchOfPromises(sunday, 50);
    _executePromise(promiseList);
  }
}

async function _executePromise(promiseList) {
  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
}

function _findClosestSunDay() {
  const SUNDAY_NUMBER = 0;

  let additionDay = 0;
  while (true) {
    const dayOfWeek = moment().add(additionDay, 'days');
    if (dayOfWeek.weekday() === SUNDAY_NUMBER) {
      return dayOfWeek.format('DD/MM/YYYY');
    }
    additionDay++;
  }
}

function _getSundayList(count = 40) {
  const sunday = _findClosestSunDay();
  const result = [sunday];
  count--;
  while (count--) {
    const nextSunDay = moment(result[result.length - 1], 'DD/MM/YYYY')
      .add(7, 'days')
      .format('DD/MM/YYYY');
    result.push(nextSunDay);
  }
  return result;
}

async function _splitToBunchOfPromises(sunday, limit = 10) {
  const result = [];

  let skip = 0;
  while (true) {
    const stationList = await StationResourceAccess.find({ stationStatus: STATION_STATUS.ACTIVE }, skip, limit);
    if (stationList && stationList.length > 0) {
      const promiseBunch = stationList.map(station => _createDayOffSchedule(station, sunday));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _createDayOffSchedule(station, sunday) {
  const stationConfigs = JSON.parse(station.stationBookingConfig);
  if (!stationConfigs) return;

  const scheduleTime = stationConfigs.map(configTime => ({ time: configTime.time, isWorking: WORKING_STATUS.NOT_ACTIVE }));

  const dayOffData = {
    stationsId: station.stationsId,
    scheduleDayOff: sunday,
    scheduleTime: JSON.stringify(scheduleTime),
    scheduleDate: moment(sunday, CUSTOMER_RECORD_DB_DATE_FORMAT).toDate(),
  };

  await StationsWorkScheduleFunctions.addDayOffSchedule(dayOffData);
}

module.exports = {
  autoCreateDayOffForStation,
};
