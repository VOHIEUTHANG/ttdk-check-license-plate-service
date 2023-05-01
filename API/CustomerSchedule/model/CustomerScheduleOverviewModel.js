/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';

const Joi = require('joi');

const schema = Joi.object({
  customerScheduleId: Joi.number(),
  licensePlates: Joi.string().required(),
  phone: Joi.string().required(),
  fullnameSchedule: Joi.string(),
  email: Joi.string(),
  dateSchedule: Joi.string(),
  time: Joi.string(),
  stationsId: Joi.number(),
});

function fromData(data) {
  let modelData = {
    customerScheduleId: data.id,
    licensePlates: data.licensePlates,
    phone: data.phone,
    fullnameSchedule: data.fullnameSchedule,
    email: data.email,
    dateSchedule: new Date(data.dateSchedule).toISOString(),
    time: data.time,
    stationsId: data.stationsId,
    notificationMethod: data.notificationMethod,
  };
  return schema.validate(modelData);
}

module.exports = {
  fromData,
};
