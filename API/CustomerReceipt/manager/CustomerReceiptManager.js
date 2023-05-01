/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const { CUSTOMER_RECEIPT_STATUS } = require('../CustomerReceiptConstant');
const CustomerReceiptResourceAccess = require('../resourceAccess/CustomerReceiptResourceAccess');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await CustomerReceiptResourceAccess.insert(req.payload);
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

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let data = await CustomerReceiptResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (data && data.length > 0) {
        let count = await CustomerReceiptResourceAccess.customCount(filter, startDate, endDate, searchText, order);
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
      let result = await CustomerReceiptResourceAccess.findById(id);

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

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;

      let result = await CustomerReceiptResourceAccess.updateById(id, data);
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

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await CustomerReceiptResourceAccess.deleteById(id);
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

async function userCreateReceipt(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let _currentUser = req.currentUser;
      const FEE = 3;
      const EXTRA_FEE = 1000; // 1k

      const customerReceiptFee = parseInt((data.customerReceiptAmount * FEE) / 100) + EXTRA_FEE;
      const total = data.customerReceiptAmount + customerReceiptFee;

      let result = await CustomerReceiptResourceAccess.insert({
        ...data,
        total: total,
        fee: customerReceiptFee,
        appUserId: _currentUser.appUserId,
        customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.PENDING,
      });
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

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let data = await CustomerReceiptResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (data && data.length > 0) {
        let count = await CustomerReceiptResourceAccess.customCount(filter, startDate, endDate, searchText, order);
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

async function getDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await CustomerReceiptResourceAccess.findById(id);

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

async function userUpdateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;

      let result = await CustomerReceiptResourceAccess.updateById(id, data);
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

async function getDetailByExternalRef(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerReceiptExternalRef = req.payload.customerReceiptExternalRef;
      let result = await CustomerReceiptResourceAccess.find({
        customerReceiptExternalRef: customerReceiptExternalRef,
      });
      console.log(result);
      if (result && result.length > 0) {
        resolve(result[0]);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
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
  userGetList,
  getDetailById,
  userUpdateById,
  userCreateReceipt,
  getDetailByExternalRef,
};
