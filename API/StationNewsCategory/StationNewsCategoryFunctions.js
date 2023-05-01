/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const NewsCategoryResource = require('./resourceAccess/StationNewsCategoryResourceAccess');

async function initNewCategoriesForStation(station) {
  let categories = ['Tin nổi bật', 'Tin tức trong ngành', 'Tin tức xã hội', 'Khoa học và kỹ thuật', 'Chuyên mục tư vấn'];

  let _arrayData = [];
  const _MAX_VIEW = 1000;
  const _MIN_VIEW = 100;
  for (let i = 0; i < categories.length; i++) {
    const categoryName = categories[i];
    _arrayData.push({
      stationNewsCategoryTitle: categoryName,
      stationNewsCategoryContent: categoryName,
      stationNewsCategoryDisplayIndex: i,
      totalViewed: Math.floor(Math.random() * (_MAX_VIEW - _MIN_VIEW + 1) + _MIN_VIEW),
      dayViewed: Math.floor(Math.random() * (_MAX_VIEW - _MIN_VIEW + 1) + _MIN_VIEW),
      monthViewed: Math.floor(Math.random() * (_MAX_VIEW - _MIN_VIEW + 1) + _MIN_VIEW),
      weekViewed: Math.floor(Math.random() * (_MAX_VIEW - _MIN_VIEW + 1) + _MIN_VIEW),
      searchCount: Math.floor(Math.random() * (_MAX_VIEW - _MIN_VIEW + 1) + _MIN_VIEW),
      followCount: Math.floor(Math.random() * (_MAX_VIEW - _MIN_VIEW + 1) + _MIN_VIEW),
      stationsId: station.stationsId,
    });
  }
  let initResult = await NewsCategoryResource.insert(_arrayData);
  return initResult;
}

module.exports = {
  initNewCategoriesForStation,
};
