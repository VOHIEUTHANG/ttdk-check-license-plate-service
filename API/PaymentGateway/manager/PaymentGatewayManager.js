/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const Logger = require('../../../utils/logging');
const PaymentGatewayFunctions = require('../PaymentGatewayFunctions');
// const PaymentDepositResource = require('../../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
// const PaymentServicePackage = require('../../PaymentServicePackage/resourceAccess/PaymentServicePackageResourceAccess');
// const WalletResource = require('../../Wallet/resourceAccess/WalletResourceAccess');
// const { PAYMENT_METHOD } = require('../../PaymentMethod/PaymentMethodConstant');
// const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const CustomerReceiptView = require('../../CustomerReceipt/resourceAccess/CustomerReceiptView');
const CustomerReceiptResourceAccess = require('../../CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');
const StationVNPayResourceAccess = require('../../StationVNPay/resourceAccess/StationVNPayResourceAccess');
const { CUSTOMER_RECEIPT_STATUS } = require('../../CustomerReceipt/CustomerReceiptConstant');

// async function _createNewDepositRecord(user, servicePackage, paymentMethodId = PAYMENT_METHOD.CASH) {
// let _paymentAmount = servicePackage.rechargePackage;
// if (servicePackage.promotion && servicePackage.promotion !== null && servicePackage.promotion !== '') {
//   _paymentAmount = _paymentAmount - servicePackage.rechargePackage * servicePackage.promotion / 100;
// }

// let userWallet = await WalletResource.find({
//   appUserId: user.appUserId,
//   walletType: WALLET_TYPE.POINT,
// }, 0, 1);

// if (!userWallet || userWallet.length <= 0) {
//   Logger.error(`can not find wallet for user ${user.appUserId} to _createNewDepositRecord`);
//   return undefined
// }

// let depositData = {
//   appUserId: user.appUserId,
//   walletId: userWallet[0].walletId,
//   paymentMethodId: paymentMethodId,
//   paymentAmount: _paymentAmount,
//   paymentRewardAmount: servicePackage.rechargePackage,
// };

// let createResult = await PaymentDepositResource.insert(depositData);
// if (createResult) {
//   return createResult[0];
// } else {
//   Logger.error(`can not _createNewDepositRecord ${user.appUserId} - amount ${amount}`);
//   return undefined;
// }
// }

async function receivePaymentVNPAY(req) {
  let params = req.query;

  const xFF = req.headers['x-forwarded-for'];
  const ip = xFF ? xFF.split(',')[0] : req.info.remoteAddress;
  console.info('IP from IPN: ', ip);
  console.info('Data from IPN: ', params);
  let transactionResult = await PaymentGatewayFunctions.receiveVNPAYPaymentRequest(params);
  if (transactionResult) {
    return transactionResult.result;
  } else {
    //default response for VNPAY
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}

function makePaymentRequestVNPAY(req) {
  return new Promise(async (resolve, reject) => {
    let customerReceiptId = req.payload.customerReceiptId;

    let _receipt = await CustomerReceiptView.findById(customerReceiptId);
    if (!_receipt) {
      Logger.error(`can not CustomerReceiptResourceAccess.findById ${customerReceiptId}`);
      reject('failed');
      return;
    }

    if (_receipt.customerReceiptStatus !== CUSTOMER_RECEIPT_STATUS.PENDING) {
      reject('failed');
      return;
    }

    let _paymentAmount = _receipt.total;
    const xFF = req.headers['x-forwarded-for'];
    const ip = xFF ? xFF.split(',')[0] : req.info.remoteAddress;

    let stationVNPayData = await StationVNPayResourceAccess.find({
      stationsId: _receipt.stationsId,
    });
    if (!(stationVNPayData && stationVNPayData.length > 0)) {
      reject('failed');
      return;
    }
    stationVNPayData = stationVNPayData[0];

    const vnpayScecret = {
      vnpayQRSecret: '',
      vnpayQRTMNCode: '',
      vnpayQRRedirectURL: '',
    };
    if (stationVNPayData.isUseDefaultSetting === 1) {
      vnpayScecret.vnpayQRSecret = process.env.VNPAYQR_SECRET;
      vnpayScecret.vnpayQRTMNCode = process.env.VNPAYQR_TMNCODE;
      vnpayScecret.vnpayQRRedirectURL = process.env.VNPAYQR_REDIRECT_URL;
    } else {
      vnpayScecret.vnpayQRSecret = stationVNPayData.vnpayQRSecret;
      vnpayScecret.vnpayQRTMNCode = stationVNPayData.vnpayQRTMNCode;
      vnpayScecret.vnpayQRRedirectURL = stationVNPayData.vnpayQRRedirectURL;
    }

    let transactionResult = await PaymentGatewayFunctions.createVNPAYPaymentRequest(
      customerReceiptId,
      _paymentAmount,
      _receipt.paymentMethod,
      ip,
      vnpayScecret,
    );
    if (transactionResult) {
      await CustomerReceiptResourceAccess.updateById(customerReceiptId, {
        customerReceiptExternalRef: transactionResult.transactionCode,
      });
      resolve({
        ...transactionResult,
        transactionId: customerReceiptId,
      });
    } else {
      reject('failed');
    }
  });
}

//This API is used for mobile only with payment method app-to-app via ATM card
//with this redirect URL, SDK from VNPAY will callback to our app
function finishVNPAYPayment(req) {
  return `<head><meta http-equiv='refresh' content='0; URL=http://sdk.merchantbackapp'></head>`;
}

function verifyVNPAYPayment(req) {
  return new Promise((resolve, reject) => {
    const data = req.payload;

    const result = PaymentGatewayFunctions.verifyVNPAYPayment(data);
    resolve(result);
  });
}

async function receivePaymentMOMO(req) {
  let paymentData = req.payload;

  return new Promise(async (resolve, reject) => {
    try {
      let transactionResult = await PaymentGatewayFunctions.receiveMOMOPaymentRequest(paymentData);
      if (transactionResult) {
        resolve(transactionResult);
      } else {
        reject('transaction failed');
      }
    } catch (error) {
      console.error(error);
      reject('transaction error');
    }
  });
}

function makePaymentRequestMOMO(req) {
  // return new Promise(async (resolve, reject) => {
  //   let servicePackageId = req.payload.servicePackageId;
  //   //find service package to get package info
  //   let _servicePackage = await PaymentServicePackage.findById(servicePackageId);
  //   if (!_servicePackage) {
  //     Logger.error(`can not PaymentServicePackage.findById ${servicePackageId}`);
  //     reject('failed')
  //   }
  //   let _paymentAmount = _servicePackage.rechargePackage;
  //   if (_servicePackage.promotion && _servicePackage.promotion !== null && _servicePackage.promotion !== '') {
  //     _paymentAmount = _paymentAmount - _servicePackage.rechargePackage * _servicePackage.promotion / 100;
  //   }
  //   let newTransactionId = await _createNewDepositRecord(req.currentUser, _servicePackage, PAYMENT_METHOD.MOMO);
  //   if (!newTransactionId) {
  //     Logger.error(`can not create new transaction record`)
  //     reject('failed');
  //   }
  //   let transactionResult = PaymentMOMOGatewayFunctions.makePaymentRequestMOMO(
  //     data,
  //   );
  //   resolve(transactionResult);
  // });
}

module.exports = {
  receivePaymentVNPAY,
  makePaymentRequestVNPAY,
  verifyVNPAYPayment,
  finishVNPAYPayment,
  makePaymentRequestMOMO,
  receivePaymentMOMO,
};
