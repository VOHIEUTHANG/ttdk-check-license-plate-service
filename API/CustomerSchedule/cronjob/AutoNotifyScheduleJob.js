/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const Logger = require('../../../utils/logging');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');

async function createNotifyForCustomer() {
  const scheduleDateInOneWeek = moment().add(1, 'week').format('DD/MM/YYYY');
  const scheduleDateInThreeDays = moment().add(3, 'days').format('DD/MM/YYYY');
  const scheduleDateInOneDay = moment().add(1, 'day').format('DD/MM/YYYY');

  const successScheduleStatus = [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED];

  const scheduleDateInOneWeekList =
    (await CustomerScheduleResourceAccess.customSearch({ dateSchedule: scheduleDateInOneWeek, CustomerScheduleStatus: successScheduleStatus })) || [];
  const scheduleDateInThreeDaysList =
    (await CustomerScheduleResourceAccess.customSearch({ dateSchedule: scheduleDateInThreeDays, CustomerScheduleStatus: successScheduleStatus })) ||
    [];
  const scheduleDateInOneDayList =
    (await CustomerScheduleResourceAccess.customSearch({ dateSchedule: scheduleDateInOneDay, CustomerScheduleStatus: successScheduleStatus })) || [];

  const notificationInOneWeekPromiseList = scheduleDateInOneWeekList.map(async scheduleData => {
    const stationData = await StationResourceAccess.findById(scheduleData.stationsId);
    if (stationData) {
      const scheduleTime = CustomerScheduleFunctions.modifyScheduleTime(scheduleData.time);
      let message = `TTDK ${stationData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} vào ngày ${scheduleDateInOneWeek} (1 tuần nữa). Vui lòng đến trước ${scheduleTime} ngày ${scheduleData.dateSchedule} để được phục vụ.`;

      return CustomerMessageFunctions.createNewUserMessageByStation(
        undefined,
        stationData.stationsId,
        message,
        scheduleData.licensePlates,
        scheduleData.appUserId,
        scheduleData.customerScheduleId,
      );
    }
  });

  const notificationInThreeDaysPromiseList = scheduleDateInThreeDaysList.map(async scheduleData => {
    const stationData = await StationResourceAccess.findById(scheduleData.stationsId);
    if (stationData) {
      const scheduleTime = CustomerScheduleFunctions.modifyScheduleTime(scheduleData.time);
      let message = `TTDK ${stationData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} vào ngày ${scheduleDateInThreeDays} (3 ngày nữa). Vui lòng đến trước ${scheduleTime} ngày ${scheduleData.dateSchedule} để được phục vụ.`;

      return CustomerMessageFunctions.createNewUserMessageByStation(
        undefined,
        stationData.stationsId,
        message,
        scheduleData.licensePlates,
        scheduleData.appUserId,
        scheduleData.customerScheduleId,
      );
    }
  });

  const notificationInOneDayPromiseList = scheduleDateInOneDayList.map(async scheduleData => {
    const stationData = await StationResourceAccess.findById(scheduleData.stationsId);
    if (stationData) {
      const scheduleTime = CustomerScheduleFunctions.modifyScheduleTime(scheduleData.time);
      let message = `TTDK ${stationData.stationCode} thông báo: lịch hẹn đăng kiểm cho BSX ${scheduleData.licensePlates} vào ngày ${scheduleDateInOneDay} (ngày mai). Vui lòng đến trước ${scheduleTime} ngày ${scheduleData.dateSchedule} để được phục vụ.`;

      return CustomerMessageFunctions.createNewUserMessageByStation(
        undefined,
        stationData.stationsId,
        message,
        scheduleData.licensePlates,
        scheduleData.appUserId,
        scheduleData.customerScheduleId,
      );
    }
  });

  await Promise.all([...notificationInOneWeekPromiseList, ...notificationInThreeDaysPromiseList, ...notificationInOneDayPromiseList]);
  Logger.info(`AUTO NOTIFY USER BOOKING SCHEDULE DONE !`);
}

createNotifyForCustomer();

module.exports = {
  createNotifyForCustomer,
};
