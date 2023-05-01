/* Copyright (c) 2022 TORITI LIMITED 2022 */

require('dotenv').config();

const moment = require('moment');
const crypto = require('crypto');
var querystring = require('qs');
const { CUSTOMER_RECEIPT_STATUS } = require('../../API/CustomerReceipt/CustomerReceiptConstant');

function makeVNPAYQRHash(text, key) {
  return crypto.createHmac('sha256', key).update(text).digest('hex');
}

//orderId: id of order
//paymentAmount: total payment
//transactionType: "thanh toan" (default)
//paymentType: vnpay / creditcard / atm
async function makePaymentRequestVNPAY(orderId, paymentId, paymentAmount, paymentType, transactionType, ipAddr, vnpaySecret) {
  try {
    let targetId = paymentId;
    const redirectUrl = vnpaySecret.vnpayQRRedirectURL;

    let hash = '';
    hash = hash + 'order_id:' + orderId.toString() + ';';
    hash = hash + 'paymentAmount:' + paymentAmount.toString() + ';';
    hash = hash + 'transactionType:' + transactionType + ';';
    hash = hash + 'date:' + new Date().toISOString();
    hash = makeVNPAYQRHash(hash, vnpaySecret.vnpayQRSecret);

    const urlReturn = createPaymentUrl(targetId, paymentAmount, redirectUrl, hash, ipAddr, paymentType, vnpaySecret);

    return {
      transactionUrl: urlReturn,
      transactionCode: hash,
    };
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

//this API was call to make payment url
function createPaymentUrl(orderId, amount, redirectUrl, transCode, ipAddr, paymentType, vnpaySecret) {
  const tmnCode = vnpaySecret.vnpayQRTMNCode;
  const secretKey = vnpaySecret.vnpayQRSecret;
  let vnpUrl = process.env.VNPAYQR_URL;

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: transCode,
    vnp_OrderInfo: `THANHTOAN_${orderId}`,
    vnp_OrderType: 'billpayment',
    vnp_Amount: parseInt(amount) * 100,
    vnp_ReturnUrl: redirectUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
    // vnp_BankCode: "VIETCOMBANK", //No need, it is optional
  };

  if (paymentType) {
    if (paymentType === 'vnpay') {
      // vnp_Params.vnp_BankCode = 'VNPAYQR';
    } else if (paymentType === 'creditcard') {
      vnp_Params.vnp_BankCode = 'INTCARD';
    } else if (paymentType === 'atm') {
      vnp_Params.vnp_BankCode = 'VNBANK';
    } else {
      if (vnpaySecret.vnpayQRBankCode !== undefined) {
        vnp_Params.vnp_BankCode = vnpaySecret.vnpayQRBankCode;
      }
    }
  } else {
    if (vnpaySecret.vnpayQRBankCode !== undefined) {
      vnp_Params.vnp_BankCode = vnpaySecret.vnpayQRBankCode;
    }
  }

  vnp_Params = _sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: true });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: true });
  return vnpUrl;
}

function _sortObject(o) {
  var sorted = {},
    key,
    a = [];

  for (key in o) {
    if (o.hasOwnProperty(key)) {
      a.push(key);
    }
  }

  a.sort();

  for (key = 0; key < a.length; key++) {
    sorted[a[key]] = o[a[key]];
  }
  return sorted;
}

//BEWARE !!
const VNPAY_ERROR = {
  COMMON_ERROR: { RspCode: '99', Message: 'Unknow error' },
  ORDER_NOT_FOUND: { RspCode: '01', Message: 'Order not found' },
  NO_ERROR: { RspCode: '00', Message: 'Confirm Success' },
  INVALID_SIGNATURE: { RspCode: '97', Message: 'Invalid signature ' },
  ORDER_ALREADY_PAID: { RspCode: '02', Message: 'Order already confirmed' },
  INVALID_AMOUNT: { RspCode: '04', Message: 'Invalid Amount' },
};

//this function was call by MOMO via our registered webhooks
//output:
//--result: we will response this result to VNPAY
//--paymentStatus: this is payment status after verification
//BEWARE !! After call this method to verify payment,
//we also need to check again updated status of transaction in our Database
//before response "success" to VNPAY
//Somehow, sometimes, we can not update transaction in our database
//then please response failure to VNPAY webhooks
async function verifyPaymentFromVNPAY(vnpayData, transactionCode, transactionAmount, transactionStatus, vnpaySecret) {
  const FAILED_PAYMENT = 'Failed';
  if (vnpayData === undefined || transactionAmount === undefined || transactionStatus === undefined) {
    return {
      result: VNPAY_ERROR.COMMON_ERROR,
      paymentStatus: FAILED_PAYMENT,
    };
  }

  try {
    let paymentAmount = (vnpayData.vnp_Amount * 1) / 100;
    let paymentCode = vnpayData.vnp_TxnRef;
    let secureHash = vnpayData.vnp_SecureHash;
    let hashType = vnpayData.vnp_SecureHashType;
    let vnp_ResponseCode = vnpayData.vnp_ResponseCode;

    if (transactionCode === undefined || transactionCode !== paymentCode) {
      return {
        result: VNPAY_ERROR.ORDER_NOT_FOUND,
        paymentStatus: FAILED_PAYMENT,
      };
    }

    //BEWARE !! Don't knonw why VNPAY process this case but this case must be done followed by VNPAY
    if (vnp_ResponseCode !== '00') {
      return {
        result: VNPAY_ERROR.NO_ERROR,
        paymentStatus: FAILED_PAYMENT,
      };
    }

    var vnp_Params = vnpayData;

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = _sortObject(JSON.parse(JSON.stringify(vnp_Params)));
    var secretKey = vnpaySecret.vnpayQRSecret;
    var signData = querystring.stringify(vnp_Params, { encode: true });
    var hmac = crypto.createHmac('sha512', secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    if (secureHash !== signed) {
      console.error('Wrong hashType ' + hashType + 'or key ' + secureHash);
      console.error('signed: ' + signed);
      return {
        result: VNPAY_ERROR.INVALID_SIGNATURE,
        paymentStatus: FAILED_PAYMENT,
      };
    }
    if (paymentAmount === undefined) {
      console.error('paymentAmount is invalid');
      console.error(paymentAmount);
      return {
        result: VNPAY_ERROR.COMMON_ERROR,
        paymentStatus: FAILED_PAYMENT,
      };
    }

    if (paymentCode === undefined || paymentCode === '') {
      console.error('paymentCode is invalid');
      console.error(paymentCode);
      return {
        result: VNPAY_ERROR.COMMON_ERROR,
        paymentStatus: FAILED_PAYMENT,
      };
    }

    if (transactionAmount * 1 !== paymentAmount * 1) {
      console.error('transaction is invalid amount, paymentCode ' + paymentCode);
      return {
        result: VNPAY_ERROR.INVALID_AMOUNT,
        paymentStatus: FAILED_PAYMENT,
      };
    }

    const STATUS_PENDING = CUSTOMER_RECEIPT_STATUS.PENDING;
    if (transactionStatus !== STATUS_PENDING) {
      console.error('transaction is processed before, transactionCode ' + transactionCode);
      return {
        result: VNPAY_ERROR.ORDER_ALREADY_PAID,
        paymentStatus: FAILED_PAYMENT,
      };
    }

    const SUCCESS_PAYMENT = 'Success';
    return {
      result: VNPAY_ERROR.NO_ERROR,
      paymentStatus: SUCCESS_PAYMENT,
    };
  } catch (e) {
    console.error(e);
    return {
      result: VNPAY_ERROR.COMMON_ERROR,
      paymentStatus: FAILED_PAYMENT,
    };
  }
}

module.exports = {
  makePaymentRequestVNPAY,
  verifyPaymentFromVNPAY,
  errorCodes: VNPAY_ERROR,
};
