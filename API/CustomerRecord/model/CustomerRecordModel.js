/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';

const moment = require('moment');
const { isValidValue } = require('../../ApiUtils/utilFunctions');
const { CUSTOMER_RECORD_DISPLAY_DATE_FORMAT, CUSTOMER_RECORD_DB_DATE_FORMAT } = require('../CustomerRecordConstants');

function fromData(data) {
  let modelData = data;
  if (isValidValue(data.customerRecordCheckDate)) {
    modelData.customerRecordCheckDate = moment(data.customerRecordCheckDate, CUSTOMER_RECORD_DB_DATE_FORMAT).format(
      CUSTOMER_RECORD_DISPLAY_DATE_FORMAT,
    );
  } else {
    modelData.customerRecordCheckDate = '';
  }

  if (isValidValue(data.customerRecordCheckExpiredDate)) {
    modelData.customerRecordCheckExpiredDate = moment(data.customerRecordCheckExpiredDate, CUSTOMER_RECORD_DB_DATE_FORMAT).format(
      CUSTOMER_RECORD_DISPLAY_DATE_FORMAT,
    );
  } else {
    modelData.customerRecordCheckExpiredDate = '';
  }

  //TODO: get real result later
  modelData.customerRecordEmailNotifyResult = true;
  modelData.customerRecordSMSNotifyResult = true;
  return modelData;
}

module.exports = {
  fromData,
};
