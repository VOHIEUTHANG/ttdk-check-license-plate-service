/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const AppUserConversationResource = require('../resourceAccess/AppUserConversationResourceAccess');
const AppUserConversationResourceView = require('../resourceAccess/AppUserConversationResourceView');
const AppUserChatLogResourceAccess = require('../resourceAccess/AppUserChatLogResourceAccess');

const Logger = require('../../../utils/logging');
const { createNewConversation } = require('../AppUserConversationFunction');
const { CONVERSATION_TYPE } = require('../AppUserConversationConstant');
const { MISSING_AUTHORITY, UNKNOWN_ERROR, API_FAILED } = require('../../Common/CommonConstant');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const receiverId = req.payload.receiverId;
      const senderId = req.payload.staffId;

      let _newConversation = await createNewConversation(senderId, receiverId, CONVERSATION_TYPE.USER_TO_ADMIN);
      if (_newConversation) {
        return resolve(_newConversation);
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
      let order = {
        key: 'updatedAt',
        value: 'desc',
      };

      let data = await AppUserConversationResourceView.customSearch(filter, skip, limit, undefined, undefined, undefined, order);
      let dataCount = await AppUserConversationResourceView.customCount(filter);
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
      let result = await AppUserConversationResource.findById(id);
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

      let result = await AppUserConversationResource.updateById(id, data);
      if (result !== undefined) {
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

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await AppUserConversationResource.deleteById(id);
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

async function userCreateNewConversationWithStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let senderId = req.currentUser.appUserId;
      const stationsId = req.payload.stationsId;

      let _newConversation = await createNewConversation(senderId, stationsId, CONVERSATION_TYPE.USER_TO_USER);
      if (_newConversation) {
        return resolve(_newConversation);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminCreateNewConversationWithUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const senderId = req.currentUser.staffId;
      const stationsId = req.payload.stationsId;

      let _newConversation = await createNewConversation(senderId, stationsId, CONVERSATION_TYPE.USER_TO_ADMIN);
      if (_newConversation) {
        return resolve(_newConversation);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminGetListConversation(req) {
  return new Promise(async function (resolve, reject) {
    try {
      let staffId = req.currentUser.staffId;
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let searchText = req.payload.searchText;
      let order = req.payload.order;
      if (!order) {
        order = {
          key: 'updatedAt',
          value: 'desc',
        };
      }

      const conversationList = await AppUserConversationResourceView.customSearch(
        { senderId: staffId, conversationType: CONVERSATION_TYPE.USER_TO_ADMIN, ...filter },
        skip,
        limit,
        undefined,
        undefined,
        searchText,
        order,
      );
      if (conversationList && conversationList.length > 0) {
        const conversationCount = await AppUserConversationResourceView.customCount(
          { senderId: staffId, conversationType: CONVERSATION_TYPE.USER_TO_ADMIN, ...filter },
          undefined,
          undefined,
          searchText,
        );

        await _attachNewMessage(conversationList);

        if (conversationCount) {
          return resolve({ data: conversationList, total: conversationCount[0].count });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetListConversation(req) {
  return new Promise(async function (resolve, reject) {
    try {
      let appUserId = req.currentUser.appUserId;
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let searchText = req.payload.searchText;
      let order = req.payload.order;
      if (!order) {
        order = {
          key: 'updatedAt',
          value: 'desc',
        };
      }

      const conversationList = await AppUserConversationResourceView.customSearch(
        { senderId: appUserId, conversationType: CONVERSATION_TYPE.USER_TO_USER, ...filter },
        skip,
        limit,
        undefined,
        undefined,
        searchText,
        order,
      );
      if (conversationList) {
        const conversationCount = await AppUserConversationResourceView.customCount(
          { senderId: appUserId, conversationType: CONVERSATION_TYPE.USER_TO_USER, ...filter },
          undefined,
          undefined,
          searchText,
        );

        await _attachNewMessage(conversationList);

        if (conversationCount) {
          return resolve({ data: conversationList, total: conversationCount[0].count });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _attachNewMessage(conversationList) {
  // attachNewMessage
  for (let conversation of conversationList) {
    const conversationId = conversation.appUserConversationId;
    const newestMessage = await AppUserChatLogResourceAccess.customSearch({ appUserConversationId: conversationId }, 0, 1);
    if (newestMessage && newestMessage.length > 0) {
      conversation.newestMessage = newestMessage[0];
    } else {
      conversation.newestMessage = {};
    }
  }
}

async function stationGetListConversation(req) {
  return new Promise(async function (resolve, reject) {
    try {
      const stationId = req.currentUser.stationsId;
      const filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let searchText = req.payload.searchText;
      let order = {
        key: 'updatedAt',
        value: 'desc',
      };

      const conversationList = await AppUserConversationResourceView.customSearch(
        { receiverId: stationId, ...filter },
        skip,
        limit,
        undefined,
        undefined,
        searchText,
        order,
      );
      if (conversationList) {
        const conversationCount = await AppUserConversationResourceView.customCount(
          {
            receiverId: stationId,
          },
          undefined,
          undefined,
          searchText,
        );

        await _attachNewMessage(conversationList);

        if (conversationCount) {
          return resolve({ data: conversationList, total: conversationCount[0].count });
        } else {
          return resolve({ data: [], total: 0 });
        }
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function stationGetDetailConversation(req) {
  return new Promise(async function (resolve, reject) {
    try {
      const stationId = req.currentUser.stationsId;
      let id = req.payload.id;

      let _existingConversation = await AppUserConversationResourceView.findById(id);

      if (_existingConversation.stationsId !== stationId) {
        return reject(MISSING_AUTHORITY);
      }

      if (_existingConversation) {
        await _attachNewMessage([_existingConversation]);

        let _existingStation = await StationsResourceAccess.findById(_existingConversation.stationsId);
        if (_existingStation) {
          _existingConversation.station = {
            stationsId: _existingStation.stationsId,
            stationName: _existingStation.stationName,
            stationCode: _existingStation.stationCode,
          };
        }

        let _existingUser = await AppUsersResourceAccess.findById(_existingConversation.senderId);
        if (_existingUser) {
          _existingConversation.user = {
            firstName: _existingUser.firstName,
            phoneNumber: _existingUser.phoneNumber,
            email: _existingUser.email,
          };
        }
        resolve(_existingConversation);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  updateById,
  deleteById,
  userCreateNewConversationWithStation,
  userGetListConversation,
  stationGetDetailConversation,
  stationGetListConversation,
  adminCreateNewConversationWithUser,
  adminGetListConversation,
};
