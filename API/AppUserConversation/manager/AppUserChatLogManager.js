/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const AppUserChatLog = require('../resourceAccess/AppUserChatLogResourceAccess');
const Logger = require('../../../utils/logging');
const AppUserChatLogFunction = require('../AppUserChatLogFunction');
const { createNewConversation } = require('../AppUserConversationFunction');
const { CONVERSATION_TYPE } = require('../AppUserConversationConstant');
const { publishJson } = require('../../../ThirdParty/MQTTBroker/MQTTBroker');
const { CHAT_DIRECTION } = require('../AppUserChatLogConstant');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _content = req.payload.appUserChatLogContent;
      let _conversationId = req.payload.appUserConversationId;

      let result = await AppUserChatLogFunction.sendMessageToConversation(_content, _conversationId, CHAT_DIRECTION.USER_TO_ADMIN);
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

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let data = await AppUserChatLog.customSearch(filter, skip, limit, order);
      let dataCount = await AppUserChatLog.customCount(filter, order);
      if (data && dataCount) {
        resolve({ data: data, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
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
      let id = req.payload.id;
      let result = await AppUserChatLog.findById(id);
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

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;
      let result = await AppUserChatLog.updateById(id, data);
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
      let id = req.payload.id;
      let result = await AppUserChatLog.deleteById(id);
      if (result) {
        resolve(result);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      filter.senderId = req.currentUser.appUserId;

      let data = await AppUserChatLog.customSearch(filter, skip, limit, undefined, undefined, undefined, order);

      if (data && data.length > 0) {
        let dataCount = await AppUserChatLog.customCount(filter);
        resolve({ data: data, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = {
        key: 'createdAt',
        value: 'desc',
      };

      filter.senderId = req.currentUser.staffId;

      let data = await AppUserChatLog.customSearch(filter, skip, limit, undefined, undefined, undefined, order);

      if (data && data.length > 0) {
        let dataCount = await AppUserChatLog.customCount(filter);
        resolve({ data: data, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function stationGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      if (req.currentUser.stationsId) {
        filter.receiverId = req.currentUser.stationsId;
      }

      let data = await AppUserChatLog.customSearch(filter, skip, limit, undefined, undefined, undefined, order);

      if (data && data.length > 0) {
        let dataCount = await AppUserChatLog.customCount(filter);
        resolve({ data: data, total: dataCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userSendNewMessageToStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _content = req.payload.appUserChatLogContent;
      let _conversationId = req.payload.appUserConversationId;

      let result = await AppUserChatLogFunction.sendMessageToConversation(_content, _conversationId);
      if (result) {
        const TOPIC = `APP_USER_CONVERSATION_ID_${_conversationId}`;
        const message = {
          appUserChatLogContent: _content,
          appUserConversationId: _conversationId,
          createdAt: new Date(),
        };
        await publishJson(TOPIC, message);
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

async function adminSendNewMessageToStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _content = req.payload.appUserChatLogContent;
      let _conversationId = req.payload.appUserConversationId;

      let result = await AppUserChatLogFunction.sendMessageToConversation(_content, _conversationId, CHAT_DIRECTION.USER_TO_ADMIN);
      if (result) {
        const TOPIC = `APP_USER_CONVERSATION_ID_${_conversationId}`;
        const message = {
          appUserChatLogContent: _content,
          appUserConversationId: _conversationId,
          createdAt: new Date(),
        };
        await publishJson(TOPIC, message);
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

async function stationSendNewMessageToUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _content = req.payload.appUserChatLogContent;
      let _conversationId = req.payload.appUserConversationId;
      const _receiverId = req.payload.receiverId;
      const stationId = req.currentUser.stationsId;

      if (!_conversationId && _receiverId) {
        const newConversation = await createNewConversation(_receiverId, stationId, CONVERSATION_TYPE.USER_TO_USER);
        if (newConversation) {
          _conversationId = newConversation.appUserConversationId;
        } else {
          return reject(UNKNOWN_ERROR);
        }
      }

      let result = await AppUserChatLogFunction.sendMessageToConversation(
        _content,
        _conversationId,
        CHAT_DIRECTION.ADMIN_TO_USER,
        stationId,
        _receiverId,
      );
      if (result) {
        const TOPIC = `APP_USER_CONVERSATION_ID_${_conversationId}`;
        const message = {
          appUserChatLogContent: _content,
          appUserConversationId: _conversationId,
          createdAt: new Date(),
        };
        await publishJson(TOPIC, message);
        resolve({
          chatLogId: result[0],
          conversationId: _conversationId,
        });
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function stationSendNewMessageToAdmin(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _content = req.payload.appUserChatLogContent;
      let _conversationId = req.payload.appUserConversationId;

      let result = await AppUserChatLogFunction.sendMessageToConversation(_content, _conversationId, CHAT_DIRECTION.ADMIN_TO_USER);
      if (result) {
        const TOPIC = `APP_USER_CONVERSATION_ID_${_conversationId}`;
        const message = {
          appUserChatLogContent: _content,
          appUserConversationId: _conversationId,
          createdAt: new Date(),
        };
        await publishJson(TOPIC, message);
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
  findById,
  updateById,
  deleteById,
  adminGetList,
  userGetList,
  stationGetList,
  userSendNewMessageToStation,
  stationSendNewMessageToUser,
  adminSendNewMessageToStation,
  stationSendNewMessageToAdmin,
};
