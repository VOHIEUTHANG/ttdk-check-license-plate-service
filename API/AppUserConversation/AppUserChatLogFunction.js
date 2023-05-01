/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const AppUserChatLogResourceAccess = require('./resourceAccess/AppUserChatLogResourceAccess');
const AppUserConversationResourceAccess = require('../AppUserConversation/resourceAccess/AppUserConversationResourceAccess');
const { CHAT_DIRECTION } = require('./AppUserChatLogConstant');
async function sendMessageToConversation(messageContent, conversationId, senderToReceiver = CHAT_DIRECTION.USER_TO_ADMIN) {
  let _existingConversation = await AppUserConversationResourceAccess.findById(conversationId);
  if (!_existingConversation) {
    console.error(`can not find _existingConversation ${conversationId} to sendMessageToConversation`);
    return undefined;
  }

  let _newMessage = {
    appUserChatLogContent: messageContent,
    senderId: _existingConversation.senderId,
    receiverId: _existingConversation.receiverId,
    appUserConversationId: conversationId,
    senderToReceiver: senderToReceiver,
  };

  let sendResult = await AppUserChatLogResourceAccess.insert(_newMessage);
  if (sendResult) {
    let _readData = {};
    if (senderToReceiver === CHAT_DIRECTION.USER_TO_ADMIN) {
      _readData.senderReadMessage = 1;
      _readData.receiverReadMessage = 0;
    } else {
      _readData.receiverReadMessage = 1;
      _readData.senderReadMessage = 0;
    }
    await AppUserConversationResourceAccess.updateById(conversationId, _readData);
    return sendResult;
  } else {
    return undefined;
  }
}
module.exports = {
  sendMessageToConversation,
};
