const { addMessageCustomer } = require('../../CustomerMessage/CustomerMessageFunctions');
const { cancelUserSchedule } = require('../CustomerScheduleFunctions');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_CATEGORY } = require('../../AppUsers/AppUsersConstant');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');

async function cancelSpamScheduleByPhone(phoneNumber) {
  let _spamUser = await AppUsersResourceAccess.find({ username: phoneNumber });
  if (_spamUser && _spamUser.length > 0) {
    _spamUser = _spamUser[0];
  } else {
    return;
  }

  if (_spamUser.appUserCategory === APP_USER_CATEGORY.COMPANY_ACCOUNT) {
    return;
  }

  let _listSpamScheduleByPhone = await CustomerScheduleResourceAccess.customSearch({
    phone: phoneNumber,
    CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW],
  });
  console.log(`${phoneNumber} _listSpamScheduleByPhone: ${_listSpamScheduleByPhone.length}`);
  if (_listSpamScheduleByPhone.length <= 5) {
    return;
  }

  for (let i = 5; i < _listSpamScheduleByPhone.length; i++) {
    const _schedule = _listSpamScheduleByPhone[i];
    await cancelUserSchedule(_schedule.appUserId, _schedule.customerScheduleId);
    const notifyContent = `Lịch hẹn BSX ${_schedule.licensePlates} bị hủy do số điện thoại ${_schedule.phone} có số lịch hẹn vượt quá giới hạn`;
    const notifyTitle = `Lịch hẹn BSX ${_schedule.licensePlates} bị hủy`;
    await addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, _schedule.appUserId);
  }
}
//we will cancel all spam schedule and lock the account
// async function cancelAllSpamSchedule() {
//   let _listSpamSchedule = await CustomerScheduleResourceAccess.findAllPhoneHasManySchedule();
//   for (let i = 0; i < _listSpamSchedule.length; i++) {
//     const _spamSchedule = _listSpamSchedule[i];
//     await cancelSpamScheduleByPhone(_spamSchedule.phone);
//   }
// }
// cancelAllSpamSchedule();
