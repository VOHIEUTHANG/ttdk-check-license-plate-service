const Staff = require('./StaffRoute');

module.exports = [
  { method: 'POST', path: '/Staff/loginStaff', config: Staff.loginStaff },
  { method: 'POST', path: '/Staff/registerStaff', config: Staff.registerStaff },
  { method: 'POST', path: '/Staff/updateById', config: Staff.updateById },
  { method: 'POST', path: '/Staff/find', config: Staff.find },
  { method: 'POST', path: '/Staff/getDetailStaff', config: Staff.findById },
  { method: 'POST', path: '/Staff/resetPasswordStaff', config: Staff.resetPasswordStaff },
  { method: 'POST', path: '/Staff/changePasswordStaff', config: Staff.changePasswordStaff },
  { method: 'POST', path: '/Staff/changePasswordUser', config: Staff.changePasswordUserStaff },
];
