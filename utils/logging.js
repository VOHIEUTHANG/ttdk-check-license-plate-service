/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';

const Winston = require('winston');
const AppConfig = require('../config/app');

const loggingTransports = [
  new Winston.transports.Console({
    level: AppConfig.logging.console.level,
    handleExceptions: true,
    humanReadableUnhandledException: true,
    colorize: true,
  }),
];
Winston.Logger({
  transports: loggingTransports,
  exitOnError: false,
});
module.exports = Winston;
