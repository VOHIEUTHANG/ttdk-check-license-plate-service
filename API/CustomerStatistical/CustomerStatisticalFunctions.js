/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const CustomerRecordResourceAccess = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const MessageCustomerView = require('../CustomerMessage/resourceAccess/MessageCustomerView');
const CustomerScheduleResource = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { MESSAGE_CATEGORY, MESSAGE_STATUS, MESSAGE_PRICES } = require('../CustomerMessage/CustomerMessageConstant');

async function countRecordbyDate(filter, startDate, endDate) {
  return await CustomerRecordResourceAccess.customCount(filter, startDate, endDate, undefined, undefined);
}
async function countMessagebyDate(filter, startDate, endDate) {
  return await MessageCustomerView.customCount(filter, startDate, endDate, undefined, undefined);
}
async function countMessagebyDateDistinctStatus(filter, startDate, endDate) {
  return await MessageCustomerView.customCountDistinct(`messageSendStatus`, filter, startDate, endDate, undefined, undefined);
}

async function getReportTotalByStations(stationsId) {
  const totalCustomers = await countRecordbyDate({ customerStationId: stationsId });

  const totalEmails = await countMessagebyDate({
    customerStationId: stationsId,
    customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
    messageSendStatus: MESSAGE_STATUS.COMPLETED,
  });

  const totalSMS = await countMessagebyDate({
    customerStationId: stationsId,
    customerMessageCategories: MESSAGE_CATEGORY.SMS,
    messageSendStatus: MESSAGE_STATUS.COMPLETED,
  });

  const totalZNS = await countMessagebyDate({
    customerStationId: stationsId,
    customerMessageCategories: MESSAGE_CATEGORY.ZNS,
    messageSendStatus: MESSAGE_STATUS.COMPLETED,
  });

  const totalSchedules = await CustomerScheduleResource.count({
    stationsId,
  });

  const result = {
    totalCustomers,
    totalEmails,
    totalSMS: {
      message: totalSMS,
      cost: totalSMS * MESSAGE_PRICES.SMS,
    },
    totalZNS,
    totalSchedules,
  };

  return result;
}

module.exports = {
  countRecordbyDate,
  countMessagebyDate,
  countMessagebyDateDistinctStatus,
  getReportTotalByStations,
};
