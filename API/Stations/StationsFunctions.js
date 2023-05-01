/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StationsResourceAccess = require('./resourceAccess/StationsResourceAccess');
const StationsDetailModel = require('./model/StationDetailModel');
const StationDetailPublicModel = require('./model/StationDetailPublicModel');
const UtilsFunction = require('../ApiUtils/utilFunctions');
const UploadResource = require('../Upload/resourceAccess/UploadResourceAccess');
const TextToSpeechFunction = require('../../ThirdParty/TextToSpeech/TextToSpeechFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE) {
  RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
}

async function registerNewStation(stationsData) {
  //generate new url based on name
  let stationUrl = UtilsFunction.nonAccentVietnamese(stationsData.stationCode);
  stationUrl = UtilsFunction.convertToURLFormat(stationUrl);

  //extract url name only
  stationUrl = stationUrl.replace('/', '');

  //make new url as a subdomain of CDN
  stationsData.stationUrl = `dangkiem${stationUrl}.${process.env.WEB_HOST_NAME}`;
  stationsData.stationWebhookUrl = `${stationUrl}-webhooks.${process.env.HOST_NAME}`;
  stationsData.stationLandingPageUrl = `dangkiem.${stationUrl}.${process.env.HOST_NAME}`;

  if (!stationsData.stationsEmail || stationsData.stationsEmail === null || stationsData.stationsEmail === '') {
    stationsData.stationsEmail = `${stationsData.stationCode}@kiemdinhoto.vn`;
  }
  let result = await StationsResourceAccess.insert(stationsData);
  return result;
}

async function getStationDetailById(stationId) {
  let result = await StationsResourceAccess.findById(stationId);

  if (result) {
    result = StationsDetailModel.fromData(result);
  }
  return result;
}

async function getStationDetailByUrl(url) {
  // load data from redis
  if (process.env.REDIS_ENABLE) {
    const redisKey = `STATIONS_URL_${url}`;
    const cacheData = await RedisInstance.getJson(redisKey);
    if (cacheData) {
      return cacheData;
    }
  }

  let result = await StationsResourceAccess.find({ stationUrl: url }, 0, 1);

  //retry to find config with
  if (!result || result.length <= 0) {
    result = await StationsResourceAccess.find({ stationLandingPageUrl: url }, 0, 1);
  }

  if (result && result.length > 0) {
    //This model is use to display info of Stations in public.
    //BEWARE !! DO NOT SEND INFO THAT RELATED TO SYSTEM INSIDE MODEL
    result = StationDetailPublicModel.fromData(result[0]);

    // cache data
    if (process.env.REDIS_ENABLE) {
      const redisKey = `STATIONS_URL_${url}`;
      await RedisInstance.setWithExpire(redisKey, JSON.stringify(result));
    }
  } else {
    result = undefined;
  }

  return result;
}

async function updateVoiceDataForConfig(stationsConfig) {
  for (let i = 0; i < stationsConfig.length; i++) {
    const configurationData = stationsConfig[i];
    let configVoice = configurationData.stepVoice;
    //delete voice url if voice string is empty
    if (configVoice.trim() === '') {
      stationsConfig[i].stepVoiceUrl = '';
    }
    //or generate new voice url if voice string is not empty
    else {
      //let make new voice url
      let voiceUrl = UtilsFunction.nonAccentVietnamese(configVoice);
      let voiceFilePath = `uploads/voices${UtilsFunction.convertToURLFormat(voiceUrl)}.mp3`;
      voiceUrl = `/${voiceFilePath}`;

      //find if voice url is existed in upload storage or not
      let existedVoice = await UploadResource.find({
        uploadFileName: voiceUrl,
      });
      //if voice file is existed, use it
      if (process.env.GOOGLE_TTS_ENABLE * 1 === 0 && existedVoice && existedVoice.length > 0) {
        existedVoice = existedVoice[0];
        stationsConfig[i].stepVoiceUrl = `https://${process.env.HOST_NAME}${existedVoice.uploadFileName}`;
      }
      //if voice is not existed, make a new one and store it to upload storage
      else {
        let result = await TextToSpeechFunction.createProcessSpeechFile(configVoice, voiceFilePath);
        if (result) {
          stationsConfig[i].stepVoiceUrl = `https://${process.env.HOST_NAME}${voiceUrl}`;
          UploadResource.insert({
            uploadFileName: voiceFilePath,
            uploadFileExtension: 'mp3',
            uploadUnicodeName: configVoice,
            uploadFileSize: 100,
            uploadFileUrl: `https://${process.env.HOST_NAME}${voiceUrl}`,
          });
        } else {
          console.error(`can not make stepVoiceUrl ${configVoice}`);
          //handle error
          stationsConfig[i].stepVoiceUrl = '';
        }
      }
    }
  }
}

async function resetAllDefaultMp3() {
  console.info(`resetAllDefaultMp3 ${new Date().toISOString()}`);
  //Reset all default mp3 to new TTS setting if server required (GOOGLE_TTS_ENABLE = 1)
  if (process.env.GOOGLE_TTS_ENABLE * 1 === 1) {
    await TextToSpeechFunction.resetDefaultSpeechFile();
    let existingMp3Files = await UploadResource.find({
      uploadFileExtension: 'mp3',
    });
    if (existingMp3Files && existingMp3Files.length > 0) {
      for (let i = 0; i < existingMp3Files.length; i++) {
        const mp3File = existingMp3Files[i];
        await TextToSpeechFunction.createProcessSpeechFile(mp3File.uploadUnicodeName, mp3File.uploadFileName);
      }
    }
  }
}

async function sortCheckingConfigStep(config) {
  if (config === undefined || config.length < 0) {
    return;
  }

  for (let i = 0; i < config.length; i++) {
    config[i].stepIndex = i;
  }
}

module.exports = {
  registerNewStation,
  getStationDetailById,
  getStationDetailByUrl,
  updateVoiceDataForConfig,
  resetAllDefaultMp3,
  sortCheckingConfigStep,
};
