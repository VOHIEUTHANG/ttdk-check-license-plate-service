/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();
const Logger = require('../../../utils/logging');
const PaymentQRResourceAccess = require('../resourceAccess/PaymentQRResourceAccess');
const VNPayQR = require('../../../ThirdParty/PaymentGatewayVNPAYQR/VNPAYQRFunctions');
const QRCodeFunction = require('../../../ThirdParty/QRCode/QRCodeFunctions');
const StationVNPayResourceAccess = require('../../StationVNPay/resourceAccess/StationVNPayResourceAccess');
const moment = require('moment');
const { QR_STATUS } = require('../PaymentQRConstants');
const CustomerReceiptResourceAccess = require('../../CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      if (!filter) {
        filter = {};
      }
      filter.stationsId = req.currentUser.stationsId;

      let data = await PaymentQRResourceAccess.customSearch(filter, skip, limit, searchText, order);

      if (data && data.length > 0) {
        let count = await PaymentQRResourceAccess.customCount(filter, searchText, order);
        resolve({ data: data, total: count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await PaymentQRResourceAccess.findById(id);

      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let oldRecord = await PaymentQRResourceAccess.findById(id);
      if (oldRecord === undefined) {
        reject('invalid record');
        return;
      }

      let result = await PaymentQRResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _createQRCode(paymentQRId, amount, expiredDate, note, vnpaySecert) {
  let createVNPayQR = await VNPayQR.createQR(paymentQRId, amount, expiredDate, note, 0, vnpaySecert);
  if (createVNPayQR && createVNPayQR.text) {
    createVNPayQR = JSON.parse(createVNPayQR.text);
    if (createVNPayQR.code === VNPayQR.CREATE_VNPAYQR_ERROR.NO_ERROR.code) {
      const QRCodeImage = await QRCodeFunction.createQRCode(createVNPayQR.data);
      if (QRCodeImage) {
        await PaymentQRResourceAccess.updateById(paymentQRId, {
          paymentQRImage: `${process.env.HOST_NAME}/${QRCodeImage}`,
          paymentQRData: createVNPayQR.data,
          paymentQRRef: createVNPayQR.idQrcode,
        });
      }
    } else {
      let errorMsg = Object.values(VNPayQR.CREATE_VNPAYQR_ERROR).find(_error => _error.code === createVNPayQR.code);
      if (!errorMsg) {
        errorMsg = VNPayQR.CREATE_VNPAYQR_ERROR.INTERNAL_ERROR;
      }
      throw errorMsg;
    }
  }
}

function _calculateFee(paymentQRAmount) {
  const FEE = 3,
    EXTRA_FEE = 1000;
  const feeAmount = parseInt((paymentQRAmount / 100) * FEE) + EXTRA_FEE;
  // return feeAmount;
  return 0;
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      const feeAmount = _calculateFee(data.paymentQRAmount);
      const paymentQRExpiredDate = moment(data.paymentQRExpiredDate, 'DD/MM/YYYY');
      let result = await PaymentQRResourceAccess.insert({
        ...data,
        fee: feeAmount,
        paymentQRExpiredDate: paymentQRExpiredDate.toDate(),
        total: feeAmount + data.paymentQRAmount,
        stationsId: req.currentUser.stationsId,
      });

      if (result) {
        let stationVNPayData = await StationVNPayResourceAccess.find({
          stationsId: req.currentUser.stationsId,
        });
        await _createQRCode(
          result[0],
          feeAmount + data.paymentQRAmount,
          paymentQRExpiredDate.format('YYMMDDHHmm'),
          data.paymentQRNote,
          stationVNPayData[0],
        );
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;

      if (data.paymentQRAmount) {
        data.fee = _calculateFee(data.paymentQRAmount);
        data.total = data.feeAmount + data.paymentQRAmount;
        await _createQRCode(id, data, data.fee);
      }
      if (data.paymentQRExpiredDate) {
        data.paymentQRExpiredDate = moment(data.paymentQRExpiredDate, 'DD/MM/YYYY').toDate();
      }
      let result = await PaymentQRResourceAccess.updateById(id, data);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateOrderFromVNPay(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      console.info('data from vnpay ========\n');
      console.info(data);
      console.info('end of data from vnpay ========\n');
      chai.request(`https://3868-42-115-135-236.ap.ngrok.io`).post(`/vnpay-data`).send(data);
      let qrData = await PaymentQRResourceAccess.findById(data.txnId);
      if (!qrData) {
        resolve(VNPayQR.UPDATE_ORDER_ERROR.INTERNAL_ERROR);
        return;
      }

      if (qrData.paymentQRStatus === QR_STATUS.COMPLETED) {
        resolve({
          ...VNPayQR.UPDATE_ORDER_ERROR.APPROVED_ORDER,
          data: {
            txnId: qrData.paymentQRId,
          },
        });
        return;
      }

      if (qrData.paymentQRStatus === QR_STATUS.PROCESSING) {
        resolve({
          ...VNPayQR.UPDATE_ORDER_ERROR.PROCESSING_TRANSACTION,
          data: {
            txnId: qrData.paymentQRId,
          },
        });
        return;
      }

      await PaymentQRResourceAccess.updateById(qrData.paymentQRId, {
        paymentQRStatus: QR_STATUS.PROCESSING,
      });

      let stationVNPaySecret = await StationVNPayResourceAccess.findById(qrData.stationsId);
      if (!stationVNPaySecret) {
        resolve(VNPayQR.UPDATE_ORDER_ERROR.INTERNAL_ERROR);
        return;
      }

      const xFF = req.headers['x-forwarded-for'];
      const ip = xFF ? xFF.split(',')[0] : req.info.remoteAddress;
      console.info('IP from IPN: ', ip);

      let checkResult = await VNPayQR.verifyDataFromVNPay(data, qrData, ip, stationVNPaySecret);
      if (checkResult) {
        if (checkResult.code === VNPayQR.UPDATE_ORDER_ERROR.NO_ERROR.code) {
          await PaymentQRResourceAccess.updateById(qrData.paymentQRId, { paymentQRStatus: QR_STATUS.COMPLETED });
        }
        resolve(checkResult);
      } else {
        resolve(VNPayQR.UPDATE_ORDER_ERROR.INTERNAL_ERROR);
      }
    } catch (error) {
      console.error(__filename, error);
      reject(VNPayQR.UPDATE_ORDER_ERROR.INTERNAL_ERROR);
    }
  });
}

async function createQRByTnx(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerReceiptId = req.payload.customerReceiptId;
      const receiptData = await CustomerReceiptResourceAccess.findById(customerReceiptId);
      if (!receiptData) {
        reject('failed');
        return;
      }

      const paymentQRExpiredDate = moment().add(1, 'y');
      const insertData = {
        customerReceiptId: customerReceiptId,
        paymentQRName: `GD_TRACE_${customerReceiptId}_${moment().format('YYYYDDMM')}`,
        paymentQRAmount: receiptData.customerReceiptAmount,
        paymentQRNote: `GD_TRACE_${customerReceiptId}_${moment().format('YYYYDDMM')}`,
        paymentQRExpiredDate: paymentQRExpiredDate.toDate(),
        fee: receiptData.fee,
        total: receiptData.total,
      };

      let result = await PaymentQRResourceAccess.insert(insertData);

      if (result) {
        let stationVNPayData = await StationVNPayResourceAccess.find({
          stationsId: req.currentUser.stationsId,
        });
        await _createQRCode(result[0], receiptData.total, paymentQRExpiredDate.format('YYMMDDHHmm'), insertData.paymentQRNote, stationVNPayData[0]);
        let data = await PaymentQRResourceAccess.findById(result[0]);
        resolve(data);
      } else {
        reject('failed');
      }
    } catch (error) {
      console.error(__filename, error);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  updateOrderFromVNPay,
  createQRByTnx,
};
