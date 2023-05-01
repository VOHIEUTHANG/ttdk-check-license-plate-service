const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');

async function checkingUserVehicleExpireDate() {
  Logger.info('CHECKING APP USER VEHICLE EXPIRE DATE');
  const currentDate = moment().format('DD/MM/YYYY');
  const nextMonth = moment().add(1, 'month').format('DD/MM/YYYY');
  const next15Days = moment().add(15, 'days').format('DD/MM/YYYY');
  const next7Days = moment().add(7, 'days').format('DD/MM/YYYY');
  const next3Days = moment().add(3, 'days').format('DD/MM/YYYY');

  const EXPIRE_IN_ONE_MONTH_MESSAGE = 'chỉ còn 1 tháng là hết hạn đăng kiểm. Bạn có thể đặt lịch trước để được hỗ trợ tốt nhất';
  const EXPIRE_IN_FIFTEEN_DAYS_MESSAGE = 'chỉ còn 15 ngày là hết hạn đăng kiểm. Bạn có thể đặt lịch trước để được hỗ trợ tốt nhất';
  const EXPIRE_IN_SEVEN_DAYS_MESSAGE = 'chỉ còn 7 ngày là hết hạn đăng kiểm. Bạn có thể đặt lịch trước để được hỗ trợ tốt nhất';
  const EXPIRE_IN_THREE_DAYS_MESSAGE = 'chỉ còn 3 ngày là hết hạn đăng kiểm. Bạn có thể đặt lịch trước để được hỗ trợ tốt nhất';
  const OUT_OF_DATE_MESSAGE = 'đã quá hạn đăng kiểm. Bạn có thể đặt lịch trước để được hỗ trợ tốt nhất';

  const expireInOneMonthList = await _splitToBunchOfPromises(nextMonth, nextMonth, EXPIRE_IN_ONE_MONTH_MESSAGE);
  const expireInFifteenDaysList = await _splitToBunchOfPromises(next15Days, next15Days, EXPIRE_IN_FIFTEEN_DAYS_MESSAGE);
  const expireInSevenDaysList = await _splitToBunchOfPromises(next7Days, next7Days, EXPIRE_IN_SEVEN_DAYS_MESSAGE);
  const expireInThreeDaysList = await _splitToBunchOfPromises(next3Days, next3Days, EXPIRE_IN_THREE_DAYS_MESSAGE);
  const vehicleOutOfDateList = await _splitToBunchOfPromises(undefined, currentDate, OUT_OF_DATE_MESSAGE);

  await _handleNotifyExpireDate(expireInOneMonthList);
  await _handleNotifyExpireDate(expireInFifteenDaysList);
  await _handleNotifyExpireDate(expireInSevenDaysList);
  await _handleNotifyExpireDate(expireInThreeDaysList);
  await _handleNotifyExpireDate(vehicleOutOfDateList);
}

async function _handleNotifyExpireDate(promiseList) {
  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
}

async function _splitToBunchOfPromises(startDate, endDate, leftDaysMessage, limit = 10) {
  const result = [];

  let skip = 0;
  while (true) {
    const vehicleBunch = await AppUserVehicleResourceAccess.customSearch({}, skip, limit, startDate, endDate);
    if (vehicleBunch && vehicleBunch.length > 0) {
      const promiseBunch = vehicleBunch.map(vehicle => _notifyToCustomer(leftDaysMessage, vehicle));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _notifyToCustomer(leftDaysMessage, vehicle) {
  const title = 'Thông báo hạn đăng kiểm xe';
  const message = `Phương tiện BSX ${vehicle.vehicleIdentity} ${leftDaysMessage}`;
  await CustomerMessageFunctions.addMessageCustomer(title, undefined, message, vehicle.vehicleIdentity, vehicle.appUserId, vehicle.appUserVehicleId);
}

module.exports = {
  checkingUserVehicleExpireDate,
};
