/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const StationResource = require('../../Stations/resourceAccess/StationsResourceAccess');
const NewsCategoryFunctions = require('../StationNewsCategoryFunctions');

async function initCategoryForAllStations(station) {
  let _stationCount = await StationResource.count({});
  console.log(_stationCount);
  if (_stationCount) {
    for (let i = 0; i < _stationCount; i++) {
      let _stationInfo = await StationResource.find({}, i, 1);
      if (_stationInfo && _stationInfo.length > 0) {
        _stationInfo = _stationInfo[0];
        await NewsCategoryFunctions.initNewCategoriesForStation(_stationInfo);
        console.info(`Done initNewCategoriesForStation ${_stationInfo.stationsId}`);
      }
    }
  } else {
    console.error('No station to initCategoryForAllStations');
  }
}

initCategoryForAllStations();

module.exports = {
  initCategoryForAllStations,
};
