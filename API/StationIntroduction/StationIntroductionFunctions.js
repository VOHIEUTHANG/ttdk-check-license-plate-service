/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationIntroductionResourceAccess = require('./resourceAccess/StationIntroductionResourceAccess');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const { LINK_BANNER_DEFAULT, LINK_MEDIA_DEFAULT } = require('./StationIntroductionConstants');

const FUNC_FAILED = undefined;

async function updateStationIntro(stationId, data) {
  let station = await StationsResourceAccess.findById(stationId);
  if (station === undefined) {
    return FUNC_FAILED;
  }

  let existingStationIntroData = await StationIntroductionResourceAccess.findById(stationId);

  if (existingStationIntroData) {
    //if intro already existed
    let updateResult = await StationIntroductionResourceAccess.updateById(stationId, data);
    if (updateResult === undefined) {
      return FUNC_FAILED;
    }
  } else {
    //insert new intro if it is not existed
    let newIntroData = data;
    newIntroData.stationsId = stationId;

    let insertResult = await StationIntroductionResourceAccess.insert(data);
    if (insertResult === undefined) {
      return FUNC_FAILED;
    }
  }
  return 'ok';
}

async function getStationIntroByUrl(stationUrl) {
  //lookup station by using url
  let station = await StationsResourceAccess.find({ stationUrl: stationUrl }, 0, 1);

  //retry to find config with
  if (!station || station.length <= 0) {
    station = await StationsResourceAccess.find({ stationLandingPageUrl: stationUrl }, 0, 1);
  }

  if (station === undefined || station.length < 1) {
    return FUNC_FAILED;
  }

  station = station[0];

  //find intro by station id
  let stationId = station.stationsId;
  return await getStationIntroById(stationId);
}

async function getStationIntroById(stationId) {
  let existingStationIntroData = await StationIntroductionResourceAccess.findById(stationId);

  if (existingStationIntroData) {
    return existingStationIntroData;
  } else {
    return FUNC_FAILED;
  }
}

function createDefaultStationIntroduction() {
  let stationIntro = {
    slideBanners: LINK_BANNER_DEFAULT,
    stationIntroductionSlogan: 'Vì sự an toàn và hài lòng của khách hàng',
    stationIntroductionTitle: 'TRUNG TÂM ĐĂNG KIỂM XE CƠ GIỚI',
    stationIntroductionContent: 'Đây là nội dung chính',
    stationIntroductionMedia: LINK_MEDIA_DEFAULT,
    stationIntroSection1Content: 'Đây là nội dung phụ 1',
    stationIntroSection1Media: LINK_MEDIA_DEFAULT,
    stationIntroSection2Content: 'Đây là nội dung phụ 2',
    stationIntroSection2Media: LINK_MEDIA_DEFAULT,
    stationIntroServices: 'Đây là nội dung giới thiệu các dịch vụ',
    stationFacebookUrl: 'https://www.facebook.com/watch/?v=915618905865843&ref=sharing',
    stationTwitterUrl: 'https://twitter.com/TomAndJerry/status/1525143581370900480?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Etweet',
    stationYoutubeUrl: 'https://www.youtube.com/watch?v=wJnBTPUQS5A&list=RDwJnBTPUQS5A&start_radio=1',
    stationInstagramUrl: 'https://www.instagram.com/tv/CcYKy4yBOe_/',
  };
  return stationIntro;
}

module.exports = {
  updateStationIntro,
  getStationIntroByUrl,
  getStationIntroById,
  createDefaultStationIntroduction,
};
