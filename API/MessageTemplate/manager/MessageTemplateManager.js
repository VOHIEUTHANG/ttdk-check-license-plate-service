/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const MessageTemplateResourceAccess = require('../resourceAccess/MessageTemplateResourceAccess');
const MessageTemplateView = require('../resourceAccess/MessageTemplateView');

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let messageTemplate = await MessageTemplateView.customSearch(filter, skip, limit, searchText, order);

      let messageTemplateCount = await MessageTemplateView.customCount(filter, searchText, order);
      if (messageTemplate && messageTemplateCount) {
        resolve({ data: messageTemplate, total: messageTemplateCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let messageTemplateId = req.payload.id;
      let messageTemplateData = req.payload.data;

      let result = await MessageTemplateResourceAccess.updateById(messageTemplateId, messageTemplateData);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let messageTemplateId = req.payload.id;
      let result = await MessageTemplateResourceAccess.findById(messageTemplateId);

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

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let messageTemplateId = req.payload.id;

      let oldRecord = await MessageTemplateResourceAccess.findById(messageTemplateId);
      if (oldRecord === undefined) {
        reject('invalid record');
        return;
      }

      let result = await MessageTemplateResourceAccess.deleteById(messageTemplateId);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await MessageTemplateResourceAccess.insert(req.payload);
      if (result) {
        resolve(result);
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
  insert,
  find,
  updateById,
  findById,
  deleteById,
};
