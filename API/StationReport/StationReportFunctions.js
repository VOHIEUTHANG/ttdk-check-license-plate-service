const StationReportResourceAccess = require('./resourceAccess/StationReportResourceAccess');
const CustomerRecordResourceAccess = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const CustomerScheduleResourceAccess = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { CHECKING_STATUS } = require('../CustomerRecord/CustomerRecordConstants');
const { SCHEDULE_STATUS } = require('../CustomerSchedule/CustomerScheduleConstants');

async function updateStationReportByDay(stationId, reportDay, reportData, forceUpdate = true) {
  let _existingReport = await StationReportResourceAccess.findOne({
    stationId: stationId,
    reportDay: reportDay,
  });

  if (_existingReport && forceUpdate === false) {
    return _existingReport;
  }

  if (!_existingReport) {
    let _newStationReport = {
      stationId: stationId,
      reportDay: reportDay,
      ...reportData,
    };

    let _newReportId = await StationReportResourceAccess.insert(_newStationReport);
    if (_newReportId) {
      _newReportId = _newReportId[0];
      _existingReport = await StationReportResourceAccess.findById(_newReportId);
    } else {
      console.error(reportData);
      console.error(`can not insert new report for station ${stationId} - at ${reportDay}`);
      return undefined;
    }
  }

  if (!_existingReport) {
    console.error(`invalid report to update for station ${stationId} - at ${reportDay}`);
    return undefined;
  }

  await StationReportResourceAccess.updateById(_existingReport.stationReportId, reportData);

  _existingReport = await StationReportResourceAccess.findById(_existingReport.stationReportId);

  return _existingReport;
}

async function fetchDataStationReportByDay(stationId, reportDay) {
  let promiseList = [];
  let _filterCustomerRecord = {
    customerStationId: stationId,
    customerRecordCheckDate: reportDay,
  };
  promiseList.push(
    CustomerRecordResourceAccess.count({
      ..._filterCustomerRecord,
      customerRecordCheckStatus: CHECKING_STATUS.COMPLETED,
    }),
  );
  promiseList.push(
    CustomerRecordResourceAccess.count({
      ..._filterCustomerRecord,
      customerRecordCheckStatus: CHECKING_STATUS.CANCELED,
    }),
  );
  promiseList.push(
    CustomerRecordResourceAccess.count({
      ..._filterCustomerRecord,
      customerRecordCheckStatus: CHECKING_STATUS.FAILED,
    }),
  );

  let _filterCustomerSchedule = {
    dateSchedule: reportDay,
    stationsId: stationId,
  };
  promiseList.push(
    CustomerScheduleResourceAccess.count({
      ..._filterCustomerSchedule,
      CustomerScheduleStatus: SCHEDULE_STATUS.CLOSED,
    }),
  );
  promiseList.push(
    CustomerScheduleResourceAccess.count({
      ..._filterCustomerSchedule,
      CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
    }),
  );

  let _stationReportData = await Promise.all(promiseList);
  let outputReportData = {
    totalCustomerChecking: 0,
    totalCustomerCheckingCompleted: 0,
    totalCustomerCheckingCanceled: 0,
    totalCustomerCheckingFailed: 0,
    totalCustomerSchedule: 0,
    totalCustomerScheduleClosed: 0,
    totalCustomerScheduleCanceled: 0,
  };
  if (_stationReportData) {
    if (_stationReportData[0]) {
      outputReportData.totalCustomerCheckingCompleted = _stationReportData[0];
    }

    if (_stationReportData[1]) {
      outputReportData.totalCustomerCheckingCanceled = _stationReportData[1];
    }

    if (_stationReportData[2]) {
      outputReportData.totalCustomerCheckingFailed = _stationReportData[2];
    }

    if (_stationReportData[3]) {
      outputReportData.totalCustomerScheduleClosed = _stationReportData[3];
    }

    if (_stationReportData[4]) {
      outputReportData.totalCustomerScheduleCanceled = _stationReportData[4];
    }

    outputReportData.totalCustomerSchedule = outputReportData.totalCustomerScheduleClosed + outputReportData.totalCustomerScheduleCanceled;
    outputReportData.totalCustomerChecking =
      outputReportData.totalCustomerCheckingCompleted + outputReportData.totalCustomerCheckingCanceled + outputReportData.totalCustomerCheckingFailed;
  }

  return outputReportData;
}

module.exports = {
  updateStationReportByDay,
  fetchDataStationReportByDay,
};
