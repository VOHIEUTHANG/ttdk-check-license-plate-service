const MessageTemplate = require('./MessageTemplateRoute');

module.exports = [
  { method: 'POST', path: '/MessageTemplate/insert', config: MessageTemplate.insert },
  { method: 'POST', path: '/MessageTemplate/find', config: MessageTemplate.find },
  { method: 'POST', path: '/MessageTemplate/findById', config: MessageTemplate.findById },
  { method: 'POST', path: '/MessageTemplate/updateById', config: MessageTemplate.updateById },
  { method: 'POST', path: '/MessageTemplate/deleteById', config: MessageTemplate.deleteById },
  { method: 'POST', path: '/MessageTemplate/user/getList', config: MessageTemplate.userGetList },
];
