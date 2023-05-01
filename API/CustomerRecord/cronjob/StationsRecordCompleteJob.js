/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const CustomerAutoCheckFunction = require('./StationsRecordAutoCheck');

async function autoComplete() {
  await CustomerAutoCheckFunction.autoCompleteProcessForAllStation();
  process.exit();
}
autoComplete();
module.exports = {
  autoComplete,
};
