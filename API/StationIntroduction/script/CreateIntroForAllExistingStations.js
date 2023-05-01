/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationIntroductionResourceAccess = require('../resourceAccess/StationIntroductionResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

const FUNC_FAILED = undefined;
async function createIntroForAllExistingStations() {
  console.info(`createIntroForAllExistingStations`);
  const newIntro = {
    stationIntroductionTitle: '',
    slideBanners: '',
    stationIntroductionSlogan: '',
    stationIntroductionContent: '',
    stationIntroductionMedia: '',
    stationIntroSection1Content: '',
    stationIntroSection1Media: '',
    stationIntroSection2Content: '',
    stationIntroSection2Media: '',
    stationIntroServices: '',
    stationFacebookUrl: '',
    stationTwitterUrl: '',
    stationYoutubeUrl: '',
    stationInstagramUrl: '',
  };

  let stationCount = await StationsResourceAccess.count({});
  if (stationCount === undefined) {
    return FUNC_FAILED;
  }
  console.log(stationCount);
  const BATCH_SIZE = 10;
  let batchCount = parseInt(stationCount / 10);
  if (batchCount * BATCH_SIZE < stationCount) {
    batchCount = batchCount + 1;
  }
  console.log(batchCount);
  for (let i = 0; i < batchCount; i++) {
    let stationList = await StationsResourceAccess.find({}, BATCH_SIZE * i, BATCH_SIZE);
    if (stationList && stationList.length > 0) {
      for (let j = 0; j < stationList.length; j++) {
        const stationData = stationList[j];
        let existingStationIntroData = await StationIntroductionResourceAccess.findById(stationData.stationsId);
        if (existingStationIntroData === undefined) {
          //insert new intro if it is not existed
          let newIntroData = newIntro;
          newIntroData.stationsId = stationData.stationsId;

          let insertResult = await StationIntroductionResourceAccess.insert(newIntroData);
          if (insertResult === undefined) {
            return FUNC_FAILED;
          } else {
            console.info(`Init intro for station ${stationData.stationsId} success`);
          }
        }
      }
    } else {
      continue;
    }
  }

  return 'ok';
}
createIntroForAllExistingStations();

module.exports = {
  createIntroForAllExistingStations,
};
