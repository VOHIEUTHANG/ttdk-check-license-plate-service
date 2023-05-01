/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const CustomerMessageResourceAccess = require('../resourceAccess/CustomerMessageResourceAccess');
const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
const Logger = require('../../../utils/logging');
const SMSAPIFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');
const CustomerRecordResourceAccess = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const SystemAppLogFunctions = require('../../SystemAppChangedLog/SystemAppChangedLogFunctions');
const CustomerMessageFunctions = require('../CustomerMessageFunctions');
const MessageCustomerView = require('../resourceAccess/MessageCustomerView');
const { SMS_PROVIDER, EMAIL_PROVIDER } = require('../CustomerMessageConstant');
const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
const { MISSING_AUTHORITY, UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');

async function sendsms(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let message = req.payload.message;
      let phoneNumber = req.payload.phoneNumber;
      let check = await checkStatusSMS(phoneNumber);
      if (check) {
        let result = await SMSAPIFunctions.sendSMS(message, [phoneNumber]);
        if (result) {
          resolve(result);
        } else {
          reject('failed');
        }
      } else {
        reject('has exceeded the number of submissions this month');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function checkStatusSMS(phoneNumber) {
  let startDate = moment().startOf('day').format();
  let endDate = moment().endOf('day').format();
  let count = await MessageCustomerResourceAccess.customCount({ customerMessagePhone: phoneNumber }, startDate, endDate, undefined, undefined);
  if (count == 0) {
    return true;
  } else {
    return false;
  }
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageData = req.payload;
      customerMessageData.customerStationId = req.currentUser.stationsId;

      // //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
      // if (customer.customerRecordCheckExpiredDate === null || customer.customerRecordCheckExpiredDate.trim() === "") {
      //   continue;
      // }

      let result = await CustomerMessageResourceAccess.insert(customerMessageData);
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
      // if (startDate) {
      //   startDate = formatDate.FormatDate(startDate)
      // }
      // if (endDate) {
      //   endDate = formatDate.FormatDate(endDate)
      // }
      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.customerStationId = req.currentUser.stationsId;
      }

      let customerMessage = await MessageCustomerView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (customerMessage && customerMessage.length > 0) {
        let customerMessageCount = await MessageCustomerView.customCount(filter, startDate, endDate, searchText, order);

        resolve({ data: customerMessage, total: customerMessageCount });
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
      let customerMessageData = req.payload.data;

      let messageCustomer = await MessageCustomerResourceAccess.findById(req.payload.id);

      if (!messageCustomer) {
        return reject('failed');
      }

      let customerMessageId = messageCustomer.messageId;

      let dataBefore = await CustomerMessageResourceAccess.findById(customerMessageId);

      let result = await CustomerMessageResourceAccess.updateById(customerMessageId, {
        customerMessageContent: customerMessageData.customerMessageContent,
        customerMessageCategories: customerMessageData.customerMessageCategories,
        isDeleted: customerMessageData.isDeleted,
      });

      await MessageCustomerResourceAccess.updateById(req.payload.id, {
        customerMessagePhone: customerMessageData.customerRecordPhone,
        isDeleted: customerMessageData.isDeleted,
      });

      if (result) {
        SystemAppLogFunctions.logCustomerRecordChanged(dataBefore, customerMessageData, req.currentUser);
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
      let customerMessageId = req.payload.id;
      let result = await MessageCustomerView.findById(customerMessageId);
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

async function sendMessageByFilter(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let userStationId = req.currentUser.stationsId;

      //validate payload to prevent crash
      if (filter === undefined) {
        filter = {};
      }

      //do not have permission for different station
      if (userStationId === undefined) {
        console.error(`sendMessageByFilter do not have stationId`);
        reject('sendMessageByFilter do not have stationId');
        return;
      }

      //retrieve info for customer list for this station only
      let customerList = await CustomerRecordResourceAccess.customSearchByExpiredDate(
        {
          customerStationId: userStationId,
        },
        undefined,
        undefined,
        filter.startDate,
        filter.endDate,
        filter.searchText,
      );

      //filter into waiting list
      let _waitToSendList = [];
      for (let i = 0; i < customerList.length; i++) {
        const customer = customerList[i];
        //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
        if (customer.customerRecordCheckExpiredDate === null || customer.customerRecordCheckExpiredDate.trim() === '') {
          continue;
        }
        _waitToSendList.push(customer);
      }

      let customerMessageContent = req.payload.customerMessageContent;
      let customerMessageCategories = req.payload.customerMessageCategories;
      //Send message to many customer
      let result = await CustomerMessageFunctions.sendMessageToManyCustomer(
        _waitToSendList,
        userStationId,
        customerMessageContent,
        customerMessageCategories,
        req.payload.customerMessageTemplateId,
      );
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

async function sendMessageByCustomerList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userStationId = req.currentUser.stationsId;
      let customerMessageContent = req.payload.customerMessageContent;
      let customerMessageCategories = req.payload.customerMessageCategories;
      let customerMessageTemplateId = req.payload.customerMessageTemplateId;
      let customerList = [];
      let customerRecordIdList = req.payload.customerRecordIdList;

      //retrieve info for customer list
      for (var i = 0; i < customerRecordIdList.length; i++) {
        let customer = await CustomerRecordResourceAccess.findById(customerRecordIdList[i]);
        if (customer) {
          //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
          if (customer.customerRecordCheckExpiredDate === null || customer.customerRecordCheckExpiredDate.trim() === '') {
            continue;
          }
          customerList.push(customer);
        }
      }

      //Send message to many customer
      let result = await CustomerMessageFunctions.sendMessageToManyCustomer(
        customerList,
        userStationId,
        customerMessageContent,
        customerMessageCategories,
        customerMessageTemplateId,
      );
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

async function findTemplates(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.currentUser.stationsId;
      let templates = await CustomerMessageFunctions.getTemplateMessages(stationsId);
      if (templates) {
        resolve(templates);
      } else {
        reject('do not have any templates');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function sendTestEmail(req) {
  const EmailClient = require('../../../ThirdParty/Email/EmailClient');
  return new Promise(async (resolve, reject) => {
    try {
      // payload: Joi.object({
      //   testEmail:Joi.string().required().email(),
      //   emailUsername: Joi.string().required(),
      //   emailPassword: Joi.string().required(),
      //   emailConfig: Joi.object({
      //     emailHost: Joi.string(),
      //     emailPort: Joi.number(),
      //     emailSecure: Joi.number(),
      //   }),
      //   emailProvider: Joi.string().default(EMAIL_PROVIDER.CUSTOM).allow([EMAIL_PROVIDER.GMAIL, EMAIL_PROVIDER.CUSTOM]).required()
      // })

      let emailData = req.payload;
      let sendResult = undefined;
      if (emailData.emailProvider === EMAIL_PROVIDER.CUSTOM) {
        if (emailData.emailConfig) {
          let _customClient = await EmailClient.createNewClient(
            emailData.emailConfig.emailHost,
            emailData.emailConfig.emailPort,
            emailData.emailConfig.emailSecure,
            emailData.emailUsername,
            emailData.emailPassword,
          );
          console.log(emailData);
          sendResult = await EmailClient.sendTestEmail(emailData.testEmail, _customClient);
        } else {
          sendResult = await EmailClient.sendTestEmail(emailData.testEmail);
        }
      } else if (emailData.emailProvider === EMAIL_PROVIDER.GMAIL) {
        let _customThirdPartyClient = await EmailClient.createNewThirdpartyClient(emailData.emailUsername, emailData.emailPassword);
        console.log(_customThirdPartyClient);
        sendResult = await EmailClient.sendTestEmail(emailData.testEmail, _customThirdPartyClient);
      }

      if (sendResult) {
        resolve(sendResult);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('sendTestEmail failed');
    }
  });
}

async function sendTestSMS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let smsData = req.payload;
      let _smsConfig = smsData.smsConfig;
      let _customSMSClient = undefined;

      let sendResult = undefined;

      let _templates = await CustomerMessageFunctions.getTemplateMessages();
      let _sampleContent = _templates[0] ? _templates[0].messageTemplateContent : 'day la tin nhan thu nghiem';

      if (_smsConfig) {
        let smsProvider = _smsConfig.smsProvider;
        if (smsProvider === SMS_PROVIDER.VIVAS) {
          _customSMSClient = await SMSAPIFunctions.createClient(
            _smsConfig.smsUrl,
            _smsConfig.smsUserName,
            _smsConfig.smsPassword,
            _smsConfig.smsBrand,
          );
          sendResult = await SMSAPIFunctions.sendSMS(_sampleContent, [smsData.phoneNumber], _customSMSClient);
        } else if (smsProvider === SMS_PROVIDER.VIETTEL) {
          _customSMSClient = await SMSSOAPFunctions.createClient(
            _smsConfig.smsUrl,
            _smsConfig.smsUserName,
            _smsConfig.smsPassword,
            _smsConfig.smsCPCode,
            _smsConfig.smsServiceId,
          );

          sendResult = await SMSSOAPFunctions.sendSMS(_sampleContent, smsData.phoneNumber, _customSMSClient);
        } else if (smsProvider === SMS_PROVIDER.VMG) {
          _customSMSClient = await SMSVMGAPIFunctions.createClient(_smsConfig.smsUrl, _smsConfig.smsToken, _smsConfig.smsBrand);
          sendResult = await SMSVMGAPIFunctions.sendSMSMessage(smsData.phoneNumber, _sampleContent, _customSMSClient);
        }

        if (sendResult) {
          let messageCustomerSMSRecord = CustomerMessageFunctions.mappingResponseSMS(sendResult, smsProvider);

          sendResult = {
            ...sendResult,
            ...messageCustomerSMSRecord,
          };
        }
      }

      if (sendResult) {
        resolve(sendResult);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('sendTestSMS failed');
    }
  });
}

async function sendTestZNS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let znsData = req.payload;
      let _znsConfig = znsData.znsConfig;
      let _customZNSClient = undefined;

      let sendResult = undefined;

      if (_znsConfig) {
        let znsProvider = _znsConfig.znsProvider;
        if (znsProvider === SMS_PROVIDER.VMG) {
          const ZNSVMGAPIFunctions = require('../../../ThirdParty/ZNSVMGAPIClient/ZNSVMGAPIFunctions');
          _customZNSClient = await ZNSVMGAPIFunctions.createClient(_znsConfig.znsUrl, _znsConfig.znsToken, _znsConfig.znsBrand);
          const UNDEFINED_TRACK_ID = 0;
          const DEFINED_VMG_TEMPLATE_ID = 227966;
          sendResult = await ZNSVMGAPIFunctions.sendZNSMessage(
            znsData.phoneNumber,
            'day la tin nhan thu nghiem',
            _customZNSClient,
            UNDEFINED_TRACK_ID,
            DEFINED_VMG_TEMPLATE_ID,
            { bien_so_xe: 'bien_so_xe', ten_khach_hang: 'ten_khach_hang', ngay_het_han: 'ngay_het_han' },
          );
        }
      }

      if (sendResult) {
        resolve(sendResult);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('sendTestSMS failed');
    }
  });
}

function _mappingStatusByProvider(smsProvider, status) {
  const { MESSAGE_STATUS } = require('../CustomerMessageConstant');
  let mappedStatus = {
    messageSendStatus: MESSAGE_STATUS.SENDING,
    messageNote: '',
  };

  let _messageSendStatus = MESSAGE_STATUS.SENDING;
  let _messageNote = '';
  if (smsProvider === SMS_PROVIDER.VMG) {
    switch (status) {
      case 0: // 0: Tin chờ duyệt (bị giữ lại do chứa nội dung QC),
        _messageSendStatus = MESSAGE_STATUS.SENDING;
        _messageNote = '0: Tin chờ duyệt (bị giữ lại do chứa nội dung QC)';
        break;
      case -2: // -2: Gửi telco thất bại.
        _messageSendStatus = MESSAGE_STATUS.FAILED;
        _messageNote = '-2: Gửi telco thất bại.';
        break;
      case -1: // -1: Bị từ chối duyệt hoặc có lỗi khi kiểm tra thông tin
        _messageSendStatus = MESSAGE_STATUS.FAILED;
        _messageNote = '-1: Bị từ chối duyệt hoặc có lỗi khi kiểm tra thông tin';
        break;
      case 1: // 1: Đã được duyệt,
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '1: Đã được duyệt,';
        break;
      case 2: // 2: Gửi telco thành công,
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '2: Gửi telco thành công,';
        break;
      case 3: // 3: seen
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '3: seen';
        break;
      case 4: // 4: subscribe
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '4: subscribe';
        break;
      case 5: // 5: unsubscribe
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '5: unsubscribe';
        break;
      case 6: // 6: expired
        _messageSendStatus = MESSAGE_STATUS.CANCELED;
        _messageNote = '6: expired';
        break;
      default:
        break;
    }
  }
  mappedStatus = {
    messageSendStatus: _messageSendStatus,
    messageNote: _messageNote,
  };
  return mappedStatus;
}

async function receiveVMGResult(req) {
  return new Promise(async (resolve, reject) => {
    try {
      //msisdn: Số MT (interger)
      //requestId: Mã yêu cầu (String)
      //sendTime: Thời gian gửi tin (String)
      //responseTimeTelco: Thời gian gửi sang telco (chỉ áp dụng với callback SMS)(String)
      //status: Trạng thái tin (interger)
      //referentId: Mã chương trình chung của các message gửi (String)
      //retryCount: Số lần thử lại (integer)
      let smsData = req.payload;

      if (smsData.referentId) {
        const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
        let _sentCustomerMessage = await MessageCustomerResourceAccess.findById(smsData.referentId * 1);
        if (_sentCustomerMessage) {
          let updatedData = _mappingStatusByProvider(SMS_PROVIDER.VMG, smsData.status);
          await MessageCustomerResourceAccess.updateById(_sentCustomerMessage.messageCustomerId, updatedData);
        } else {
          reject('wrong referentId');
        }
      } else {
        reject('invalid referentId');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('receiveVMGResult failed');
    }
  });
}

async function reportTotalSMSByStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationId = req.payload.filter.stationId;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let monthlySMSCount = await CustomerMessageFunctions.countMonthlySMSByStation(stationId);

      if (!monthlySMSCount) {
        reject('failed');
      }
      let totalSMSCount = await CustomerMessageFunctions.sumCustomerSMS(stationId, startDate, endDate);

      if (totalSMSCount) {
        resolve({
          monthlySMSCount,
          totalSMSCount,
        });
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetListMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      filter.customerId = req.currentUser.appUserId;
      let customerMessage = await MessageCustomerView.customSearch(filter, skip, limit);

      if (customerMessage && customerMessage.length > 0) {
        const customerMessageCount = await MessageCustomerView.customCount(filter);

        const customerMessageData = customerMessage.map(message => {
          return {
            customerId: message.customerId,
            messageCustomerId: message.messageCustomerId,
            messageContent: message.messageContent,
            messageSendStatus: message.messageSendStatus,
            messageTitle: message.messageTitle,
            createdAt: message.createdAt,
            customerScheduleId: message.customerScheduleId,
            customerStationId: message.customerStationId,
          };
        });

        resolve({ data: customerMessageData, total: customerMessageCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetDetailMessageById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageId = req.payload.id;
      let _existingMessage = await MessageCustomerView.findById(customerMessageId);
      if (_existingMessage) {
        if (_existingMessage.customerId === req.currentUser.appUserId) {
          return resolve(_existingMessage);
        } else {
          return reject(MISSING_AUTHORITY);
        }
      }
      reject(NOT_FOUND);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  sendsms,
  sendMessageByFilter,
  sendMessageByCustomerList,
  findTemplates,
  sendTestEmail,
  sendTestSMS,
  sendTestZNS,
  receiveVMGResult,
  reportTotalSMSByStation,
  userGetListMessage,
  userGetDetailMessageById,
};
