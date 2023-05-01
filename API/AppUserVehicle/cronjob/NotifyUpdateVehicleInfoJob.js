const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserVehicleResourceAccess = require('../resourceAccess/AppUserVehicleResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');

async function createNotifyUpdateVehicleInfo() {
  // only notify on sunday
  const SUNDAY_NUMBER = 0;
  if (moment().weekday() === SUNDAY_NUMBER) {
    Logger.info('CHECKING UPDATE APP USER VEHICLE');
    const notUpdatedVehiclePromiseList = await _splitToBunchOfPromises();

    for (promiseBunch of notUpdatedVehiclePromiseList) {
      await Promise.all(promiseBunch);
    }
    Logger.info('CHECKING UPDATE APP USER VEHICLE DONE');
  }
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const scheduleBunch = await CustomerScheduleResourceAccess.customSearch({ CustomerScheduleStatus: SCHEDULE_STATUS.CLOSED }, skip, limit);
    if (scheduleBunch && scheduleBunch.length > 0) {
      const promiseBunch = scheduleBunch.map(schedule => _notifyToCustomer(schedule));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _notifyToCustomer(schedule) {
  const appUserVehicle = await AppUserVehicleResourceAccess.find({ vehicleIdentity: schedule.licensePlates }, 0, 1);
  if (appUserVehicle && appUserVehicle.length > 0) {
    const vehicle = appUserVehicle[0];
    const infoNeedUpdate = [
      vehicle.vehicleExpiryDate,
      vehicle.vehicleBrandName,
      vehicle.vehicleRegistrationCode,
      vehicle.vehicleRegistrationImageUrl,
      vehicle.vehicleBrandModel,
    ];
    const isUpdateVehicleInfo = infoNeedUpdate.every(info => !!info);

    if (!isUpdateVehicleInfo) {
      const title = 'Thông báo cập nhật thông tin phương tiện đăng kiểm';
      const message = `Thông tin phương tiện BSX ${vehicle.vehicleIdentity} chưa được cập nhật. Quý khách vui lòng cập nhật đầy đủ số tem GCN mới nhất, hình ảnh GCN, ngày hết hạn, số loại, nhãn hiệu để được hỗ trợ nhắc lịch tự động trong các lần đăng kiểm tiếp theo.`;
      await CustomerMessageFunctions.addMessageCustomer(
        title,
        undefined,
        message,
        vehicle.vehicleIdentity,
        vehicle.appUserId,
        undefined,
        vehicle.appUserVehicleId,
      );
    }
  }
}

createNotifyUpdateVehicleInfo();

module.exports = {
  createNotifyUpdateVehicleInfo,
};
