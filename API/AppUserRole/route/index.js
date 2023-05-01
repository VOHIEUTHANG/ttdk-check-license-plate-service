const AppUserRole = require('./AppUserRoleRoute');

module.exports = [
  { method: 'POST', path: '/AppUserRole/find', config: AppUserRole.find },
  { method: 'POST', path: '/AppUserRole/advanceUser/find', config: AppUserRole.advanceUserGetList },
];
