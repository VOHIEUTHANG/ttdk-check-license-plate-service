/* Copyright (c) 2022 TORITI LIMITED 2022 */

const moment = require('moment');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const SMS_API_URL = process.env.SMS_API_URL || 'https://sms.vivas.vn/SMSBNAPINEW';
const SMS_API_USERNAME = process.env.SMS_API_USERNAME || 'vtss';
const SMS_API_PASSWORD = process.env.SMS_API_PASSWORD || '1708smsbn';
const SMS_API_BRAND = process.env.SMS_API_BRAND || 'KiemDinhOto';

async function checkSMS(smsId) {
  let body = {
    username: SMS_API_USERNAME,
    password: SMS_API_PASSWORD,
    brandname: SMS_API_BRAND,
    textmsg: 'Hello',
    sendtime: '20190219105500',
    isunicode: 0,
    listmsisdn: '84391222xxx;84351222xxx',
  };
  return new Promise((resolve, reject) => {
    chai
      .request(SMS_API_URL)
      .post(`/AppUsers/registerUser`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        checkResponseStatus(res, 200);
        token = 'Bearer ' + res.body.data.token;
        done();
      });
  });
}

async function sendSMS(message, phoneNumberList, customClient) {
  // username String Tên đăng nhập hệ thống Có phân biệt chữ hoa chữ thường
  // password String Mật khẩu đăng nhập
  // brandname String Tên Brandname Có phân biệt chữ hoa chữ thường
  // textmsg String Nội dung tin nhắn
  // sendtime String Thời gian gửi tin Theo format yyyyMMddHHmmss
  // isunicode Number Tin nhắn Unicode (0: nếu là tin nhắn không dấu, 8: nếu là tin nhắn unicode)
  // listmsisdn String Danh sách số điện thoại
  // nhận SMS Format bắt đầu là 84 hoặc 0. Nếu bắt đầu 0, hệ thống sẽ tự động đổi thành 84 trước khi xử lý dữ liệu. Danh sách SDT cách nhau bởi dấu
  // chấm phẩy “;” và không có khoảng trắng
  let sendTime = moment().format('YYYYMMDDhhmmss');

  let _smsApiUrl = SMS_API_URL;
  let _smsAuth = {
    username: SMS_API_USERNAME,
    password: SMS_API_PASSWORD,
    brandname: SMS_API_BRAND,
  };

  if (customClient) {
    _smsAuth = {
      username: customClient.smsApiUsername,
      password: customClient.smsApiPassword,
      brandname: customClient.smsAPIBrand,
    };
  }

  let body = {
    ..._smsAuth,
    textmsg: message,
    sendtime: sendTime,
    isunicode: 0,
    listmsisdn: phoneNumberList.join(';'),
  };

  return new Promise((resolve, reject) => {
    chai
      .request(_smsApiUrl)
      .post(`/sendsms`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        if (res) {
          try {
            let result = JSON.parse(res.text);
            console.info(`sendSMS ${phoneNumberList.join(';')}`);
            console.info(`${res.text}`);
            resolve(result);
          } catch (error) {
            console.error('============ERROR==========');
            console.error(`sendSMS ${phoneNumberList.join(';')}`);
            console.error(res.text);
            console.error(res.text);
            resolve(undefined);
          }
        } else {
          console.info(`request sendSMS error`);
          resolve(undefined);
        }
      });
  });
}

async function createClient(smsApiUrl, smsApiUsername, smsApiPassword, smsAPIBrand) {
  const invalidClient = undefined;
  if (smsApiUsername === undefined || smsApiUsername === null || smsApiUsername.trim() === '') {
    console.error(`invalid smsApiUsername ${smsApiUsername}`);
    return invalidClient;
  }

  if (smsApiPassword === undefined || smsApiPassword === null || smsApiPassword.trim() === '') {
    console.error(`invalid smsApiPassword ${smsApiPassword}`);
    return invalidClient;
  }

  if (smsAPIBrand === undefined || smsAPIBrand === null || smsAPIBrand.trim() === '') {
    console.error(`invalid smsAPIBrand ${smsAPIBrand}`);
    return invalidClient;
  }

  const newClient = {
    smsApiUsername: smsApiUsername,
    smsApiPassword: smsApiPassword,
    smsAPIBrand: smsAPIBrand,
  };
  return newClient;
}

async function checkSMSStatusById(smsId, customClient) {
  let body = {
    username: SMS_API_USERNAME,
    password: SMS_API_PASSWORD,
    transactionid: smsId,
  };

  if (customClient) {
    body = {
      username: customClient.smsApiUsername,
      password: customClient.smsApiPassword,
      transactionid: smsId,
    };
  }
  return new Promise((resolve, reject) => {
    chai
      .request(SMS_API_URL)
      .post(`/verifysms`)
      .send(body)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        if (res) {
          try {
            let result = JSON.parse(res.text);
            console.log(`${res.text}`);
            resolve(result);
          } catch (error) {
            console.error('============ERROR==========');
            console.error(res.text);
            resolve(undefined);
          }
        } else {
          console.info(`request sendSMS error`);
          resolve(undefined);
        }
      });
  });
}

const responseSMSVivas = {
  0: {
    errorMessage: '0: Request được tiếp nhận thành công',
  },
  1: {
    errorMessage: '1: Tài khoản đăng nhập không hợp lệ',
  },
  3: {
    errorMessage: '3: Request bị từ chối vì Brandname không tồn tại hoặc không thuộc sở hữu',
  },
  4: {
    errorMessage: '4: Request bị từ chối vì nội dung tin nhắn không phù hợp với template hoặc chưa khai báo template',
  },
  8: {
    errorMessage: '8: Request bị từ chối vì vượt hạn mức gửi tin',
  },
  10: {
    errorMessage: '10: Request bị từ chối vì thiếu thời gian gửi',
  },
  11: {
    errorMessage: '11: Request bị từ chối vì chứa từ khóa chặn',
  },
  13: {
    errorMessage: '13: Request bị từ chối vì nội dung vượt quá độ dài quy định',
  },
  14: {
    errorMessage: '14: Request bị từ chối vì chứa số điện thoại sai',
  },
  15: {
    errorMessage: '15: Lỗi chưa đăng ký hạn mức gói tin trên hệ thống của Vivas (liên hệ admin để giải quyết)',
  },
  16: {
    errorMessage: '16: Lỗi chưa đăng ký đường gửi tin sang nhà mạng (liên hệ admin để giải quyết)',
  },
  98: {
    errorMessage: '98: Lỗi sai protocol gọi request',
  },
  99: {
    errorMessage: '99: Lỗi thiếu tham số gọi request',
  },
  100: {
    errorMessage: '100: Lỗi chung hệ thống',
  },
};

const responseReceiveValidSMSVivas = {
  0: {
    errorMessage: '0: Thành công, Gửi thành công đến Gateway',
  },
  1: {
    errorMessage: '1: Chờ, Đang chờ xử lý',
  },
  2: {
    errorMessage: '2: Chờ, Đang được gửi',
  },
  3: {
    errorMessage: '3: Lỗi, Gửi thất bại',
  },
  4: {
    errorMessage: '4: Lỗi, Bị hủy',
  },
  5: {
    errorMessage: '5: Chờ, Bị Gateway từ chối, chờ gửi lạ',
  },
  6: {
    errorMessage: '6: Đã gửi, không nhận được phản hồi từ Gateway',
  },
  7: {
    errorMessage: '7: Lỗi, Tin nhắn không hợp lệ',
  },
  8: {
    errorMessage: '8: Lỗi, Tin nhắn vượt hạn mức',
  },
  9: {
    errorMessage: '9: Lỗi, Tin nhắn không tìm thấy gateway để gửi',
  },
  10: {
    errorMessage: '10: Lỗi khác',
  },
};

module.exports = {
  sendSMS,
  checkSMSStatusById,
  createClient,
  responseSMSVivas,
  responseReceiveValidSMSVivas,
};
