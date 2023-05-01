const Logger = require('../../../utils/logging');
const SMSMessageFunctions = require('../SMSMessageFunctions');
const SMSMessageResourceAccess = require('../resourceAccess/SMSMessageResourceAccess');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { activeUserByPhoneNumber, resetPasswordByUsername } = require('../../AppUsers/AppUsersFunctions');

async function insert(req) {
  return await _createSMSMessage(req);
}

async function robotInsert(req) {
  console.log('GG');
  return await _createSMSMessage(req);
}

async function _createSMSMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _smsMessageReceiver = req.query.phoneNumber;
      let apiKey = req.query.apiKey;

      if (!(isNotEmptyStringValue(apiKey) && isNotEmptyStringValue(process.env.SYSTEM_API_KEY) && apiKey === process.env.SYSTEM_API_KEY)) {
        console.error('_createSMSMessage invalid SYSTEM_API_KEY or apiKey');
        return reject(UNKNOWN_ERROR);
      }

      if (req.payload.type !== 'received') {
        return reject(UNKNOWN_ERROR);
      }

      let _senderPhone = req.payload.number;
      if (isNotEmptyStringValue(_senderPhone)) {
        _senderPhone = _senderPhone.replace('+', '');
      }
      let _newSMSData = {
        smsMessageOrigin: _senderPhone,
        smsMessageContent: req.payload.message,
        smsMessageReceiver: _smsMessageReceiver,
      };

      // store informations from message
      let result = await SMSMessageFunctions.addNewSMSMessage(_newSMSData);

      if (SMSMessageFunctions.isOTPSMSMessage(_newSMSData.smsMessageContent)) {
        await activeUserByPhoneNumber(_newSMSData.smsMessageOrigin);
        if (_newSMSData.smsMessageOrigin.indexOf('84') === 0) {
          await activeUserByPhoneNumber(_newSMSData.smsMessageOrigin.replace('84', '0'));
        }
        result = _newSMSData.smsMessageOrigin;
      } else if (SMSMessageFunctions.isResetPasswordSMSMessage(_newSMSData.smsMessageContent)) {
        await resetPasswordByUsername(_newSMSData.smsMessageOrigin);
        if (_newSMSData.smsMessageOrigin.indexOf('84') === 0) {
          await resetPasswordByUsername(_newSMSData.smsMessageOrigin.replace('84', '0'));
        }
        result = _newSMSData.smsMessageOrigin;
      }

      if (result) {
        resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (error) {
      Logger.error('insert sms message error', error);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return await _find(req);
}

async function _find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      let listSMSMessage = await SMSMessageResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (listSMSMessage) {
        let count = await SMSMessageResourceAccess.customCount(filter, startDate, endDate, searchText);
        resolve({ data: listSMSMessage, count: count[0].count });
      } else {
        resolve({ data: [], count: 0 });
      }
    } catch (error) {
      Logger.error('find sms message list error', error);
      reject('failed');
    }
  });
}

async function findById(req) {
  return await _findDetailById(req);
}

async function _findDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      if (!data.id) {
        reject('INVALID_SMS_MESSAGE_ID');
        return;
      }
      let existSMSMessage = await SMSMessageResourceAccess.findById(data.id);
      if (existSMSMessage) {
        resolve(existSMSMessage);
      } else {
        resolve({});
      }
    } catch (error) {
      Logger.error('find sms message detail error', error);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;
      let updateResult = await SMSMessageResourceAccess.updateById(id, data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        reject('failed');
      }
    } catch (error) {
      Logger.error('update sms message detail error', error);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  robotInsert,
  findById,
  find,
  updateById,
};
