/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Joi = require('joi');
const moment = require('moment');
const { addMessageCustomer } = require('../../CustomerMessage/CustomerMessageFunctions');
const { STATION_STATUS } = require('../../Stations/StationsConstants');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const { cancelUserSchedule, generateMessageToCancelSchedule } = require('../CustomerScheduleFunctions');

const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerScheduleView = require('../resourceAccess/CustomerScheduleView');

async function complateAllOldScheduleByDate(selectedDay) {
  console.info(`complateAllOldScheduleByDate ${selectedDay}`);
  //Hủy tất cả lịch chưa xác nhận ngày hôm đó
  while (true) {
    let _filter = {
      CustomerScheduleStatus: [SCHEDULE_STATUS.NEW],
    };
    if (selectedDay) {
      _filter.dateSchedule = selectedDay;
    } else {
      break;
    }
    let _listSchedule = await CustomerScheduleView.find(_filter, 0, 100);
    if (_listSchedule && _listSchedule.length > 0) {
      console.info(`_listSchedule SCHEDULE_STATUS.NEW: ${_listSchedule.length}`);
      for (let i = 0; i < _listSchedule.length; i++) {
        const _schedule = _listSchedule[i];
        await CustomerScheduleResourceAccess.updateById(_schedule.customerScheduleId, {
          CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
        });
        await cancelUserSchedule(_schedule.appUserId, _schedule.customerScheduleId);

        const reason = 'trung tâm chưa xác nhận lịch hẹn';
        const notifyContent = generateMessageToCancelSchedule(_schedule.stationCode, _schedule.licensePlates, reason, _schedule.stationsHotline);
        const notifyTitle = `Lịch hẹn BSX ${_schedule.licensePlates} bị hủy`;
        await addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, _schedule.appUserId);
      }
    } else {
      break;
    }
  }

  //Đóng tất cả lịch đã xác nhận ngày hôm đó
  while (true) {
    let _filter = {
      CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED],
    };
    if (selectedDay) {
      _filter.dateSchedule = selectedDay;
    } else {
      break;
    }

    let _listSchedule = await CustomerScheduleView.customSearch(_filter, 0, 100);
    if (_listSchedule && _listSchedule.length > 0) {
      console.info(`_listSchedule SCHEDULE_STATUS.CONFIRMED: ${_listSchedule.length}`);
      for (let i = 0; i < _listSchedule.length; i++) {
        const _schedule = _listSchedule[i];
        await CustomerScheduleResourceAccess.updateById(_schedule.customerScheduleId, {
          CustomerScheduleStatus: SCHEDULE_STATUS.CLOSED,
        });
      }
    } else {
      break;
    }
  }

  console.info(`complateAllOldScheduleByDate ${selectedDay} Completed ${new Date()}`);
}

async function cancelAllOldScheduleByStationBlocked() {
  console.info(`cancelAllOldScheduleByStationBlocked`);

  //Hủy tất cả lịch hẹn nếu trung tâm bị đóng cửa
  while (true) {
    let _filter = {
      CustomerScheduleStatus: [SCHEDULE_STATUS.CONFIRMED, SCHEDULE_STATUS.NEW],
      stationStatus: STATION_STATUS.BLOCK,
    };

    let _listSchedule = await CustomerScheduleView.customSearch(_filter, 0, 100);
    if (_listSchedule && _listSchedule.length > 0) {
      console.info(`_listSchedule STATION_STATUS.BLOCK: ${_listSchedule.length}`);
      for (let i = 0; i < _listSchedule.length; i++) {
        const _schedule = _listSchedule[i];
        await cancelUserSchedule(_schedule.appUserId, _schedule.customerScheduleId);

        const reason = `TTDK ${_schedule.stationCode} bị đóng cửa`;
        const notifyContent = generateMessageToCancelSchedule(_schedule.stationCode, _schedule.licensePlates, reason, _schedule.stationsHotline);
        const notifyTitle = `Lịch hẹn BSX ${_schedule.licensePlates} bị hủy`;
        await addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, _schedule.appUserId);
      }
    } else {
      break;
    }
  }

  console.info(`cancelAllOldScheduleByStationBlocked Completed ${new Date()}`);
}

//DANGER !!! chi duoc mo ra khi thuc su can thiet
// async function cancelAllErrorSchedule(filter) {
//   console.info(`cancelAllErrorSchedule`);

//   let counterDate = 1;
//   //Hủy tất cả lịch hẹn nếu trung tâm bị đóng cửa
//   while (true) {
//     let _filter = {
//       ...filter,
//       dateSchedule: moment().add(counterDate, 'day').format('DD/MM/YYYY'),
//     };

//     let _listSchedule = await CustomerScheduleView.customSearch(_filter, 0, 100);
//     if (_listSchedule && _listSchedule.length > 0) {
//       console.info(`_listSchedule error: ${_listSchedule.length}`);
//       for (let i = 0; i < _listSchedule.length; i++) {
//         const _schedule = _listSchedule[i];
//         await cancelUserSchedule(_schedule.appUserId, _schedule.customerScheduleId);

//         const reason = `hệ thống bị lỗi`;
//         const notifyContent = generateMessageToCancelSchedule(_schedule.stationCode, _schedule.licensePlates, reason, _schedule.stationsHotline);
//         const notifyTitle = `Lịch hẹn BSX ${_schedule.licensePlates} bị hủy`;
//         await addMessageCustomer(notifyTitle, undefined, notifyContent, undefined, _schedule.appUserId);
//       }
//     }

//     counterDate++;
//     if (counterDate === 120) {
//       break;
//     }
//   }

//   console.info(`cancelAllErrorSchedule Completed ${new Date()}`);
// }

async function completeAllOldSchedule() {
  console.log(`completeAllOldSchedule ${new Date()}`);
  let _old1Day = moment().add(-1, 'day').format('DD/MM/YYYY');
  let _old2Day = moment().add(-2, 'day').format('DD/MM/YYYY');
  let _old3Day = moment().add(-3, 'day').format('DD/MM/YYYY');

  let _promises = [];
  _promises.push(complateAllOldScheduleByDate(_old1Day));
  _promises.push(complateAllOldScheduleByDate(_old2Day));
  _promises.push(complateAllOldScheduleByDate(_old3Day));
  // _promises.push(cancelAllOldScheduleByStationBlocked());
  await Promise.all(_promises);
}

completeAllOldSchedule();

module.exports = {
  completeAllOldSchedule,
};
