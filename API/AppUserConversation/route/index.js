/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const AppUserChatLog = require('./AppUserChatLogRoute');
const AppUserConversation = require('./AppUserConversationRoute');
module.exports = [
  //AppUserConversation APIs
  { method: 'POST', path: '/AppUserConversation/insert', config: AppUserConversation.insert },
  { method: 'POST', path: '/AppUserConversation/find', config: AppUserConversation.find },
  { method: 'POST', path: '/AppUserConversation/updateById', config: AppUserConversation.updateById },
  { method: 'POST', path: '/AppUserConversation/deleteById', config: AppUserConversation.deleteById },
  { method: 'POST', path: '/AppUserConversation/user/readConversation', config: AppUserConversation.userReadConversation },
  { method: 'POST', path: '/AppUserConversation/advanceUser/readConversation', config: AppUserConversation.stationReadConversation },
  {
    method: 'POST',
    path: '/AppUserConversation/user/createNewConversationWithStation',
    config: AppUserConversation.userCreateNewConversationWithStation,
  },
  {
    method: 'POST',
    path: '/AppUserConversation/createNewConversationWithStation',
    config: AppUserConversation.adminCreateNewConversationWithUser,
  },
  {
    method: 'POST',
    path: '/AppUserConversation/user/getListConversation',
    config: AppUserConversation.userGetListConversation,
  },
  {
    method: 'POST',
    path: '/AppUserConversation/getListConversation',
    config: AppUserConversation.adminGetListConversation,
  },
  {
    method: 'POST',
    path: '/AppUserConversation/advanceUser/getListConversation',
    config: AppUserConversation.stationGetListConversation,
  },
  {
    method: 'POST',
    path: '/AppUserConversation/advanceUser/getDetailConversation',
    config: AppUserConversation.stationGetDetailConversation,
  },
  //AppUserChatLog APIs
  {
    method: 'POST',
    path: '/AppUserChatLog/insert',
    config: AppUserChatLog.insert,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/find',
    config: AppUserChatLog.find,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/deleteById',
    config: AppUserChatLog.deleteById,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/user/getList',
    config: AppUserChatLog.userGetList,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/getList',
    config: AppUserChatLog.adminGetList,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/user/sendNewMessageToStation',
    config: AppUserChatLog.userSendNewMessageToStation,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/advanceUser/sendNewMessageToUser',
    config: AppUserChatLog.stationSendNewMessageToUser,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/advanceUser/getList',
    config: AppUserChatLog.stationGetList,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/sendNewMessageToStation',
    config: AppUserChatLog.adminSendNewMessageToStation,
  },
  {
    method: 'POST',
    path: '/AppUserChatLog/advanceUser/sendNewMessageToAdmin',
    config: AppUserChatLog.stationSendNewMessageToAdmin,
  },
];
