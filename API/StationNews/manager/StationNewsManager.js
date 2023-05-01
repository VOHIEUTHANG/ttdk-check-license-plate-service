/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationNewsResourceAccess = require('../resourceAccess/StationNewsResourceAccess');
const StationNewsCategoryViews = require('../resourceAccess/StationNewsCategoryViews');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const StationNewsCategoryResource = require('../../StationNewsCategory/resourceAccess/StationNewsCategoryResourceAccess');
const Logger = require('../../../utils/logging');
const formatDate = require('../../ApiUtils/utilFunctions');
const StationsFunctions = require('../../Stations/StationsFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsData = req.payload;
      stationNewsData.stationsId = req.currentUser.stationsId;
      let result = await StationNewsResourceAccess.insert(stationNewsData);
      if (result) {
        await _notifyNewsToUser(stationNewsData.stationNewsTitle);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _notifyNewsToUser(newsTitle) {
  const FirebaseNotificationFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');

  const title = 'Có tin tức mới!';
  const message = newsTitle;
  const result = await FirebaseNotificationFunctions.pushNotificationByTopic('GENERAL', title, message, undefined, 'GENERAL');
  Logger.info('PUSH STATION NEWS NOTIFICATION RESULT =>', result);
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
      let result = await StationNewsResourceAccess.updateById(stationNewsId, stationNewsData);
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
        await _increaseView(stationNewsId, result.totalViewed);
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

let CACHE_VIEWS_COUNTER = {};
let needToUpdateViewCount = false;

//1 giờ 1 lần sẽ cập nhật lượt view vào database
setInterval(async () => {
  if (needToUpdateViewCount) {
    needToUpdateViewCount = false;
    for (let i = 0; i < Object.keys(CACHE_VIEWS_COUNTER).length; i++) {
      const _key = Object.keys(CACHE_VIEWS_COUNTER)[i];
      if (CACHE_VIEWS_COUNTER[_key] && CACHE_VIEWS_COUNTER[_key] * 1 > 0) {
        await StationNewsResourceAccess.updateById(_key, { totalViewed: CACHE_VIEWS_COUNTER[_key] });
      }
    }
  }
}, 1000 * 60 * 60);

async function _increaseView(id, previousView) {
  const viewCount = previousView ? ++previousView : 1;
  if (CACHE_VIEWS_COUNTER[id]) {
    CACHE_VIEWS_COUNTER[id] = CACHE_VIEWS_COUNTER[id]++;
  } else {
    CACHE_VIEWS_COUNTER[id] = viewCount;
  }
  needToUpdateViewCount = true;
}

let swapper = 0;
async function getNewsDetail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationNewsId = req.payload.id;
      let result = await StationNewsCategoryViews.findById(stationNewsId);
      if (result) {
        await _increaseView(stationNewsId, result.totalViewed);
        swapper++;
        if (swapper > 10) {
          swapper = 0;
        }
        let _relatedNews = [];
        if (swapper === 0) {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5, {
            key: 'totalViewed',
            value: 'desc',
          });
        } else if (swapper < 5) {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5, {
            key: 'monthViewed',
            value: 'desc',
          });
        } else if (swapper < 8) {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5, {
            key: 'weekViewed',
            value: 'desc',
          });
        } else {
          _relatedNews = await StationNewsCategoryViews.find({ stationsId: result.stationsId }, 0, 5);
        }
        result.relatedNews = _relatedNews;
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getNewList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationsUrl = req.payload.stationsUrl;
      let filter = req.payload.filter;
      if (!filter) {
        filter = {};
      }

      let _outputResponse = { data: [], total: 0 };
      let station = await StationsFunctions.getStationDetailByUrl(stationsUrl);
      if (station) {
        filter = {
          ...filter,
          stationsId: station.stationsId,
        };

        // load data from redis
        if (process.env.REDIS_ENABLE) {
          const redisKey = `HOT_NEWS_${JSON.stringify(filter)}_${skip}_${limit}`;
          const cacheData = await RedisInstance.getJson(redisKey);
          if (cacheData) {
            return resolve(cacheData);
          }
        }
        let stationNews = await StationNewsCategoryViews.find(filter, skip, limit);

        if (stationNews && stationNews.length > 0) {
          let stationNewsCount = await StationNewsCategoryViews.count(filter);
          _outputResponse = { data: stationNews, total: stationNewsCount };
        }

        // cache data
        if (process.env.REDIS_ENABLE) {
          const redisKey = `HOT_NEWS_${JSON.stringify(filter)}_${skip}_${limit}`;
          await RedisInstance.setWithExpire(redisKey, JSON.stringify(_outputResponse));
        }
      }

      resolve(_outputResponse);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getAllNewsForStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationUrl = req.payload.stationsUrl;
      let station = await StationsResourceAccess.find({ stationUrl: stationUrl }, 0, 1);

      let outputResult = {
        generalNews: {
          data: [],
          total: 0,
        },
        mostReadNews: [],
        categoriesNews: [],
      };

      //retry to find config with
      if (!station || station.length <= 0) {
        station = await StationsResourceAccess.find({ stationLandingPageUrl: stationUrl }, 0, 1);
      }

      if (station && station.length > 0) {
        // load data from redis
        if (process.env.REDIS_ENABLE) {
          const redisKey = `NEWS_LIST_${stationUrl}`;
          const cacheData = await RedisInstance.getJson(redisKey);
          if (cacheData) {
            return resolve(cacheData);
          }
        }

        let _allCategories = await StationNewsCategoryResource.find({ stationsId: station[0].stationsId }, 0, 20, {
          key: 'stationNewsCategoryDisplayIndex',
          value: 'asc',
        });

        if (_allCategories && _allCategories.length > 0) {
          outputResult.categoriesList = _allCategories;
          for (let i = 0; i < _allCategories.length; i++) {
            let _stationNews = await StationNewsCategoryViews.find(
              {
                stationsId: station[0].stationsId,
                stationNewsCategories: _allCategories[i].stationNewsCategoryId,
              },
              skip,
              limit,
            );
            let _stationNewsCount = await StationNewsCategoryViews.count({
              stationsId: station[0].stationsId,
              stationNewsCategories: _allCategories[i].stationNewsCategoryId,
            });
            _allCategories[i].data = _stationNews ? _stationNews : [];
            _allCategories[i].total = _stationNewsCount ? _stationNewsCount : 0;
          }
        }

        outputResult.categoriesNews = _allCategories;

        let stationNews = await StationNewsCategoryViews.find({ stationsId: station[0].stationsId }, skip, limit);
        let stationNewsCount = await StationNewsCategoryViews.count({ stationsId: station[0].stationsId });
        if (stationNews && stationNewsCount) {
          let _mostReadNews = await StationNewsCategoryViews.find({ stationsId: station[0].stationsId }, skip, limit, {
            key: 'totalViewed',
            value: 'desc',
          });

          let generalNews = {
            data: stationNews,
            total: stationNewsCount,
          };

          outputResult.generalNews = generalNews;
          outputResult.mostReadNews = _mostReadNews;
        }

        // cache data
        if (process.env.REDIS_ENABLE) {
          const redisKey = `NEWS_LIST_${stationUrl}`;
          const stationNewsJson = JSON.stringify(outputResult);
          await RedisInstance.setWithExpire(redisKey, stationNewsJson, 3 * 60 * 60);
        }

        resolve(outputResult);
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
      let stationNewsId = req.payload.id;

      let result = await StationNewsResourceAccess.deleteById(stationNewsId);
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

async function getHotNewList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationUrl = req.payload.stationsUrl;
      let station = await StationsResourceAccess.find({ stationUrl: stationUrl });
      let order = {
        key: 'totalViewed',
        value: 'desc',
      };
      if (station && station.length > 0) {
        let stationNews = await StationNewsCategoryViews.find({ stationsId: station[0].stationsId }, skip, limit, order);
        let stationNewsCount = await StationNewsCategoryViews.count({ stationsId: station[0].stationsId });
        if (stationNews && stationNewsCount) {
          resolve({ data: stationNews, total: stationNewsCount });
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

async function getNewestList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationsUrl = req.payload.stationsUrl;
      let filter = req.payload.filter || {};
      let order = {
        key: 'stationNewsUpdatedAt',
        value: 'desc',
      };

      let _outputResponse = { data: [], total: 0 };
      let station = await StationsFunctions.getStationDetailByUrl(stationsUrl);
      if (station) {
        filter = {
          ...filter,
          stationsId: station.stationsId,
        };

        // load data from redis
        if (process.env.REDIS_ENABLE) {
          const redisKey = `NEWEST_${JSON.stringify(filter)}_${skip}_${limit}`;
          const cacheData = await RedisInstance.getJson(redisKey);
          if (cacheData) {
            return resolve(cacheData);
          }
        }
        let stationNews = await StationNewsCategoryViews.find(filter, skip, limit, order);

        if (stationNews && stationNews.length > 0) {
          //TODO review performance later
          // let stationNewsCount = await StationNewsCategoryViews.count(filter);
          _outputResponse = { data: stationNews, total: stationNews.length };
        }

        // cache data
        if (process.env.REDIS_ENABLE) {
          const redisKey = `NEWEST_${JSON.stringify(filter)}_${skip}_${limit}`;
          await RedisInstance.setWithExpire(redisKey, JSON.stringify(_outputResponse));
        }
      }

      resolve(_outputResponse);
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
  getNewsDetail,
  getNewList,
  deleteById,
  getHotNewList,
  getAllNewsForStation,
  getNewestList,
};
