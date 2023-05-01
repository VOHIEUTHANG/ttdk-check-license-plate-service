/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const AppUserConversationResource = require('./resourceAccess/AppUserConversationResourceAccess');

async function createNewConversation(senderId, stationsId, conversationType) {
  if (!senderId) {
    return undefined;
  }

  let _existingConversation = await AppUserConversationResource.find({
    senderId: senderId,
    receiverId: stationsId, //luon luon quy dinh admin la "NGUOI NHAN"
  });

  if (_existingConversation && _existingConversation.length > 0) {
    return _existingConversation[0];
  } else {
    let result = await AppUserConversationResource.insert({
      senderId: senderId,
      receiverId: stationsId,
      conversationType: conversationType,
    });
    if (result) {
      return {
        appUserConversationId: result[0],
      };
    }
  }

  return undefined;
}

module.exports = {
  createNewConversation,
};
