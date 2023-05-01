/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationsResourceAccess = require('../resourceAccess/StationsResourceAccess');
const StationIntroductionFunction = require('../../StationIntroduction/StationIntroductionFunctions');
const StationIntroductionResourceAccess = require('../../StationIntroduction/resourceAccess/StationIntroductionResourceAccess');
const StationNewsCategoryResourceAccess = require('../../StationNewsCategory/resourceAccess/StationNewsCategoryResourceAccess');

async function updatetIntroForAllStations() {
  let stationsListCount = await StationsResourceAccess.count({});

  if (stationsListCount && stationsListCount > 0) {
    console.info(`stationsListCount has ${stationsListCount} item`);
  } else {
    console.info(`stationsListCount is empty`);
    return;
  }

  if (stationsListCount <= 0) {
    console.info(`stationsListCount has no station`);
    return;
  }

  for (let i = 0; i < stationsListCount; i++) {
    let _station = await StationsResourceAccess.find({}, i, 1);
    if (_station && _station.length > 0) {
      _station = _station[0];
    } else {
      continue;
    }

    let stationsId = _station.stationsId;

    let existingIntro = await StationIntroductionResourceAccess.find({
      stationsId: stationsId,
    });
    if (existingIntro && existingIntro.length > 0) {
      continue;
    } else {
      console.info(`createDefaultStationIntroduction ${stationsId}`);
      //insert StationIntroduction
      let stationIntro = StationIntroductionFunction.createDefaultStationIntroduction();
      await StationIntroductionFunction.updateStationIntro(stationsId, stationIntro);
    }

    let existingNewsCategory = await StationNewsCategoryResourceAccess.find({
      stationsId: stationsId,
    });
    if (existingNewsCategory && existingNewsCategory.length > 0) {
      continue;
    } else {
      console.info(`initNewCategoriesForStation ${stationsId}`);
      //insert category default for station
      const StationNewsCategoryFunction = require('../../StationNewsCategory/StationNewsCategoryFunctions');
      await StationNewsCategoryFunction.initNewCategoriesForStation({
        stationsId: stationsId,
      });
    }
  }
  console.info(`Completed updatetIntroForAllStations`);
}

updatetIntroForAllStations();

module.exports = {
  updatetIntroForAllStations,
};
