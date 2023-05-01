/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const SystemConfigurationsResource = require('./resourceAccess/SystemConfigurationsResourceAccess');
const Logger = require('../../utils/logging');

const SYSTEM_CONFIG_ID = 1;
async function getSystemAdConfigurations() {
  //only support for 1 system configuration
  let sysmteConfig = await SystemConfigurationsResource.findById(SYSTEM_CONFIG_ID);
  if (sysmteConfig) {
    return sysmteConfig;
  } else {
    Logger.error(`can getSystemAdConfigurations`);
    return undefined;
  }
}
module.exports = {
  getSystemAdConfigurations,
};
