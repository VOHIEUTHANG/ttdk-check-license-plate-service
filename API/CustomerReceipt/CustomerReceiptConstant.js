/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';

module.exports = {
  CUSTOMER_RECEIPT_STATUS: {
    NEW: 'New',
    PROCESSING: 'Processing',
    PENDING: 'Pending',
    FAILED: 'Failed',
    SUCCESS: 'Success',
    CANCELED: 'Canceled',
  },
  PAYMENT_METHOD: {
    DIRECT: 'direct', // tiền mặt
    ATM: 'atm', // atm/bank
    VNPAY: 'vnpay', // vnpay
    CREDIT_CARD: 'creditcard', // visa
  },
};
