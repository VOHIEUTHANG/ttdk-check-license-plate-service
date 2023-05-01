module.exports = {
  REVIEW_TYPES: {
    NO_TRAFFIC_JAMS: 1, //'Không bị kẹt xe khi đăng kiểm'
    CONVENIENT: 2, // Rất tiện lợi khi đăng kiểm phương tiện
    NO_LONG_AWAIT: 3, // Tôi không phải chờ đợi lâu, trung tâm xử lý đúng thời gian
    WAIT_A_LONG_TIME: 4, // Tôi vẫn phải chờ đợi rất lâu để đến lượt, trung tâm không xử lý đúng khung giờ đã đặt trước
    CAN_NOT_CHECK: 5, // Tôi không thể đăng kiểm được
    OTHER_COMMENTS: 10, // Ý kiển khác
  },
  CUSTOMER_REVIEW_ERRORS: {
    INVALID_SCHEDULE: 'INVALID_SCHEDULE',
    DUPLICATE_REVIEW: 'DUPLICATE_REVIEW',
  },
};
