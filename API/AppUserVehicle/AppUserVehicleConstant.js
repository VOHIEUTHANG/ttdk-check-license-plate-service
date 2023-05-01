/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

module.exports = {
  USER_VEHICLE_ERROR: {
    DUPLICATE_VEHICLE: 'DUPLICATE_VEHICLE', //Biển số xe đã được đăng ký
    VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND', //Không tìm thấy thông tin phương tiện
    INVALID_PLATE_NUMBER: 'INVALID_PLATE_NUMBER', //Biển số xe không hợp lệ
    MAX_OWNER_VEHICLE: 'MAX_OWNER_VEHICLE', //Vượt quá số lượng xe cho phép
  },
  VEHICLE_PLATE_TYPE: {
    WHITE: 'WHITE', //Trắng
    YELLOW: 'YELLOW', //Vàng
    BLUE: 'BLUE', //Xanh
    RED: 'RED', //Đỏ
  },
  VEHICLE_TYPE: {
    CAR: 1,
    OTHER: 10,
    RO_MOOC: 20,
  },
};
