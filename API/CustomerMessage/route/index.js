const CustomerMessage = require('./CustomerMessageRoute');

module.exports = [
  { method: 'POST', path: '/CustomerMessage/getList', config: CustomerMessage.find },
  { method: 'POST', path: '/CustomerMessage/getDetailById', config: CustomerMessage.findById },
  { method: 'POST', path: '/CustomerMessage/reportTotalSMSByStation', config: CustomerMessage.reportTotalSMSByStation },

  { method: 'POST', path: '/CustomerMessage/updateById', config: CustomerMessage.updateById },
  { method: 'POST', path: '/CustomerMessage/sendsms', config: CustomerMessage.sendsms }, //only open this API for testing
  { method: 'POST', path: '/CustomerMessage/sendMessageByFilter', config: CustomerMessage.sendMessageByFilter },
  { method: 'POST', path: '/CustomerMessage/sendMessageByCustomerList', config: CustomerMessage.sendMessageByCustomerList },
  { method: 'POST', path: '/CustomerMessage/findTemplates', config: CustomerMessage.findTemplates },
  { method: 'POST', path: '/CustomerMessage/sendTestEmail', config: CustomerMessage.sendTestEmail },
  { method: 'POST', path: '/CustomerMessage/sendTestSMS', config: CustomerMessage.sendTestSMS },
  { method: 'POST', path: '/CustomerMessage/sendTestZNS', config: CustomerMessage.sendTestZNS },
  { method: 'POST', path: '/CustomerMessage/receiveVMGResult', config: CustomerMessage.receiveVMGResult },
  { method: 'POST', path: '/CustomerMessage/user/getListMessage', config: CustomerMessage.userGetListMessage },

  { method: 'POST', path: '/CustomerMessage/advanceUser/sendSMS', config: CustomerMessage.advanceUserSendSMS },
  { method: 'POST', path: '/CustomerMessage/advanceUser/updateById', config: CustomerMessage.advanceUserUpdateById },
  { method: 'POST', path: '/CustomerMessage/advanceUser/getDetail', config: CustomerMessage.advanceUserGetDetail },
  { method: 'POST', path: '/CustomerMessage/advanceUser/sendMessageByFilter', config: CustomerMessage.advanceUserSendMessageByFilter },
  { method: 'POST', path: '/CustomerMessage/advanceUser/findTemplates', config: CustomerMessage.advanceUserFindTemplates },
  { method: 'POST', path: '/CustomerMessage/advanceUser/sendMessageByCustomerList', config: CustomerMessage.advanceUserSendMessage },
  { method: 'POST', path: '/CustomerMessage/advanceUser/getList', config: CustomerMessage.advanceUserGetList },
];
