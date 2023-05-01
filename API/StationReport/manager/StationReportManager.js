'user strict';
const moment = require('moment');

const StationReportResourceAccess = require('../resourceAccess/StationReportResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND, MISSING_AUTHORITY } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

const { getDetailDocumentById, updateStationReportByDay } = require('../StationReportFunctions');
const { CUSTOMER_RECORD_DISPLAY_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { STATION_REPORT_DISPLAY_DATE_FORMAT } = require('../../StationReport/StationReportConstants');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      return resolve('ok');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let searchText = req.payload.searchText;

      const stationReportResourceAccess = await StationReportResourceAccess.customSearch(
        filter,
        undefined,
        undefined,
        undefined,
        undefined,
        searchText,
      );

      if (stationReportResourceAccess && stationReportResourceAccess.length > 0) {
        for (let i = 0; i < stationReportResourceAccess.length; i++) {
          stationReportResourceAccess[i] = await getDetailDocumentById(stationReportResourceAccess[i].stationDocumentId);
        }
        const documentCount = await StationReportResourceAccess.customCount(filter, undefined, undefined, searchText);
        return resolve({ data: stationReportResourceAccess, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await await getDetailDocumentById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const oldRecord = await StationReportResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      } else {
        const result = await StationReportResourceAccess.deleteById(id);
        if (result === 1) {
          return resolve('success');
        } else {
          return reject(UNKNOWN_ERROR);
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updateData = req.payload.data;

      const targetRecord = await StationReportResourceAccess.findById(id);

      if (targetRecord) {
        const result = await StationReportResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetTodayReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;

      if (!stationId) {
        return reject(MISSING_AUTHORITY);
      }

      const _today = moment().format(STATION_REPORT_DISPLAY_DATE_FORMAT);
      let filter = {
        stationId: stationId,
        reportDay: _today,
      };
      const _todayReport = await StationReportResourceAccess.find(filter, 0, 1);

      if (_todayReport && _todayReport.length > 0) {
        return resolve(_todayReport[0]);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserSubmitTodayReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;
      const reportData = req.payload || {};

      if (!stationId) {
        return reject(MISSING_AUTHORITY);
      }

      const _today = moment().format('YYYY/MM/DD');
      //Thêm appUserId để biết user này đã đọc tài liệu
      const result = await updateStationReportByDay(stationId, _today, reportData);

      if (result) {
        return resolve(result);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetStationReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;

      if (!stationId) {
        return reject(MISSING_AUTHORITY);
      }

      const _startDate = moment(req.payload.startDate, CUSTOMER_RECORD_DISPLAY_DATE_FORMAT);
      const _endDate = moment(req.payload.endDate, CUSTOMER_RECORD_DISPLAY_DATE_FORMAT);

      if (_startDate > _endDate) {
        console.error(`advanceUserGetStationReport _startDate > _endDate`);
        return reject(UNKNOWN_ERROR);
      }
      let filter = {
        stationId: stationId,
      };
      const _todayReport = await StationReportResourceAccess.customSearch(filter, undefined, undefined, _startDate.toDate(), _endDate.toDate());

      if (_todayReport && _todayReport.length > 0) {
        return resolve({
          data: _todayReport,
          total: _todayReport.length,
        });
      } else {
        return resolve({
          data: [],
          total: {},
        });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  deleteById,
  updateById,
  advanceUserSubmitTodayReport,
  advanceUserGetTodayReport,
  advanceUserGetStationReport,
};
