/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  STATION_STATUS: {
    ACTIVE: 1,
    BLOCK: 0,
  },
  AVAILABLE_STATUS: {
    UNAVAILABLE: 0,
    AVAILABLE: 1,
    DEFAULT: 2,
  },
  STATION_TYPE: {
    EXTERNAL: 1,
    INTERNAL: 2,
  },
  STATION_CONTACT_STATUS: {
    NEW: 1, //Mới
    PROCESSING: 10, //Đang xử lý
    PENDING: 20, //Chưa hoàn tất hợp đồng
    COMPLETED: 30, //Đã hoàn tất hợp đồng
    CANCELED: 40, //Không ký hợp đồng
    DESTROYED: 50, //Đã huỷ hợp đồng
  },
  VERIFY_STATUS: {
    // Chưa đăng ký với bộ công thương
    NOT_REGISTER: 0,

    // Đã đăng ký với bộ công thương
    REGISTER: 1,

    // Đã đăng ký và được xác nhận bởi bộ công thương
    VERIFY: 2,
  },
  STATION_ERROR: {
    INVALID_STATION: 'INVALID_STATION', //không tìm thấy trạm
    WRONG_BOOKING_CONFIG: 'WRONG_BOOKING_CONFIG', //Tìm lịch hẹn không phù hợp
  },
  BOOKING_STATUS: {
    AVAILABLE: 1,
    FULL: 0,
  },
  BOOKING_ENABLE: 1,
  BOOKING_ON_CURRENT_DATE: {
    ENABLE: 1,
    DISABLE: 0,
  },
  BOOKING_OVER_LIMIT: {
    ENABLE: 1,
    DISABLE: 0,
  },
  AUTO_CONFIRM_SCHEDULE: {
    ENABLE: 1,
    DISABLE: 0,
  },
};
