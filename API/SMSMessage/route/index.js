const SMSMessageRoute = require('./SMSMessageRoute');

module.exports = [
  // { method: 'POST', path: '/SMSMessage/insert', config: SMSMessageRoute.insert },
  // { method: 'POST', path: '/SMSMessage/find', config: SMSMessageRoute.find },
  // { method: 'POST', path: '/SMSMessage/findById', config: SMSMessageRoute.findById },
  // { method: 'POST', path: '/SMSMessage/updateById', config: SMSMessageRoute.updateById },

  { method: 'POST', path: '/SMSMessage/robot/insert', config: SMSMessageRoute.robotInsert },
  { method: 'GET', path: '/SMSMessage/robot/insert', config: SMSMessageRoute.robotInsert },
];
