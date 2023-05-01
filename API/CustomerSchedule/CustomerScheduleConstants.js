/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  BOOK_VIEW_STATUS: {
    NORMAL: 0,
    HOT: 1,
  },
  BOOK_UPDATE_STATUS: {
    UPDATING: 0,
    COMPLETE: 1,
  },
  SCHEDULE_STATUS: {
    NEW: 0,
    CONFIRMED: 10,
    CANCELED: 20,
    CLOSED: 30,
  },
  SCHEDULE_ERROR: {
    INVALID_STATION: 'INVALID_STATION', //Thiếu thông tin trạm
    INVALID_BOOKING_CONFIG: 'INVALID_BOOKING_CONFIG', //Lịch hẹn đã đầy
    BOOKING_MAX_LIMITED_BY_CONFIG: 'BOOKING_MAX_LIMITED_BY_CONFIG', //Lịch hẹn không được vượt giới hạn
    BOOKING_MAX_LIMITED: 'BOOKING_MAX_LIMITED', //Lịch hẹn đạt số lượng tối đa
    UNCONFIRMED_BOOKING_EXISTED: 'UNCONFIRMED_BOOKING_EXISTED', //Có lịch hẹn chưa được xác nhận, không được đặt thêm
    INVALID_DATE: 'INVALID_DATE', //Ngày hẹn không hợp lệ
    BLOCK_USER_BOOKING_SCHEDULE: 'BLOCK_USER_BOOKING_SCHEDULE',
    BOOKING_ON_DAY_OFF: 'BOOKING_ON_DAY_OFF', //Ngày hẹn không đúng
    BOOKING_ON_SUNDAY: 'BOOKING_ON_SUNDAY', //Sai thông tin ngày hẹn
    INVALID_PLATE_NUMBER: 'INVALID_PLATE_NUMBER', // Biển số xe không hợp lệ
    INVALID_REQUEST: 'INVALID_REQUEST', //Đặt lịch thất bại
    MAX_LIMIT_SCHEDULE_BY_USER: 'MAX_LIMIT_SCHEDULE_BY_USER', //Số lượng lịch hẹn của người dùng quá giới hạn
    MAX_LIMIT_SCHEDULE_BY_PHONE: 'MAX_LIMIT_SCHEDULE_BY_PHONE', //Số lượng lịch hẹn của số điện thoại quá giới hạn
    MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER: 'MAX_LIMIT_SCHEDULE_BY_PLATE_NUMBER', //Số lượng lịch hẹn của biển số xe quá giới hạn
    ALREADY_CANCEL: 'ALREADY_CANCEL', //Lịch hẹn đã hủy trước đó
    CONFIRMED_BY_STATION_STAFF: 'CONFIRMED_BY_STATION_STAFF', //Đã được trung tâm xác nhận
  },
  LICENSE_PLATE_COLOR: {
    WHITE: 1,
    BLUE: 2,
    YELLOW: 3,
    RED: 4,
  },
  VEHICLE_TYPE: {
    CAR: 1,
    OTHER: 10,
    RO_MOOC: 20,
  },
  SCHEDULE_TIME_STATUS: {
    AVALIABLE: 1,
    FULL: 0,
  },
  SCHEDULE_CACHE_KEYS: {
    SCHEDULE_COUNT_BY_STATION_ID: 'SCHEDULE_COUNT_BY_STATION_ID',
    SCHEDULE_COUNT_BY_USER_ID: 'SCHEDULE_COUNT_BY_USER_ID',
    SCHEDULE_COUNT_BY_PHONE: 'SCHEDULE_COUNT_BY_PHONE',
    SCHEDULE_COUNT_BY_PLATE_NUMBER: 'SCHEDULE_COUNT_BY_PLATE_NUMBER',
    SUCCESS_SCHEDULE_COUNT_BY_STATION: 'successBookingsCount_{stationsId}_{scheduleDate}_{vehicleType}',
  },
  SCHEDULE_TYPE: {
    VEHICLE_INSPECTION: 1, // đăng kiểm xe
    NEW_VEHICLE_INSPECTION: 2, // đăng kiểm xe mới
    REGISTER_NEW_VEHICLE: 3, // nộp hồ sơ xe mới
  },
  PERFORMER_TYPE: {
    ADMIN: 1, // quan tri vien
    STATION_STAFF: 2, // nhan vien tram
    CUSTOMER: 3, // khach hang
    AUTO: 4, // tu dong
  },
};
