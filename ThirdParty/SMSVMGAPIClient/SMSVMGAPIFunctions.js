/* Copyright (c) 2022 TORITI LIMITED 2022 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const moment = require('moment');
const { reportToTelegram } = require('../TelegramBot/TelegramBotFunctions');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

const VMG_HOST_URL = process.env.VMG_HOST_URL || 'https://api.brandsms.vn';
const VMG_TOKEN =
  process.env.VMG_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c24iOiJ2dHNzIiwic2lkIjoiOWY3ZWFhYjItMTE2Ni00M2M5LWFjZjYtYjljYWJjZjNjYTg1Iiwib2J0IjoiIiwib2JqIjoiIiwibmJmIjoxNjU1NDM4OTgzLCJleHAiOjE2NTU0NDI1ODMsImlhdCI6MTY1NTQzODk4M30.iQ9FdtyX2R-bntxDXsyKsMHmbpkmdb3YZSp1730trcU';
const NEW_VMG_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c24iOiJ2dHNzIiwic2lkIjoiOWY3ZWFhYjItMTE2Ni00M2M5LWFjZjYtYjljYWJjZjNjYTg1Iiwib2J0IjoiIiwib2JqIjoiIiwibmJmIjoxNjc5OTAzMDY1LCJleHAiOjE2Nzk5MDY2NjUsImlhdCI6MTY3OTkwMzA2NX0.1HHds_woXRoOblVUV_AOGW32qeDVUEMjiwFePC8eZQg';
const VMG_BRANDNAME = process.env.VMG_BRANDNAME || 'TTDK.COM.VN';
const REPORT_URL_SMS_VMG = process.env.REPORT_URL_SMS_VMG || 'http://report-api.brandsms.vn/api';
const VMG_OTT_HOST_URL = process.env.VMG_OTT_HOST_URL || 'https://api-ott.brandsms.vn';

// sendSMSMessage('0343902960', 'TTDK 2914D kinh bao: Xe 30A999999 het han kiem dinh ngay 2022/04/05. Quy khach can ho tro vui long lien he 0343902960');
// "000" NoError Không lỗi
// "001" InputNotValid
// Có lỗi giá trị không phù hợp với
// kiểu dữ liệu mô tả
// Kiểm tra dữ liệu
// nhập
// "100" TokenNotValid Token không hợp lệ
// "101" UserIsLock Tài khoản bị khóa
// "102" UserNotValid Tài khoản không đúng
// "103" UserNotRoleValid Tài khoản không có quyền
// "304" DuplicateMessage
// Tin bị lặp trong 5 phút hoặc trùng
// requestID trong 1h
// UM.API.V3: Tài liệu Hướng dẫn kết nối API SMS Brandname v 1.5
// Internal Use 41/42
// "904" BrandnameNotValid Brandname không hợp lệ
// "002" MessageTypeNotValid Loại tin không hợp lệ
// "003" MessageTypeNotAllow Loại tin không được phép gửi
// "005" ReceiverNotValid Số điện thoại nhận không hợp lệ
// "006" TelcoNotValid Mã nhà mạng không hợp lệ
// "007" ContentContainsBlockedWord Nội dung chứa từ khóa bị chặn
// "008" ContentContainsUnicode Nội dung chứa ký tự unicode
// "009" ContentNotValidateGsm0338 Nội dung có ký tự không hợp lệ
// "010" LengthOfContentNotValid Độ dài nội dung không hợp lệ
// "011" NotMatchTemplate
// Nội dung không khớp với mẫu
// khai
// “011” NotMatchTemplatePriority
// Nội dung không khớp với mẫu tin
// ưu tiên (OTP)
// "012" TelcoNotAllow
// Tài khoản không được phân gửi
// tới nhà mạng
// "013" MsisdnInBlacklist
// Số điện thoại nhận trong danh
// sách cấm gửi
// "014" AccountNotEnoughToPay
// Tài khoản không đủ tiền để chi
// trả
// "015" AccountNotEnoughQuota Tài khoảng không đủ tin để gửi
// "016" ScheduledNotValid Thời gian gửi tin không hợp lệ
// "017" OrderCodeNotValid Mã order không hợp lệ
// "018" PackageCodeNotValid Mã gói không hợp lệ
// "019" MsisdnNotValid
// Số điện thoại không hợp lệ đói
// với hàm gửi tin CSKH
// "019" ReceiverNotEnough
// Số điện thoại nhận không đủ đối
// với hàm gửi tin QC
// "020" TelcoFilter
// Số điện thoại không trong danh
// sách nhà mạng được lọc
// "021" BlockingTimeAdv
// Gửi vào thời điểm bị cấm gửi
// quảng cáo
// "022" FormatOfContentNotValid Định dạnh nội dung không hợp lệ
// "024" OverMaxMT
// Số MT vượt quá giới hạn
// maxMt
// "025" CantConvertToNotUnicode
// Không thể Convert sang ký tự
// NotUnicode (Áp dụng trường hợp
// sử dụng tham số useUnicode(2))
// "801" TemplateNotSet Mẫu tin chưa được thiết lập
// Liên hệ với VMG
// "802" AccountNotSetProfile
// Tài khoản chưa được thiết lập
// profile
// "803" AccountNotSetPrice Tài khoản chưa được thiết lập giá
// UM.API.V3: Tài liệu Hướng dẫn kết nối API SMS Brandname v 1.5
// Internal Use 42/42
// "804" RouterNotAvaiable Đường gửi tin chưa được thiết lập
// "805" RouterNotSuportUnicode
// Đường gửi tin không hỗ trợ
// unicode
// "999" ErrorOnServer Lỗi khác trên hệ thống
async function sendSMSMessage(phoneNumber, messageContent, customConfig, trackId) {
  console.info(`VMG sendSMSMessage ${phoneNumber} - ${trackId} - ${messageContent}`);
  let requestUrl = VMG_HOST_URL;
  let requestToken = VMG_TOKEN;
  let requestBrandname = VMG_BRANDNAME;

  if (customConfig) {
    requestToken = customConfig.smsApiToken;
    requestBrandname = customConfig.smsAPIBrand;
  }

  let body = {
    to: phoneNumber,
    telco: '', //Mã telco theo bảng mã đi kèm. Nếu có mã telco, hệ thống sẽ sử dụng để gửi tới telco này Để trống trường này thì hệ thống sẽ tự xác định theo dữ liệu chuyển mạng giữ số của Cục Viễn Thông
    type: 1, //Loại tin cần gửi(1: Chăm sóc khách hàng)
    from: requestBrandname, //Brandname dùng để gửi tin
    message: messageContent, //Nội dung tin cần gửi
    scheduled: '', //Gửi tin đặt lịch - (“scheduled”:””), tin sẽ được gửi luôn sau khi VMG nhận thành công.
    requestId: trackId ? trackId : '', //ID định danh của đối tác, sẽ gửi lại trong nội dung phản hồi hoặc để trống(“requestId”,””) Nếu truyền tham số requestID, hệ thống sẽ check tham số requestID trong 1h (60 ph )
    useUnicode: 0, //Gửi tin notUnicode(0), Nội dung Unicode(1), tự động chuyển đổi nội dung Unicode sang notUnicode (2)
    ext: {}, //copy,
  };

  return new Promise((resolve, reject) => {
    chai
      .request(requestUrl)
      .post('/api/SMSBrandname/SendSMS')
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('token', requestToken)
      .send(JSON.stringify(body))
      .end((err, res) => {
        if (err) {
          console.error(err);
          resolve(undefined);
          return;
        }
        if (res && res.body) {
          console.info(res.body);
          let result = res.body;
          if (Object.keys(result).length === 0 && result.constructor === Object) {
            resolve(undefined);
          } else {
            resolve(result);
          }
        } else {
          resolve(undefined);
        }
      });
  });
}

const responseSMSVMG = {
  '001': {
    errorMessage: '- Có lỗi giá trị không phù hợp với kiểu dữ liệu mô tả. Kiểm tra dữ liệu nhập',
  },
  100: {
    errorMessage: '- TokenNotValid Token không hợp lệ',
  },
  101: {
    errorMessage: '- UserIsLock Tài khoản bị khóa',
  },
  102: {
    errorMessage: '- UserNotValid Tài khoản không đúng',
  },
  103: {
    errorMessage: '- UserNotRoleValid Tài khoản không có quyền',
  },
  304: {
    errorMessage: '- DuplicateMessage Tin bị lặp trong 5 phút hoặc trùng requestID trong 1h',
  },
  904: {
    errorMessage: '- BrandnameNotValid Brandname không hợp lệ',
  },
  '002': {
    errorMessage: '- MessageTypeNotValid Loại tin không hợp lệ',
  },
  '003': {
    errorMessage: '- MessageTypeNotAllow Loại tin không được phép gửi',
  },
  '005': {
    errorMessage: '- ReceiverNotValid Số điện thoại nhận không hợp lệ',
  },
  '006': {
    errorMessage: '- TelcoNotValid Mã nhà mạng không hợp lệ',
  },
  '007': {
    errorMessage: '- ContentContainsBlockedWord Nội dung chứa từ khóa bị chặn',
  },
  '008': {
    errorMessage: '- ContentContainsUnicode Nội dung chứa ký tự unicode',
  },
  '009': {
    errorMessage: '- ContentNotValidateGsm0338 Nội dung có ký tự không hợp lệ',
  },
  '008': {
    errorMessage: '- ContentContainsUnicode Nội dung chứa ký tự unicode',
  },
  '010': {
    errorMessage: '- LengthOfContentNotValid Độ dài nội dung không hợp lệ',
  },
  '011': {
    errorMessage: '- NotMatchTemplate Nội dung không khớp với mẫu khai - NotMatchTemplatePriority Nội dung không khớp với mẫu tin ưu tiên (OTP)',
  },
  '012': {
    errorMessage: '- TelcoNotAllow Tài khoản không được phân gửi tới nhà mạng',
  },
  '013': {
    errorMessage: '- MsisdnInBlacklist Số điện thoại nhận trong danh sách cấm gửi',
  },
  '014': {
    errorMessage: '- AccountNotEnoughToPay Tài khoản không đủ tiền để chi trả',
  },
  '015': {
    errorMessage: '- AccountNotEnoughQuota Tài khoảng không đủ tin để gửi',
  },
  '016': {
    errorMessage: '- ScheduledNotValid Thời gian gửi tin không hợp lệ',
  },
  '017': {
    errorMessage: '- OrderCodeNotValid Mã order không hợp lệ',
  },
  '018': {
    errorMessage: '- PackageCodeNotValid Mã gói không hợp lệ',
  },
  '019': {
    errorMessage:
      '- MsisdnNotValid Số điện thoại không hợp lệ đói với hàm gửi tin CSKH - ReceiverNotEnough Số điện thoại nhận không đủ đối với hàm gửi tin QC',
  },
  '020': {
    errorMessage: '- TelcoFilter Số điện thoại không trong danh sách nhà mạng được lọc',
  },
  '021': {
    errorMessage: '- BlockingTimeAdv Gửi vào thời điểm bị cấm gửi quảng cáo',
  },
  '022': {
    errorMessage: '- FormatOfContentNotValid Định dạnh nội dung không hợp lệ',
  },
  '024': {
    errorMessage: '- OverMaxMT Số MT vượt quá giới hạn maxMt',
  },
  '025': {
    errorMessage: '- CantConvertToNotUnicode Không thể Convert sang ký tự',
  },
  801: {
    errorMessage: '- TemplateNotSet Mẫu tin chưa được thiết lập',
  },
  802: {
    errorMessage: '- AccountNotSetProfile Tài khoản chưa được thiết lập profile',
  },
  803: {
    errorMessage: '- AccountNotSetPrice Tài khoản chưa được thiết lập giá',
  },
  804: {
    errorMessage: '- RouterNotAvaiable Đường gửi tin chưa được thiết lập',
  },
  805: {
    errorMessage: '- RouterNotSuportUnicode Đường gửi tin không hỗ trợ unicode',
  },
  999: {
    errorMessage: '- ErrorOnServer Lỗi khác trên hệ thống',
  },
  '000': {
    errorMessage: '- NoError Không lỗi',
  },
};

async function checkSMSStatusById(referentId, customConfig, time = '') {
  if (referentId == undefined) {
    return;
  }

  let requestToken = VMG_TOKEN;

  if (customConfig) {
    requestToken = customConfig.smsApiToken;
  }

  let body = {
    referentId: referentId,
    sendDate: '11/11/2020 12:00',
  };

  return new Promise((resolve, reject) => {
    chai
      .request(REPORT_URL_SMS_VMG)
      .post('/Brandname/ReportDetailSend')
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('token', requestToken)
      .send(JSON.stringify(body))
      .end((err, res) => {
        if (err) {
          console.error(err);
          resolve(undefined);
          return;
        }

        if (res && res.body) {
          console.info(res.body);
          let result = res.body;
          if (Object.keys(result).length === 0 && result.constructor === Object) {
            resolve(undefined);
          } else {
            resolve(result);
          }
        } else {
          resolve(undefined);
        }
      });
  });
}

async function createClient(smsApiUrl, smsApiToken, smsAPIBrand) {
  const invalidClient = undefined;

  if (smsApiToken === undefined || smsApiToken === null || smsApiToken.trim() === '') {
    console.error(`invalid smsApiToken ${smsApiToken}`);
    return invalidClient;
  }

  if (smsAPIBrand === undefined || smsAPIBrand === null || smsAPIBrand.trim() === '') {
    console.error(`invalid smsAPIBrand ${smsAPIBrand}`);
    return invalidClient;
  }

  const newClient = {
    smsApiToken: smsApiToken,
    smsAPIBrand: smsAPIBrand,
  };
  return newClient;
}

// checkPhoneNumber('0343902960');
async function checkPhoneNumber(phoneNumber) {
  console.info(`check phone number use VMG API ${phoneNumber}`);
  console.log(NEW_VMG_TOKEN);
  return new Promise((resolve, reject) => {
    chai
      .request('https://mnp.brandsms.vn')
      .post('/api/VMG/CheckMnp')
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('token', NEW_VMG_TOKEN)
      .send(JSON.stringify({ phoneNumber: phoneNumber }))
      .end((err, res) => {
        if (err) {
          console.error(err);
          return resolve(undefined);
        }
        if (res && res.body) {
          let result = res.body || {};
          // check if no error
          if (result.errorCode === '000') {
            const data = result.data[0];
            // nha mang khong hop le ( null), hop le tra ve ma nha mang 01 -> 09
            if (data.currentTelco) {
              return resolve(data.currentTelco);
            } else {
              return resolve(undefined);
            }
          }
          return resolve(undefined);
        } else {
          resolve(undefined);
        }
      });
  });
}

module.exports = {
  sendSMSMessage,
  checkSMSStatusById,
  createClient,
  responseSMSVMG,
  checkPhoneNumber,
};
