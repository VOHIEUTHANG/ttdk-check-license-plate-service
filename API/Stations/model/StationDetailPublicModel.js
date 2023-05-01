/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
//This model is use to display info of Stations in public.
//BEWARE !! DO NOT SEND INFO THAT RELATED TO SYSTEM INSIDE MODEL
const Joi = require('joi');

const schema = Joi.object({
  stationsId: Joi.number(),
  stationsName: Joi.string().required(),
  stationUrl: Joi.string().allow(''),
  stationsLogo: Joi.string().allow(''),
  stationsHotline: Joi.string().allow(''),
  stationsAddress: Joi.string().allow(''),
  stationsEmail: Joi.string().allow(''),
  stationsColorset: Joi.string().allow(''),
  stationBookingConfig: Joi.array().items({
    index: Joi.number(),
    time: Joi.string(),
    limitSmallCar: Joi.number(),
    limitOtherVehicle: Joi.number(),
    limitRoMooc: Joi.number(),
    enableBooking: Joi.number(),
  }),
  stationMapSource: Joi.string().allow('').allow(null),
  stationsCertification: Joi.string().allow(''),
  stationsVerifyStatus: Joi.number(),
  stationsManager: Joi.string().allow(''),
  stationsLicense: Joi.string().allow(''),
  stationLandingPageUrl: Joi.string().allow(''),
  stationCode: Joi.string().allow(),
  stationStatus: Joi.number(),
  availableStatus: Joi.number(),
});

function fromData(data) {
  let modelData = {
    stationsId: data.stationsId,
    stationsName: data.stationsName,
    stationUrl: data.stationUrl,
    stationsLogo: data.stationsLogo === null ? '' : data.stationsLogo,
    stationsColorset: data.stationsColorset,
    stationsHotline: data.stationsHotline === null ? '' : data.stationsHotline,
    stationsAddress: data.stationsAddress === null ? '' : data.stationsAddress,
    stationsEmail: data.stationsEmail === null ? '' : data.stationsEmail,
    stationBookingConfig: data.stationBookingConfig === '' ? {} : JSON.parse(data.stationBookingConfig),
    stationMapSource: data.stationMapSource,
    stationsCertification: data.stationsCertification === null ? '' : data.stationsCertification,
    stationsVerifyStatus: data.stationsVerifyStatus === null ? '' : data.stationsVerifyStatus,
    stationsManager: data.stationsManager === null ? '' : data.stationsManager,
    stationsLicense: data.stationsLicense === null ? '' : data.stationsLicense,
    stationLandingPageUrl: data.stationLandingPageUrl === null ? '' : data.stationLandingPageUrl,
    stationCode: data.stationCode === null ? '' : data.stationCode,
    stationStatus: data.stationStatus,
    availableStatus: data.availableStatus,
  };

  let outputModel = schema.validate(modelData);
  if (outputModel.error === undefined || outputModel.error === null || outputModel.error === '') {
    return outputModel.value;
  } else {
    console.error(outputModel.error);
    return undefined;
  }
}

module.exports = {
  fromData,
};
