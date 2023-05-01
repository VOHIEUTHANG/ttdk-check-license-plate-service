const PaymentQR = require('./PaymentQRRoute');

module.exports = [
  { method: 'POST', path: '/PaymentQR/user/create', config: PaymentQR.userCreate },
  { method: 'POST', path: '/PaymentQR/user/deleteById', config: PaymentQR.userDeleteById },
  { method: 'POST', path: '/PaymentQR/user/updateById', config: PaymentQR.userUpdateById },
  { method: 'POST', path: '/PaymentQR/user/getList', config: PaymentQR.getList },
  { method: 'POST', path: '/PaymentQR/user/getDetailById', config: PaymentQR.getDetailById },
  { method: 'POST', path: '/PaymentQR/user/createQRByTnx', config: PaymentQR.createQRByTnx },
  { method: 'POST', path: '/PaymentQR/vnpay/receivePaymentVNPAY', config: PaymentQR.receivePaymentVNPAY },

  { method: 'POST', path: '/PaymentQR/advanceUser/getDetailById', config: PaymentQR.advanceUserGetDetail },
  { method: 'POST', path: '/PaymentQR/advanceUser/deleteById', config: PaymentQR.advanceUserDeleteById },
  { method: 'POST', path: '/PaymentQR/advanceUser/create', config: PaymentQR.advanceUserCreate },
  { method: 'POST', path: '/PaymentQR/advanceUser/getList', config: PaymentQR.advanceUserGetList },
];
