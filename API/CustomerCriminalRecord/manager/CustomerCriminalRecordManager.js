/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const CriminalRecordResourceAccess = require('../resourceAccess/CustomerCriminalRecordResourceAccess');
const CriminalRecordFunctions = require('../CustomerCriminalRecordFunctions');
const Logger = require('../../../utils/logging');
const moment = require('moment');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const criminalData = req.payload;

      let recordTime = criminalData.crimeRecordTime;
      if (recordTime) {
        criminalData.crimeRecordTime = moment(recordTime).toDate();
      }

      let result = await CriminalRecordFunctions.createNewCriminalRecord(criminalData);
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
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let criminalRecord = await CriminalRecordResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText, order);
      let criminalRecordCount = await CriminalRecordResourceAccess.customCount(filter, undefined, undefined, searchText, order);
      if (criminalRecord && criminalRecordCount) {
        resolve({ data: criminalRecord, total: criminalRecordCount });
      } else {
        resolve({ data: [], total: 0 });
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
      let criminalRecordId = req.payload.id;
      let criminalRecordData = req.payload.data;

      let recordTime = criminalRecordData.crimeRecordTime;
      if (recordTime) {
        criminalRecordData.crimeRecordTime = moment(recordTime).toDate();
      }

      let result = await CriminalRecordResourceAccess.updateById(criminalRecordId, criminalRecordData);
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

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let criminalRecordId = req.payload.id;
      let result = await CriminalRecordResourceAccess.findById(criminalRecordId);
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
      let criminalRecordId = req.payload.id;

      let result = await CriminalRecordResourceAccess.deleteById(criminalRecordId);
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

async function fetchNewRecords(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let plateNumber = req.payload.plateNumber;

      if (plateNumber.length < 6 || plateNumber.length > 20) {
        reject('failed');
        return;
      }

      let result = await CriminalRecordFunctions.crawlCriminalRecord(plateNumber);
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

async function refreshCrimeRecords(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { customerRecordPlatenumber, customerRecordId } = req.payload;

      if (customerRecordPlatenumber.length < 6 || customerRecordPlatenumber.length > 20) {
        reject('failed');
        return;
      }

      await CriminalRecordFunctions.bulkDeleteCriminalRecords(customerRecordPlatenumber);

      await CriminalRecordFunctions.bulkInsertCriminalRecords(customerRecordPlatenumber, customerRecordId);

      resolve('succed');
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
  fetchNewRecords,
  refreshCrimeRecords,
};
