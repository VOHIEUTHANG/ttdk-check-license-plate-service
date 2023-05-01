/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Logger = require('./utils/logging');
const Glue = require('glue');
const Routes = require('./config/routes');
const Manifest = require('./config/manifest');
const AppConfig = require('./config/app');
const dotenv = require('dotenv').config();
const MQTTBroker = require('./ThirdParty/MQTTBroker/MQTTBroker');
const MQTTClient = require('./ThirdParty/MQTTClient/MQTTClient');
const TextToSpeechClient = require('./ThirdParty/TextToSpeech/TextToSpeechClient');
const EmailClient = require('./ThirdParty/Email/EmailClient');
const CronJob = require('./cron/index');
const { reportToTelegram } = require('./ThirdParty/TelegramBot/TelegramBotFunctions');

Glue.compose(Manifest, { relativeTo: __dirname }, (err, server) => {
  if (err) {
    throw err;
  }
  server.start(() => {
    Logger.info('Server running at:', server.info.uri);
    reportToTelegram(`Khởi động máy chủ: ${new Date()}`);
    if (process.env.ENABLE_WORKER && process.env.ENABLE_WORKER * 1 === 1) {
      CronJob.startSchedule();
    }
  });
  server.auth.strategy('jwt', 'jwt', {
    key: AppConfig.jwt.secret,
    verifyOptions: { algorithms: ['HS256'] },
  });
  server.route(Routes);
});
