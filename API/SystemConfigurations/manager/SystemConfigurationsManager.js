/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const SystemConfigurationsResource = require('../resourceAccess/SystemConfigurationsResourceAccess');
const Logger = require('../../../utils/logging');

const SYSTEM_CONFIG_ID = 1;
async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let systemConfig = req.payload.data;
      let result = await SystemConfigurationsResource.updateById(SYSTEM_CONFIG_ID, systemConfig);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      //only support for 1 system configuration
      let sysmteConfig = await SystemConfigurationsResource.findById(SYSTEM_CONFIG_ID);
      if (sysmteConfig) {
        resolve(sysmteConfig);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  updateById,
  findById,
};
