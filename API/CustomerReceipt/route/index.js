const CustomerReceiptRoute = require('./CustomerReceiptRoute');

module.exports = [
  { method: 'POST', path: '/CustomerReceiptRoute/insert', config: CustomerReceiptRoute.insert },
  { method: 'POST', path: '/CustomerReceiptRoute/find', config: CustomerReceiptRoute.find },
  { method: 'POST', path: '/CustomerReceiptRoute/findById', config: CustomerReceiptRoute.findById },
  { method: 'POST', path: '/CustomerReceiptRoute/updateById', config: CustomerReceiptRoute.updateById },
  { method: 'POST', path: '/CustomerReceiptRoute/deleteById', config: CustomerReceiptRoute.deleteById },
  { method: 'POST', path: '/CustomerReceiptRoute/user/userGetList', config: CustomerReceiptRoute.userGetList },
  { method: 'POST', path: '/CustomerReceiptRoute/user/getDetail', config: CustomerReceiptRoute.getDetailById },
  { method: 'POST', path: '/CustomerReceiptRoute/user/getDetailByExternalRef', config: CustomerReceiptRoute.getDetailByExternalRef },
  { method: 'POST', path: '/CustomerReceiptRoute/user/updateById', config: CustomerReceiptRoute.userUpdateById },
  { method: 'POST', path: '/CustomerReceiptRoute/user/userCreate', config: CustomerReceiptRoute.userCreateReceipt },

  { method: 'POST', path: '/CustomerReceiptRoute/advanceUser/updateById', config: CustomerReceiptRoute.advanceUserUpdateById },
  { method: 'POST', path: '/CustomerReceiptRoute/advanceUser/getDetailByRef', config: CustomerReceiptRoute.advanceUserGetDetailByRef },
  { method: 'POST', path: '/CustomerReceiptRoute/advanceUser/getDetail', config: CustomerReceiptRoute.advanceUserGetDetail },
  { method: 'POST', path: '/CustomerReceiptRoute/advanceUser/userCreate', config: CustomerReceiptRoute.advanceUserCreateReceipt },
  { method: 'POST', path: '/CustomerReceiptRoute/advanceUser/userGetList', config: CustomerReceiptRoute.advanceUserGetList },
];
