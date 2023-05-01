/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const CustomerStatisticalFunction = require('../CustomerStatisticalFunctions');
const StationResource = require('../../Stations/resourceAccess/StationsResourceAccess');
const AppUserResource = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const CustomerScheduleResource = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const AppUserVehicleResource = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const CustomerRecordResource = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const AppUsersFunctions = require('../../AppUsers/AppUsersFunctions');
const formatDate = require('../../ApiUtils/utilFunctions');
const { STATION_STATUS, AVAILABLE_STATUS } = require('../../Stations/StationsConstants');
const { ACCOUNT_STATUS } = require('../../AppUsers/AppUsersConstant');
const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const { STATISTICAL_ERROR } = require('../CustomerStatisticalConstants');

const moment = require('moment');

const { MESSAGE_CATEGORY, MESSAGE_STATUS, MESSAGE_PRICES } = require('../../CustomerMessage/CustomerMessageConstant');

async function reportAllStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      //REPORT TOTAL MESSAGE
      let totalMessageFilter = {};
      let totalMessageCount = await CustomerStatisticalFunction.countMessagebyDate(totalMessageFilter, startDate, endDate);

      //REPORT TOTAL EMAIL MESSAGE BY STATUS
      let filterEmailMessage = {
        customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
      };
      let totalEmailMessageByStatus = await CustomerStatisticalFunction.countMessagebyDateDistinctStatus(filterEmailMessage, startDate, endDate);

      // REPORT TOTAL EMAIL MESSAGE
      filterEmailMessage = {
        customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
      };
      let totalEmailMessage = await CustomerStatisticalFunction.countMessagebyDate(filterEmailMessage, startDate, endDate);

      //REPORT TOTAL SMS MESSAGE BY STATUS
      let filterSMSMessage = {
        customerMessageCategories: MESSAGE_CATEGORY.SMS,
      };
      let totalSMSMessageByStatus = await CustomerStatisticalFunction.countMessagebyDateDistinctStatus(filterSMSMessage, startDate, endDate);

      // REPORT TOTAL SMS MESSAGE
      filterSMSMessage = {
        customerMessageCategories: MESSAGE_CATEGORY.SMS,
      };
      let totalSMSMessage = await CustomerStatisticalFunction.countMessagebyDate(filterSMSMessage, startDate, endDate);

      //REPORT TOTAL ZNS MESSAGE BY STATUS
      let filterZNSMessage = {
        customerMessageCategories: MESSAGE_CATEGORY.ZNS,
      };
      let totalZNSMessageByStatus = await CustomerStatisticalFunction.countMessagebyDateDistinctStatus(filterZNSMessage, startDate, endDate);

      // REPORT TOTAL ZNS MESSAGE
      filterZNSMessage = {
        customerMessageCategories: MESSAGE_CATEGORY.ZNS,
      };
      let totalZNSMessage = await CustomerStatisticalFunction.countMessagebyDate(filterZNSMessage, startDate, endDate);

      //TOTAL RECORD
      let startDateRecord = req.payload.startDate;
      let endDateRecord = req.payload.endDate;
      if (startDateRecord) {
        startDateRecord = formatDate.FormatDate(startDateRecord);
      }
      if (endDateRecord) {
        endDateRecord = formatDate.FormatDate(endDateRecord);
      }

      let filterRecord = {};
      let resultRecord = await CustomerStatisticalFunction.countRecordbyDate(filterRecord, startDateRecord, endDateRecord);

      //TOTAL RETURN RECORD
      let filterRecordReturn = {
        returnNumberCount: 1,
      };
      let resultRecordReturn = await CustomerStatisticalFunction.countRecordbyDate(filterRecordReturn, startDateRecord, endDateRecord);

      //MONEY SPENT
      let emailSpentAmount = totalEmailMessage * 100;
      let smsSpentAmount = totalEmailMessage * 1000;
      let znsSpentAmount = totalZNSMessage * 1000;
      let totalSpentAmount = emailSpentAmount + smsSpentAmount;

      const totalActiveStationPromise = StationResource.count({ stationStatus: STATION_STATUS.ACTIVE });
      const totalUnavailableStationPromise = StationResource.count({ availableStatus: AVAILABLE_STATUS.UNAVAILABLE });
      const totalNotActiveStationPromise = StationResource.count({ stationStatus: STATION_STATUS.BLOCK });
      const totalActiveUserPromise = AppUserResource.count({ active: ACCOUNT_STATUS.ACTIVE });
      const totalCompletedSchedulePromise = CustomerScheduleResource.count({ CustomerScheduleStatus: SCHEDULE_STATUS.CLOSED });
      const totalVehiclePromise = AppUserVehicleResource.count();
      const totalCustomerRecordPromise = CustomerRecordResource.count();
      const totalDeployedStation = await _getDeployStationCount();

      const promiseListResult = [
        totalActiveStationPromise,
        totalUnavailableStationPromise,
        totalNotActiveStationPromise,
        totalActiveUserPromise,
        totalCompletedSchedulePromise,
        totalVehiclePromise,
        totalCustomerRecordPromise,
      ];

      const [
        totalActiveStation,
        totalUnavailableStation,
        totalNotActiveStation,
        totalActiveUser,
        totalCompletedSchedule,
        totalVehicle,
        totalCustomerRecord,
      ] = await Promise.all(promiseListResult);

      const totalStations = totalActiveStation + totalNotActiveStation;
      const totalProductive = Math.round((totalActiveStation / totalStations) * 100);

      const totalCountAppUsers = await AppUsersFunctions.countAllAppUser();

      if (totalMessageCount === undefined || resultRecord === undefined || resultRecordReturn === undefined) {
        reject('failed');
      } else {
        resolve({
          countCustomerRecord: resultRecord,
          countCustomerMassage: totalMessageCount,
          totalMessageCount: totalMessageCount,
          totalEmailMessage: totalEmailMessage,
          totalEmailMessageByStatus: totalEmailMessageByStatus,
          totalSMSMessageByStatus: totalSMSMessageByStatus,
          totalSMSMessage: totalSMSMessage,
          totalZNSMessageByStatus: totalZNSMessageByStatus,
          totalZNSMessage: totalZNSMessage,
          countCustomerRecordReturn: resultRecordReturn,
          TotalMoney: totalSpentAmount,
          totalSpentAmount: totalSpentAmount,
          smsSpentAmount: smsSpentAmount,
          emailSpentAmount: emailSpentAmount,
          znsSpentAmount: znsSpentAmount,
          totalStations: totalStations ? totalStations : 0,
          totalActiveStation: totalActiveStation ? totalActiveStation : 0,
          totalUnavailableStation: totalUnavailableStation ? totalUnavailableStation : 0,
          totalNotActiveStation: totalNotActiveStation ? totalNotActiveStation : 0,
          totalActiveUser: totalActiveUser ? totalActiveUser : 0,
          totalCompletedSchedule: totalCompletedSchedule ? totalCompletedSchedule : 0,
          totalVehicle: totalVehicle ? totalVehicle : 0,
          totalCustomerRecord: totalCustomerRecord ? totalCustomerRecord : 0,
          totalCountUser: totalCountAppUsers ? totalCountAppUsers : 0,
          totalDeployedStation: totalDeployedStation,
          totalProductive: totalProductive ? totalProductive : 0,
        });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _getDeployStationCount() {
  const stationList = await StationResource.find({}, 0, 1000);
  if (stationList && stationList.length > 0) {
    const totalDeployedStation = stationList.filter(station => {
      const stationBookingConfigValue = station.stationBookingConfig;
      if (stationBookingConfigValue) {
        const stationBookingConfig = JSON.parse(stationBookingConfigValue);
        return stationBookingConfig.some(config => config.enableBooking);
      }
    });
    return totalDeployedStation.length;
  }
  return 0;
}

function calculateDiff(a, b) {
  let diff = a;
  if (!a && !b) {
    diff = 1;
  } else if (!b) {
    diff = a;
  } else if (!a) {
    diff = 1.0 / b;
  } else {
    diff = (a * 1.0) / b;
  }
  if (diff > 1) {
    return {
      value: diff * 100,
      type: 'GT',
    };
  }

  if (diff === 1) {
    return {
      value: 0,
      type: 'EQ',
    };
  }

  return {
    value: Math.floor((1 / diff) * 10000) / 100,
    type: 'LT',
  };
}

async function customerReportByStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationId = req.currentUser.stationsId;
      const reqStartDate = req.payload.startDate;
      const reqEndDate = req.payload.endDate;
      const customers = [];
      const messages = [];
      const emails = [];

      // Default date is current date - 12 month
      let monthBegin = moment().subtract({ months: 12 }).date(1).subtract(1, 'M'); //vì bị miss data tháng 1 do dòng 231 nên phải trừ 1 tháng
      let monthEnd = moment().subtract({ months: 12 }).endOf('M');

      let loopSize = 13;

      // Use request date filter if existed
      if (reqStartDate) {
        monthBegin = moment(reqStartDate, 'DD/MM/YYYY').date(1).subtract(1, 'M'); //vì bị miss data tháng 1 do dòng 231 nên phải trừ 1 tháng
        monthEnd = moment(reqStartDate, 'DD/MM/YYYY').endOf('M');

        loopSize = Math.abs(moment(reqEndDate, 'DD/MM/YYYY').diff(moment(reqStartDate, 'DD/MM/YYYY'), 'M')) + 1;

        loopSize += 1; //vì bị miss data tháng 1 do dòng 231 nên phải trừ 1 tháng
      }

      let prevCustomer, customer;
      let prevSms, sms;
      let prevEmail, email;
      let startDate, endDate;
      let id;
      for (let i = 0; i < loopSize; i++) {
        startDate = monthBegin.format('DD/MM/YYYY');
        endDate = monthEnd.format('DD/MM/YYYY');
        customer = {
          total: await CustomerStatisticalFunction.countRecordbyDate({ customerStationId: stationId }, startDate, endDate),
          returned: await CustomerStatisticalFunction.countRecordbyDate({ customerStationId: stationId, returnNumberCount: 1 }, startDate, endDate),
        };

        customer.new = customer.total - customer.returned;

        sms = {
          sent: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.SMS,
              messageSendStatus: MESSAGE_STATUS.COMPLETED,
            },
            startDate,
            endDate,
          ),
          failed: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.SMS,
              messageSendStatus: MESSAGE_STATUS.FAILED,
            },
            startDate,
            endDate,
          ),
        };
        sms.cost = sms.sent * MESSAGE_PRICES.SMS;
        sms.costFailed = sms.failed * MESSAGE_PRICES.SMS;

        email = {
          sent: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
              messageSendStatus: MESSAGE_STATUS.COMPLETED,
            },
            startDate,
            endDate,
          ),
        };
        email.cost = email.sent * MESSAGE_PRICES.EMAIL;

        // Only add loopSize - 1 month
        if (i > 0) {
          id = monthBegin.format('YYYY/MM');
          // push to array
          customers.push({
            id,
            new: {
              value: customer.new,
              lastMonthValueDiff: calculateDiff(customer.new, prevCustomer.new),
            },
            returned: {
              value: customer.returned,
              lastMonthValueDiff: calculateDiff(customer.returned, prevCustomer.returned),
            },
          });

          messages.push({
            id,
            sent: {
              value: sms.sent,
              lastMonthValueDiff: calculateDiff(sms.sent, prevSms.sent),
            },
            failed: {
              value: sms.sent,
              lastMonthValueDiff: calculateDiff(sms.failed, prevSms.failed),
            },
            cost: {
              value: sms.cost,
              lastMonthValueDiff: calculateDiff(sms.cost, prevSms.cost),
            },
          });

          emails.push({
            id,
            sent: {
              value: email.sent,
              lastMonthValueDiff: calculateDiff(email.sent, prevEmail.sent),
            },
            cost: {
              value: email.cost,
              lastMonthValueDiff: calculateDiff(email.cost, prevEmail.cost),
            },
          });
        }

        // Save prev value for calculate diff
        if (i !== loopSize - 1) {
          monthBegin = monthBegin.add({ months: 1 });
          monthEnd = monthEnd.add({ months: 1 }).endOf('M');
          prevCustomer = customer;
          prevEmail = email;
          prevSms = sms;
        }
      }

      // Get latest month values
      const latestCustomer = customers[customers.length - 1];
      const latestMessages = messages[messages.length - 1];
      const latestEmail = emails[emails.length - 1];

      const result = {
        customer: {
          total: {
            value: customer.total,
            lastMonthValueDiff: calculateDiff(customer.total, prevCustomer.total),
          },
          new: latestCustomer.new || 0,
          returned: latestCustomer.old,
          data: customers,
        },
        messages: {
          sms: {
            total: await CustomerStatisticalFunction.countMessagebyDate(
              { customerStationId: stationId },
              moment(reqStartDate, 'DD/MM/YYYY').toDate(),
              moment(reqEndDate, 'DD/MM/YYYY').toDate(),
            ),
            sent: latestMessages.sent,
            failed: latestMessages.failed,
            cost: latestMessages.cost,
            data: messages,
          },
          email: {
            sent: latestEmail.sent,
            cost: latestEmail.cost,
            data: emails,
          },
        },
      };
      resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  customerReportByStation,
  reportAllStation,
};
