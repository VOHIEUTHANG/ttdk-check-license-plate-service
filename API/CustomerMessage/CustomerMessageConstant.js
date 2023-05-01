/* Copyright (c) 2022 TORITI LIMITED 2022 */

module.exports = {
  MESSAGE_CATEGORY: {
    SMS: 'SMS',
    EMAIL: 'Email',
    ZNS: 'ZNS',
  },
  MESSAGE_STATUS: {
    NEW: 'New',
    SENDING: 'Sending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
    WAITING: 'Waiting',
  },
  MESSAGE_SEND_STATUS: {
    NEW: 'New', //đang chờ
    SENDING: 'Sending', //đang gửi
    COMPLETED: 'Completed', //khách hàng đã nhận
    FAILED: 'Failed', // gửi thất bại
    CANCELED: 'Canceled', // hủy
  },
  SMS_PROVIDER: {
    VIVAS: 'VIVAS',
    VIETTEL: 'VIETTEL',
    VMG: 'VMG',
  },
  EMAIL_PROVIDER: {
    GMAIL: 'GMAIL',
    CUSTOM: 'CUSTOM',
  },
  MESSAGE_PRICES: {
    SMS: 850,
    EMAIL: 0,
  },
};
