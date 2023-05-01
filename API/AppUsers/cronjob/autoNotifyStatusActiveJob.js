const moment = require('moment');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const FirebaseFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const EmailClient = require('../../../ThirdParty/Email/EmailClient');

const { getStationUserList } = require('../AppUsersFunctions');
const { STATION_STATUS } = require('../../Stations/StationsConstants');
const Logger = require('../../../utils/logging');

async function autoNotifyStatusActiveJob() {
  Logger.info('SENDING ACTIVE STATUS TO STATION AND STATION USER');
  const MAX_STATION_COUNT = 500;
  const stationsList = await StationResourceAccess.find({ stationStatus: STATION_STATUS.ACTIVE }, 0, MAX_STATION_COUNT);

  if (stationsList && stationsList.length > 0) {
    for (let station of stationsList) {
      await _notifyActiveStatusToStationUser(station.stationsId, station.stationCode, station.stationsEmail);
    }
  }
}

async function _notifyActiveStatusToStationUser(stationsId, stationCode, stationEmail) {
  const MAX_COUNT = 500;
  const stationUsers = await getStationUserList({ stationsId: stationsId }, 0, MAX_COUNT);
  let notifyContent = '';

  if (stationUsers && stationUsers.length > 0) {
    const activeTimeList = stationUsers.map(user => user.lastActiveAt).filter(time => time);

    if (activeTimeList.length > 0) {
      const notActiveInOneDay = !_checkActiveStatus(activeTimeList, 1);
      const notActiveInTwoDay = !_checkActiveStatus(activeTimeList, 2);
      const notActiveInThreeDay = !_checkActiveStatus(activeTimeList, 3);

      if (notActiveInThreeDay) {
        notifyContent = `Trung tâm ${stationCode} đã bị ngừng kết nối do không hoạt động trong thời gian dài. Vui lòng đăng nhập để tiếp tục kết nối hệ thống`;
      } else if (notActiveInTwoDay) {
        notifyContent = `Trung tâm ${stationCode} sẽ bị ngừng kết nối trong 1 ngày do không hoạt động trong thời gian dài. Vui lòng đăng nhập để tiếp tục kết nối hệ thống`;
      } else if (notActiveInOneDay) {
        notifyContent = `Trung tâm ${stationCode} sẽ bị ngừng kết nối trong 2 ngày do không hoạt động trong thời gian dài. Vui lòng đăng nhập để tiếp tục kết nối hệ thống`;
      }
    } else {
      notifyContent = `Trung tâm ${stationCode} đã bị ngừng kết nối do không hoạt động trong thời gian dài. Vui lòng đăng nhập để tiếp tục kết nối hệ thống`;
    }

    // create notification
    if (notifyContent) {
      // notify to station user
      const promiseList = stationUsers.map(appUser => {
        new Promise(async (resolve, reject) => {
          const notifyTitle = 'Cảnh báo hoạt động !';
          await CustomerMessageFunctions.addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, appUser.appUserId);
          if (appUser.firebaseToken) {
            FirebaseFunctions.pushNotificationByTokens(appUser.firebaseToken, notifyTitle, notifyContent);
          }
          resolve('ok');
        });
      });

      await Promise.all(promiseList);

      // notify to station
      if (stationEmail) {
        await _notifyActiveStatusToStation(stationEmail, notifyContent);
      }
    }
  }
}

function _checkActiveStatus(activeTimeList, dayCounter) {
  const dateCheckList = [];
  for (let i = 0; i <= dayCounter; i++) {
    dateCheckList.push(moment().subtract(i, 'days').format('DD/MM/YYYY'));
  }

  const isActive = activeTimeList.some(lastActiveAt => {
    const activeDate = moment(lastActiveAt).format('DD/MM/YYYY');
    return dateCheckList.includes(activeDate);
  });

  return isActive;
}

async function _notifyActiveStatusToStation(stationEmail, notifyContent) {
  const subject = 'Cảnh báo hoạt động !';
  const sendMailResult = await EmailClient.sendEmail(stationEmail, subject, notifyContent);
  if (sendMailResult) {
    Logger.info('SEND MAIL TO STATION ' + sendMailResult);
  } else {
    Logger.error('SEND MAIL TO STATION ERROR !');
  }
}

autoNotifyStatusActiveJob();

module.exports = {
  autoNotifyStatusActiveJob,
};
