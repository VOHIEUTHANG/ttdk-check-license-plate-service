/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const StationVNPayResourceAccess = require('../resourceAccess/StationVNPayResourceAccess');

const Logger = require('../../../utils/logging');

async function insertOrUpdate(req) {
  return await _insertOrUpdate(req);
}

async function userInsertOrUpdate(req) {
  req.payload.stationsId = req.currentUser.stationsId;
  return await _insertOrUpdate(req);
}

async function _insertOrUpdate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let existedData = await StationVNPayResourceAccess.find({
        stationsId: data.stationsId,
      });
      if (existedData && existedData.length > 0) {
        let res = await StationVNPayResourceAccess.updateById(existedData[0].vnpayQRSecretId, data);
        if (res) {
          resolve(res);
          return;
        }
      } else {
        let res = await StationVNPayResourceAccess.insert(data);
        if (res) {
          resolve(res);
          return;
        }
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let result = await StationVNPayResourceAccess.insert(data);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let endDate = req.payload.endDate;
      let startDate = req.payload.startDate;
      if (endDate) {
        endDate = formatDate.FormatDate(endDate);
      }
      if (startDate) {
        startDate = formatDate.FormatDate(startDate);
      }
      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      }
      let stationNews = await StationNewsCategoryViews.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let stationNewsCount = await StationNewsCategoryViews.customCount(filter, startDate, endDate, searchText, order);
      if (stationNews && stationNewsCount) {
        resolve({ data: stationNews, total: stationNewsCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;
      let stationNewsData = req.payload.data;
      let result = await StationVNPayResourceAccess.updateById(stationNewsId, stationNewsData);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;
      let result = await StationNewsCategoryViews.findById(stationNewsId);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getDetailByStationId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;

      let data = await StationVNPayResourceAccess.find({ stationsId: stationsId });
      if (data && data.length > 0) {
        resolve(data[0]);
      } else {
        resolve({});
      }
    } catch (error) {
      Logger.error(__filename, error);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  insertOrUpdate,
  userInsertOrUpdate,
  getDetailByStationId,
};
