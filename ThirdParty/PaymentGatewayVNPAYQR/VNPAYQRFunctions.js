/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const crypto = require('crypto');

async function createQR(qrId, paymentAmount, expiredDate, desc, tipAndFee, vnpaySecert) {
  const VNPAYQR_SERVICE_CODE = '03';
  const VNPAYQR_COUNTRY_CODE = 'VN';
  const CURRENCY_ID = '704';
  const data = [
    vnpaySecert.vnpayQROfflineAppId,
    vnpaySecert.vnpayQROfflineMerchantName,
    VNPAYQR_SERVICE_CODE, // service code
    VNPAYQR_COUNTRY_CODE,
    vnpaySecert.vnpayQROfflineMasterCode,
    vnpaySecert.vnpayQROfflineMerchantType,
    vnpaySecert.vnpayQROfflineMerchantCode,
    vnpaySecert.vnpayQROfflineTerminalId,
    VNPAYQR_SERVICE_CODE, // paytype
    '', //productid
    'null', //txnId
    paymentAmount.toString(),
    tipAndFee.toString(),
    CURRENCY_ID,
    expiredDate,
    vnpaySecert.vnpayQROfflineCreateQRSecret,
  ];
  const checkSum = crypto.createHash('md5').update(data.join('|')).digest('hex');
  const dataParam = {
    appId: vnpaySecert.vnpayQROfflineAppId,
    merchantName: vnpaySecert.vnpayQROfflineMerchantName,
    serviceCode: VNPAYQR_SERVICE_CODE,
    countryCode: VNPAYQR_COUNTRY_CODE,
    masterMerCode: vnpaySecert.vnpayQROfflineMasterCode, // Mã doanh nghiệp phát triển merchant: default : A000000775
    merchantType: vnpaySecert.vnpayQROfflineMerchantType,
    merchantCode: vnpaySecert.vnpayQROfflineMerchantCode,
    payloadFormat: null,
    terminalId: vnpaySecert.vnpayQROfflineTerminalId, // Mã điểm thu
    payType: VNPAYQR_SERVICE_CODE, // Mã dịch vụ QR. Giá trị mặc định là 03
    productId: '', // Mã sản phẩm (Để trống nếu tạo QR type = 01,03,04)
    productName: null,
    imageName: null,
    txnId: null, // Mã đơn hàng, Mã GD. (Dùng cho payType = 01)
    amount: paymentAmount.toString(),
    tipAndFee: tipAndFee.toString(),
    ccy: CURRENCY_ID, // Mã tiền tệ : Giá trị mặc định 704
    expDate: expiredDate, // format YYMMDDHHmm
    desc: desc, // mô tả
    checksum: checkSum,
    merchantCity: null,
    merchantCC: null,
    fixedFee: null,
    percentageFee: null,
    pinCode: null,
    mobile: null,
    billNumber: qrId, // Số hóa đơn QR terminal.
    creator: null,
    consumerID: null, // Mã khách hàng , dành cho QR type 04
    purpose: '', // Mã dịch vụ billing cho QR type 04
  };
  return await new Promise(async (resolve, reject) => {
    await chai
      .request(process.env.VNPAYQR_OFFLINE_URL)
      .post(`/QRCreateAPIRestV2/rest/CreateQrcodeApi/createQrcode`)
      .set('content-type', 'text/plain')
      .send(JSON.stringify(dataParam))
      .then(res => {
        resolve(res);
      })
      .catch(error => {
        console.log(__filename, error);
        reject('failed');
      });
  });
}

// {
//   "code": "00",
//   "message": "Tru tien thanh cong, so trace 100550",
//   "msgType": "1",
//   "txnId": "50141",
//   "qrTrace": "000098469",
//   "bankCode": "VIETCOMBANK",
//   "mobile": "0989511021",
//   "accountNo": "",
//   "amount": "1000000",
//   "payDate": "20180807164732",
//   "masterMerCode": "A000000775",
//   "merchantCode": "0311609355",
//   "terminalId": "FPT02",
//   "addData": [{
//   "merchantType": "5045",
//   "serviceCode": "06",
//   "masterMerCode": "A000000775",
//   "merchantCode": "0311609355",
//   "terminalId": "FPT02",
//   "productId": "",
//   "amount": "100000",
//   "ccy": "704",
//   "qty": "1",
//   "note": ""
//   }],
//   "checksum": "81F77683FEA4EBE2CE748AFC99CC3AE9",
//   "ccy": "704",
//   "secretKey": "VNPAY"
//   }

// const WHITE_LIST_IP = []

async function verifyDataFromVNPay(data, qrData, ip, vnpaySecret) {
  // if (WHITE_LIST_IP.indexOf(ip) === -1) {
  //   return UPDATE_ORDER_ERROR.BLOCKED_IP;
  // }

  const dataChecksum = [
    data.code,
    data.msgType,
    data.txnId,
    data.qrTrace,
    data.bankCode,
    data.mobile,
    data.accountNo,
    data.amount,
    data.payDate,
    data.merchantCode,
    vnpaySecret.vnpayQROfflineUpdatePaymentSecret,
  ];
  const checkSum = crypto.createHash('md5').update(dataChecksum.join('|')).digest('hex');
  if (checkSum !== data.checksum) {
    return UPDATE_ORDER_ERROR.INVALID_CHECKSUM;
  }

  if (parseInt(qrData.total) !== parseInt(data.amount)) {
    return UPDATE_ORDER_ERROR.INVALID_AMOUNT;
  }

  return {
    ...UPDATE_ORDER_ERROR.NO_ERROR,
    data: {
      txnId: qrData.paymentQRId,
    },
  };
}

const CREATE_VNPAYQR_ERROR = {
  NO_ERROR: { code: '00', message: 'Success' },
  INVALID_INPUT: { code: '01', message: 'Data input is not in format' },
  VNPAYQR_ERROR: { code: '04', message: 'Insert data QrCode failed' },
  DENIED_IP: { code: '05', message: 'Ip is denied' },
  INVALID_CHECKSUM: { code: '06', message: 'False checkSum' },
  INVALID_MERCHANT: { code: '07', message: 'Merchant is not exist' },
  INVALID_SERVICE_CODE: { code: '09', message: 'Service code is invalid' },
  INVALID_APP_ID: { code: '10', message: 'AppId is invalid' },
  BLOCKED_MERCHANT: { code: '11', message: 'Merchant is not active' },
  INVALID_MASTER_MERCHANT: { code: '12', message: 'Master merchant code is null or empty' },
  INVALID_CONSUMER_ID: { code: '15', message: 'ConsumerID is null or empty' },
  INVALID_PURPOSE: { code: '16', message: 'Purpose is null or empty' },
  INVALID_TERMINAL_ID: { code: '21', message: 'Terminal is invalid' },
  BLOCKED_TERMINAL_ID: { code: '24', message: 'Terminal is inactive' },
  INTERNAL_ERROR: { code: '99', message: 'Internal errors' },
  SYSTEM_MAINTAIN: { code: '96', message: 'System is maintaining' },
};

const UPDATE_ORDER_ERROR = {
  SHORT_ITEM: {
    code: '01',
    message: {
      productid: 'string', // Mã sản phẩm
      qty: 'String', // Số lượng còn trong kho
    },
  },
  OUT_OF_STOCK: {
    code: '02',
    message: 'Kho hàng đã hết sản phẩm',
  },
  APPROVED_ORDER: {
    code: '03',
    message: 'Đơn hàng đã được thanh toán',
    data: {
      txnId: 'String',
    },
  },
  INTERNAL_ERROR: {
    code: '04',
    message: 'INTERNAL ERORR',
  },
  PROCESSING_TRANSACTION: {
    code: '05',
    message: 'đơn hàng đang được xử lí',
    data: {
      txnId: 'string',
    },
  },
  INVALID_CHECKSUM: {
    code: '06',
    message: 'sai thông tin xác thực',
  },
  INVALID_AMOUNT: {
    code: '07',
    message: 'số tiền không chính xác',
    data: {
      amount: 'String',
    },
  },
  TIMOUT: {
    code: '08',
    meesage: 'Giao dịch timout',
  },
  EXPIRED_QR: {
    code: '09',
    message: 'QR hết hạn thanh toán',
  },
  BLOCKED_IP: {
    code: '10',
    message: 'IP không được truy cập',
  },
  NO_ERROR: {
    code: '00',
    message: 'đặt hành thành công',
    data: {
      txnId: 'string',
    },
  },
};

const CHECKTRAN_VNPAYQR_ERROR = {
  NO_ERROR: { code: '00', message: 'Giao dịch thành công' },
  NOT_FOUND: { code: '01', message: 'Không tìm thấy giao dịch' },
  INVALID_PAY_DATE: { code: '02', message: 'PayDate không đúng định dạng.' },
  INVALID_TXN_ID: { code: '03', message: 'TxnId không được null hoặc empty.' },
  TRANSACTION_FAILED: { code: '04', message: 'Giao dich thất bại.' },
  PROCESSING_TRANSACTION: { code: '08', message: 'Giao dich nghi vấn.' },
  BLOCKED_IP: { code: '14', message: 'IP bị khóa.' },
  INVALID_PARAM: { code: '11', message: 'Dữ liệu đầu vào không đúng định dạng.' },
  INTERNAL_ERROR: { code: '99', message: 'Internal error' },
};

const REFUND_RESPONSE = {
  NO_ERROR: { code: '00', message: 'Refund Success' },
  INVALID_CHECKSUM: { code: '01', message: 'Checksum is wrong.' },
  INVALID_APART_MONEY: { code: '02', message: 'Money is invalid - a part' },
  INVALID_TOTAL_MONEY: { code: '03', message: 'Money is invalid - totality' },
  NOT_ALLOW_REFUND_TOTAL: { code: '04', message: 'Not allow refund totality after refund a part' },
  INVALID_FORMAT: { code: '11', message: 'Format data is wrong' },
  TRANSACTION_NOT_FOUND: { code: '12', message: 'Transaction not found' },
  BLOCKED_IP: { code: '14', message: 'IP is denied' },
  SYSTEM_MAINTAIN: { code: '96', message: 'System is maintaing' },
  INTERNAL_ERROR: { code: '99', message: 'Internal error' },
};

module.exports = {
  createQR,
  REFUND_RESPONSE,
  CREATE_VNPAYQR_ERROR,
  CHECKTRAN_VNPAYQR_ERROR,
  verifyDataFromVNPay,
  UPDATE_ORDER_ERROR,
};
