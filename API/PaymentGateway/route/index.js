const PaymentGateway = require('./PaymentGatewayRoute');

module.exports = [
  { method: 'POST', path: '/PaymentGateway/vnpay/makePaymentRequestVNPAY', config: PaymentGateway.makePaymentRequestVNPAY },
  { method: 'GET', path: '/PaymentGateway/vnpay/receivePaymentVNPAY', config: PaymentGateway.receivePaymentVNPAY },

  { method: 'POST', path: '/PaymentGateway/vnpay/advanceUser/makePaymentRequestVNPAY', config: PaymentGateway.advanceUserMakePaymentRequestVNPAY },
];
