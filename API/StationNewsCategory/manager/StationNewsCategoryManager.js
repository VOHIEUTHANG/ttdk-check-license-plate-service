/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationNewsCategoryResourceAccess = require('../resourceAccess/StationNewsCategoryResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const Logger = require('../../../utils/logging');
const formatDate = require('../../ApiUtils/utilFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsCategoryData = req.payload;
      if (req.currentUser.stationsId) {
        stationNewsCategoryData.stationsId = req.currentUser.stationsId;
      } else {
        reject('failed');
        return;
      }

      let result = await StationNewsCategoryResourceAccess.insert(stationNewsCategoryData);
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
      let stationNewsCategory = await StationNewsCategoryResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let stationNewsCategoryCount = await StationNewsCategoryResourceAccess.customCount(filter, startDate, endDate, searchText, order);
      if (stationNewsCategory && stationNewsCategoryCount) {
        resolve({ data: stationNewsCategory, total: stationNewsCategoryCount });
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
      let stationNewsCategoryId = req.payload.id;
      let stationNewsCategoryData = req.payload.data;
      let result = await StationNewsCategoryResourceAccess.updateById(stationNewsCategoryId, stationNewsCategoryData);
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
      let stationNewsCategoryId = req.payload.id;
      let result = await StationNewsCategoryResourceAccess.findById(stationNewsCategoryId);
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

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsCategoryId = req.payload.id;

      let result = await StationNewsCategoryResourceAccess.deleteById(stationNewsCategoryId);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getCategoryListForUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationUrl = req.payload.stationsUrl;
      let station = await StationsResourceAccess.find({ stationUrl: stationUrl }, 0, 1);

      //retry to find config with
      if (!station || station.length <= 0) {
        station = await StationsResourceAccess.find({ stationLandingPageUrl: stationUrl }, 0, 1);
      }

      if (station && station.length > 0) {
        let _categoryOrder = {
          key: 'stationNewsCategoryDisplayIndex',
          value: 'asc',
        };
        let stationNewsCategory = await StationNewsCategoryResourceAccess.find({ stationsId: station[0].stationsId }, skip, limit, _categoryOrder);

        if (stationNewsCategory) {
          let stationNewsCategoryCount = await StationNewsCategoryResourceAccess.count({ stationsId: station[0].stationsId });

          resolve({ data: stationNewsCategory, total: stationNewsCategoryCount });
        } else {
          resolve({ data: [], total: 0 });
        }
      }
      reject('failed');
    } catch {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function advanceUserGetListCategory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      }

      const stationNewsCategory = await StationNewsCategoryResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText, order);

      if (stationNewsCategory && stationNewsCategory.length > 0) {
        const stationNewsCategoryCount = await StationNewsCategoryResourceAccess.customCount(filter, undefined, undefined, searchText, order);
        resolve({ data: stationNewsCategory, total: stationNewsCategoryCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  getCategoryListForUser,
  advanceUserGetListCategory,
};
