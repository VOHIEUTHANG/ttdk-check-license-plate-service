/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const StationMetadata = require('../resourceAccess/StationMetadataResourceAccess');

const REJECT_REASON = 'failed';

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = req.payload;

      if (await StationMetadata.insert(data)) {
        return resolve('success');
      }
      return reject(REJECT_REASON);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(REJECT_REASON);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const data = req.payload.data;

      if (await StationMetadata.updateById(data, id)) {
        return resolve('success');
      }

      return reject(REJECT_REASON);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(REJECT_REASON);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      if (await StationMetadata.deleteById(id)) {
        return resolve('success');
      }

      return reject(REJECT_REASON);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(REJECT_REASON);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const searchText = req.payload.searchText;

      const data = (await StationMetadata.customSearch(filter, skip, limit, searchText, order)) || [];

      let total = 0;

      if (data.length) {
        total = await StationMetadata.customCount(filter, searchText, order);
      }

      return resolve({ data: data, total: total });
    } catch (e) {
      Logger.error(__filename, e);
      return reject(REJECT_REASON);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const foundMeta = await StationMetadata.findById(id);

      if (foundMeta) {
        return resolve(foundMeta);
      }
      return reject(REJECT_REASON);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(REJECT_REASON);
    }
  });
}

async function findByStationsId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationsId = req.payload.stationsId;

      const data = (await StationMetadata.find({ stationsId }, 0, 100)) || [];
      return resolve(data);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(REJECT_REASON);
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  findByStationsId,
};
