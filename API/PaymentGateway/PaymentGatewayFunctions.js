/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const VNPAYFunctions = require('../../ThirdParty/PaymentGatewayVNPAYQR/VNPAYGatewayFunctions');
// const MOMOFunctions = require('../../ThirdParty/PaymentGatewayMOMO/MOMOFunctions');
// const PaymentDepositResource = require('../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
const CustomerReceiptResourceAccess = require('../CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');
const AppUserResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const StationVNPayResourceAccess = require('../StationVNPay/resourceAccess/StationVNPayResourceAccess');
const { CUSTOMER_RECEIPT_STATUS } = require('../CustomerReceipt/CustomerReceiptConstant');

async function createVNPAYPaymentRequest(transactionId, paymentAmount, paymentType, ipAddr, vnpaySecret) {
  return await VNPAYFunctions.makePaymentRequestVNPAY(transactionId, transactionId, paymentAmount, paymentType, paymentType, ipAddr, vnpaySecret);
}

async function _failureTransaction(receiptData, confirmResult) {
  //update transaction record status
  let updatedResult = await CustomerReceiptResourceAccess.updateById(receiptData.customerReceiptId, {
    customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.CANCELED,
    paymentApproveDate: new Date().toISOString(),
    vnpayResult: JSON.stringify(confirmResult),
  });

  return updatedResult;
}

async function _succeedTransaction(receiptData) {
  //update transaction record status
  let updatedResult = await CustomerReceiptResourceAccess.updateById(receiptData.customerReceiptId, {
    customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.SUCCESS,
    paymentApproveDate: new Date().toISOString(),
  });
  return updatedResult;
}

async function receiveVNPAYPaymentRequest(vnpayData) {
  let transactionCode = vnpayData.vnp_TxnRef;

  let confirmResult = undefined;

  if (!transactionCode) {
    return confirmResult;
  }

  let customerReceipt = await CustomerReceiptResourceAccess.find(
    {
      customerReceiptExternalRef: transactionCode,
    },
    0,
    1,
  );
  if (customerReceipt && customerReceipt.length > 0) {
    customerReceipt = customerReceipt[0];

    let paymentStatus = customerReceipt.customerReceiptStatus;
    let paymentAmount = customerReceipt.total;

    const appUserData = await AppUserResourceAccess.findById(customerReceipt.appUserId);
    let stationData = await StationVNPayResourceAccess.find({ stationsId: appUserData.stationsId });
    stationData = stationData[0];

    const vnpaySecret = {
      vnpayQRSecret: stationData.vnpayQRSecret,
      vnpayQRTMNCode: stationData.vnpayQRTMNCode,
      vnpayQRRedirectURL: stationData.vnpayQRRedirectURL,
      vnpayQRBankCode: stationData.vnpayQRBankCode,
    };

    confirmResult = await VNPAYFunctions.verifyPaymentFromVNPAY(vnpayData, transactionCode, paymentAmount, paymentStatus, vnpaySecret);

    //check payment result
    if (confirmResult && confirmResult.result && confirmResult.result.RspCode === '00' && confirmResult.paymentStatus === 'Success') {
      await _succeedTransaction(customerReceipt);
    } else {
      await _failureTransaction(customerReceipt, confirmResult);
    }
  } else {
    confirmResult = {
      result: VNPAYFunctions.errorCodes.ORDER_NOT_FOUND,
      paymentStatus: 'Failed',
    };
  }
  return confirmResult;
}

async function verifyVNPAYPayment(data) {}

async function createMOMOPaymentRequest(transactionId, paymentAmount) {
  // return await MOMOFunctions.makePaymentRequestMOMO(transactionId, transactionId, paymentAmount)
}

async function receiveMOMOPaymentRequest(momoData) {
  // let transactionCode = momoData.extraData;
  // let confirmResult = undefined;
  // if (!transactionCode) {
  //   return confirmResult;
  // }
  // let transactionData = await PaymentDepositResource.find({
  //   paymentTransactionCode: transactionCode
  // }, 0, 1);
  // if (transactionData && transactionData.length > 0) {
  //   transactionData = transactionData[0];
  //   let paymentStatus = transactionData.paymentStatus;
  //   let paymentAmount = transactionData.paymentAmount;
  //   confirmResult = await MOMOFunctions.verifyPaymentFromMOMO(momoData, transactionCode, paymentAmount, paymentStatus);
  //   //check payment result
  //   if (confirmResult && confirmResult.result
  //     && confirmResult.result.RspCode === "00"
  //     && confirmResult.paymentStatus === 'Success') {
  //     await _succeedTransaction(transactionData);
  //   } else {
  //     await _failureTransaction(transactionData);
  //   }
  // }
  // return confirmResult;
}

module.exports = {
  createVNPAYPaymentRequest,
  receiveVNPAYPaymentRequest,
  createMOMOPaymentRequest,
  receiveMOMOPaymentRequest,
  verifyVNPAYPayment,
};
