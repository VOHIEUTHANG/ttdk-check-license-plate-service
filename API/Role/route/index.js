const Role = require('./RoleRoute');

module.exports = [
  { method: 'POST', path: '/Role/insert', config: Role.insert },
  { method: 'POST', path: '/Role/find', config: Role.find },
  // { method: 'POST', path: '/Role/getDetailById', config: Role.findById },
  { method: 'POST', path: '/Role/updateById', config: Role.updateById },
];
