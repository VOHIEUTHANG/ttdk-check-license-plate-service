/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Handlebars = require('handlebars');
const moment = require('moment');
const CustomerMessageResourceAccess = require('./resourceAccess/CustomerMessageResourceAccess');
const MessageCustomerResourceAccess = require('./resourceAccess/MessageCustomerResourceAccess');
const MessageTemplateResourceAccess = require('../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const StationsResource = require('../Stations/resourceAccess/StationsResourceAccess');
const CustomerRecord = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const CustomerSchedule = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const ApiUtilsFunctions = require('../ApiUtils/utilFunctions');
const EmailClient = require('../../ThirdParty/Email/EmailClient');
const CustomerStatisticalFunction = require('../CustomerStatistical/CustomerStatisticalFunctions');
const AppUserResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

const { MESSAGE_CATEGORY, MESSAGE_SEND_STATUS, MESSAGE_PRICES, MESSAGE_STATUS, SMS_PROVIDER } = require('../CustomerMessage/CustomerMessageConstant');
const FUNC_SUCCESS = 1;
const FUNC_FAILED = undefined;

const Logger = require('../../utils/logging');

let messageTemplate = [
  // {
  //   messageTemplateId: 1,
  //   messageTemplateContent: "{{stationsBrandname}} mời bạn đăng ký đăng kiểm tại {{stationsAddress}} cho ô tô BKS số {{customerRecordPlatenumber}}",
  //   messageTemplateName: "CSKH",
  //   messageTemplateScope: [CustomerRecord.modelName],
  //   messageZNSTemplateId: null, //chua dang ky
  // },
  {
    messageTemplateId: 1,
    messageTemplateName: 'Nhắc đăng kiểm mẫu 1',
    messageTemplateContent:
      '{{stationsBrandname}} {{stationsAddress}} kinh bao: Xe {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach can ho tro vui long lien he {{stationsHotline}}',
    messageTemplateScope: [CustomerRecord.modelName],
    messageZNSTemplateId: 227966,
  },
  // {
  //   messageTemplateId: 2,
  //   messageTemplateName: "Nhắc đăng kiểm mẫu 2",
  //   messageTemplateContent: "{{stationsBrandname}} {{stationsAddress}} t/t thong bao: oto bien so {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Lien he dat lich kiem dinh tai {{stationUrl}}. T/t cam on",
  //   messageTemplateScope: [CustomerRecord.modelName],
  //   messageZNSTemplateId: 227967,
  // },
  // {
  //   messageTemplateId: 4,
  //   messageTemplateName: "Nhắc đăng kiểm mẫu 3",
  //   messageTemplateContent: "{{stationsBrandname}} {{stationsAddress}} Thong bao: Xe {{customerRecordPlatenumber}} het han dang kiem ngay {{customerRecordCheckExpiredDate}}. Rat han hanh duoc phuc vu. LH: {{stationsHotline}}",
  //   messageTemplateScope: [CustomerRecord.modelName],
  //   messageZNSTemplateId: 227928
  // },
  // {
  //   messageTemplateId: 5,
  //   messageTemplateName: "Nhắc đăng kiểm mẫu 4",
  //   messageTemplateContent: "Xe {{customerRecordPlatenumber}} het han dang kiem ngay {{customerRecordCheckExpiredDate}}. Chung toi thong bao den quy khach kiem dinh dung thoi han. {{stationsBrandname}} {{stationsAddress}} han hanh duoc phuc vu. LH: {{stationsHotline}}",
  //   messageTemplateScope: [CustomerRecord.modelName],
  //   messageZNSTemplateId: null, //chua dang ky
  // },
  {
    messageTemplateId: 2,
    messageTemplateName: 'Nhắc đăng kiểm mẫu 2',
    messageTemplateContent:
      'TT Dang kiem 29-02V Phu Thi-Gia Lam-HN kinh bao: Xe {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach can ho tro vui long lien he 0888939836/0936310333',
    messageTemplateScope: [CustomerRecord.modelName],
    messageZNSTemplateId: 227967,
    stationsId: 290,
  },
  {
    messageTemplateId: 3,
    messageTemplateName: 'Nhắc đăng kiểm mẫu 2',
    messageTemplateContent:
      'TTDK Cau Giay t/t thong bao: oto bien so {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach co the lien he dat lich kiem chuan tai ttdk2903v.com. T/t cam on.',
    messageTemplateScope: [CustomerRecord.modelName],
    messageZNSTemplateId: 227967,
    stationsId: 162,
  },
];

async function _fetchTemplate() {
  console.info(`_fetchTemplate ${new Date()}`);
  let _messageList = await MessageTemplateResourceAccess.find({}, 0, 100);
  messageTemplate = _messageList;
  console.info(`messageTemplate: ${messageTemplate.length}`);
}

function _importDataForMessage(customer) {
  return {
    customerMessageEmail: customer.customerRecordEmail,
    customerMessagePhone: customer.customerRecordPhone,
    customerMessagePlateNumber: customer.customerRecordPlatenumber,
    customerId: customer.customerRecordId,
  };
}

async function checkValidTemplateMessage(messageTemplateId) {
  //check if using template and template is valid
  let templateData = undefined;
  if (messageTemplateId) {
    templateData = await MessageTemplateResourceAccess.findById(messageTemplateId);

    if (templateData === undefined) {
      Logger.error(`there is no template with id ${messageTemplateId}`);
      return FUNC_FAILED;
    }
  }
  return templateData;
}

async function getMessageContentByTemplate(messageTemplateId, station, customer) {
  //check if station / customer data is valid
  if (station === undefined || customer === undefined) {
    return FUNC_FAILED;
  }

  //check if using template and template is valid
  let templateData = await checkValidTemplateMessage(messageTemplateId);
  if (templateData === undefined) {
    Logger.error(`there is no template with id ${messageTemplateId}`);
    return FUNC_FAILED;
  }

  customer.customerRecordCheckExpiredDate = moment(customer.customerRecordCheckExpiredDate).format('DD/MM/YYYY');
  customer.customerRecordPlatenumber = customer.customerRecordPlatenumber.toUpperCase();
  let _smsConfig = undefined;
  try {
    _smsConfig = JSON.parse(station.stationCustomSMSBrandConfig);
  } catch (error) {
    console.error(`parse error 131`);
  }

  //generate content by template & customer data
  let templateParams = {
    ...customer,
    ...station,
    stationsBrandname: _smsConfig ? _smsConfig.smsBrand : '',
  };

  //if this message is "REMIND SCHEDULE" message
  //else default is "CUSTOMER SERVICE" message
  if (templateData.messageTemplateScope && templateData.messageTemplateScope.indexOf(CustomerSchedule.modelName) > -1) {
    let scheduleData = CustomerSchedule.find({
      licensePlates: customer.customerRecordPlatenumber,
    });
    if (scheduleData && scheduleData.length > 0) {
      scheduleData = scheduleData[0];
      templateParams = {
        ...templateParams,
        ...scheduleData,
      };
    }
  }

  let customerMessageContent = Handlebars.compile(templateData.messageTemplateContent)(templateParams);
  return customerMessageContent;
}

async function _createNewMessage(stationsId, customerMessageContent, customerMessageCategories, customerMessageTemplateId) {
  let _enableUsingTemplate = false;

  let templateContent = await checkValidTemplateMessage(customerMessageTemplateId);
  if (templateContent) {
    _enableUsingTemplate = true;
  }

  //get station info
  let station = await StationsResource.findById(stationsId);
  if (station === undefined) {
    return FUNC_FAILED;
  }

  //create data for message
  let dataMessage = {
    customerMessageCategories: customerMessageCategories,
    customerMessageContent: customerMessageContent,
    customerStationId: stationsId,
    customerMessageTitle: `Thông báo hệ thống từ ${station.stationsName}`,
  };

  if (_enableUsingTemplate) {
    dataMessage.customerMessageContent = templateContent.messageTemplateContent;
    dataMessage.customerMessageTemplateId = customerMessageTemplateId;
  }

  let messageId = await CustomerMessageResourceAccess.insert(dataMessage);
  if (messageId) {
    messageId = messageId[0];
    return messageId;
  } else {
    return undefined;
  }
}

async function createNewUserMessageByStation(phoneNumber, stationsId, messageContent, plateNumber, appUserId, scheduleId, appUserVehicleId) {
  let _newCustomerList = [
    {
      customerRecordEmail: null,
      customerRecordPhone: phoneNumber,
      customerRecordPlatenumber: plateNumber,
      customerRecordId: appUserId,
    },
  ];
  await sendMessageToManyCustomer(_newCustomerList, stationsId, messageContent, MESSAGE_CATEGORY.SMS, undefined, scheduleId, appUserVehicleId);

  return true;
}

//otherData: appUserVehicleId, customerRecordId, customerScheduleId
async function createMessageForCustomerOnly(messageTitle, messageContent, customerId, phoneNumber, email, otherData) {
  const messageCustomerData = {
    messageTitle: messageTitle,
    customerId: customerId || 0,
    messageContent: messageContent,
    customerMessageEmail: email || '',
    customerMessagePhone: phoneNumber || '',
  };
  if (otherData) {
    if (otherData.appUserVehicleId) {
      messageCustomerData.appUserVehicleId = otherData.appUserVehicleId;
    }

    if (otherData.customerScheduleId) {
      messageCustomerData.customerScheduleId = otherData.customerScheduleId;
    }

    if (otherData.customerRecordId) {
      messageCustomerData.customerRecordId = otherData.customerRecordId;
    }
  }

  return await MessageCustomerResourceAccess.insert(messageCustomerData);
}

async function addMessageCustomer(
  messageTitle,
  stationsId,
  messageContent,
  plateNumber,
  customerId,
  email,
  appUserVehicleId,
  customerRecordId,
  customerScheduleId,
) {
  const messageCustomerData = {
    messageTitle: messageTitle,
    customerId: customerId || 0,
    customerStationId: stationsId || 0,
    customerMessagePlateNumber: plateNumber || '',
    messageContent: messageContent,
    customerMessageEmail: email || '',
    // customerMessagePhone: phoneNumber || '',
  };
  if (appUserVehicleId) {
    messageCustomerData.appUserVehicleId = appUserVehicleId;
  }
  if (customerRecordId) {
    messageCustomerData.customerRecordId = customerRecordId;
  }

  if (customerScheduleId) {
    messageCustomerData.customerScheduleId = customerScheduleId;
  }

  return await MessageCustomerResourceAccess.insert(messageCustomerData);
}

//Send message to many customer
async function sendMessageToManyCustomer(
  customerList,
  stationsId,
  customerMessageContent,
  customerMessageCategories,
  customerMessageTemplateId,
  scheduleId,
  appUserVehicleId,
) {
  if (customerList.length <= 0) {
    return FUNC_SUCCESS;
  }

  //create new MessageCustomer object
  let messageId = await _createNewMessage(stationsId, customerMessageContent, customerMessageCategories, customerMessageTemplateId);
  if (messageId === undefined) {
    Logger.error(`can not create new message`);
    return FUNC_FAILED;
  }

  let messageList = [];

  let stationData = await StationsResource.findById(stationsId);

  //get Message content and split into 1 message for each customer
  const baseMessage = {
    messageId: messageId,
    customerStationId: stationsId,
  };

  if (scheduleId) {
    baseMessage.customerScheduleId = scheduleId;
  }

  if (appUserVehicleId) {
    baseMessage.appUserVehicleId = appUserVehicleId;
  }

  for (var i = 0; i < customerList.length; i++) {
    const customer = customerList[i];
    let customerMessage = Object.assign(_importDataForMessage(customer), baseMessage);

    let temp = Handlebars.compile(customerMessageContent);
    if (stationData) {
      customerMessage.messageContent = temp({
        stationsBrandname: stationData.stationsName,
        stationsAddress: stationData.stationsAddress,
        customerRecordPlatenumber: customer.customerRecordPlatenumber,
        customerRecordCheckExpiredDate: customer.customerRecordCheckExpiredDate,
        stationsHotline: stationData.stationsHotline,
      });
    } else {
      customerMessage.messageContent = temp({
        stationsBrandname: '',
        stationsAddress: '',
        customerRecordPlatenumber: '',
        customerRecordCheckExpiredDate: '',
        stationsHotline: '',
      });
    }
    messageList.push(customerMessage);
  }

  //Chunk messageList array into multiple batches of 100 to prevent DB Crash
  if (messageList.length > 100) {
    let batches = await ApiUtilsFunctions.chunkArray(messageList, 100);
    for (var i = 0; i < batches.length; i++) {
      await MessageCustomerResourceAccess.insert(batches[i]);
    }
  } else {
    await MessageCustomerResourceAccess.insert(messageList);
  }

  if (messageList.length > 0) {
    return messageList.length;
  } else {
    return FUNC_SUCCESS;
  }
}

async function getTemplateMessages(stationId) {
  let _usableTemplate = [];
  let _messageTemplates = await MessageTemplateResourceAccess.find({}, 0, 100);
  for (let i = 0; i < _messageTemplates.length; i++) {
    const _template = _messageTemplates[i];
    if (_template.stationsId && stationId && _template.stationsId === stationId) {
      _usableTemplate.push(_template);
    }

    if (_template.stationsId === undefined || _template.stationsId === null) {
      _usableTemplate.push(_template);
    }
  }
  return _usableTemplate;
}

async function initEmailClientForStation(station) {
  //Skip TEST station
  if (station.stationsId === 0) {
    return undefined;
  }

  const ENABLED = 1;
  //default - no custom client
  let customEmailClient = undefined;
  let _smtpConfig = undefined;

  //check if Station have email config
  if (station.stationCustomSMTPConfig && station.stationCustomSMTPConfig.trim() !== '' && station.stationCustomSMTPConfig !== null) {
    //try to parse smtp config
    try {
      _smtpConfig = JSON.parse(stationConfigs.stationCustomSMTPConfig);
    } catch (error) {
      Logger.error(`Station ${station.stationsId} can not convert stationCustomSMTPConfig`);
      return undefined;
    }
  } else {
    return undefined;
  }

  //init email client for station
  if (station.stationUseCustomSMTP === ENABLED) {
    customEmailClient = await EmailClient.createNewClient(
      _smtpConfig.smtpHost,
      _smtpConfig.smtpPort,
      _smtpConfig.smtpSecure,
      _smtpConfig.smtpAuth.user,
      _smtpConfig.smtpAuth.pass,
    );
  } else {
    customEmailClient = await EmailClient.createNewThirdpartyClient(
      _smtpConfig.smtpAuth.user,
      _smtpConfig.smtpAuth.pass,
      _smtpConfig.smtpServiceName,
      _smtpConfig.smtpHost,
    );
  }

  return customEmailClient;
}

async function sumCustomerSMS(stationId, startDate, endDate) {
  return new Promise(async (resolve, reject) => {
    try {
      // Total succeed message was sent.
      const totalSucceedSMSCount = await CustomerStatisticalFunction.countMessagebyDate(
        {
          customerStationId: stationId,
          customerMessageCategories: MESSAGE_CATEGORY.SMS,
          messageSendStatus: MESSAGE_SEND_STATUS.COMPLETED,
        },
        startDate,
        endDate,
      );

      const totalSMSCount = {
        total: await CustomerStatisticalFunction.countMessagebyDate(
          {
            customerStationId: stationId,
            customerMessageCategories: MESSAGE_CATEGORY.SMS,
          },
          startDate,
          endDate,
        ),
        cost: totalSucceedSMSCount * MESSAGE_PRICES.SMS,
        completed: totalSucceedSMSCount,
        sending: await CustomerStatisticalFunction.countMessagebyDate(
          {
            customerStationId: stationId,
            customerMessageCategories: MESSAGE_CATEGORY.SMS,
            messageSendStatus: MESSAGE_SEND_STATUS.SENDING,
          },
          startDate,
          endDate,
        ),
        failed: await CustomerStatisticalFunction.countMessagebyDate(
          {
            customerStationId: stationId,
            customerMessageCategories: MESSAGE_CATEGORY.SMS,
            messageSendStatus: MESSAGE_SEND_STATUS.FAILED,
          },
          startDate,
          endDate,
        ),
        new: await CustomerStatisticalFunction.countMessagebyDate(
          {
            customerStationId: stationId,
            customerMessageCategories: MESSAGE_CATEGORY.SMS,
            messageSendStatus: MESSAGE_SEND_STATUS.NEW,
          },
          startDate,
          endDate,
        ),
      };

      totalSMSCount.canceled = totalSMSCount.total - (totalSMSCount.completed + totalSMSCount.failed + totalSMSCount.sending + totalSMSCount.new);

      return resolve(totalSMSCount);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function countMonthlySMSByStation(stationId) {
  return new Promise(async (resolve, reject) => {
    try {
      const numberOfMonth = 6;
      let monthBegin = moment().subtract({ months: numberOfMonth }).date(1);
      let monthEnd = moment().subtract({ months: numberOfMonth }).endOf('M');
      let smsCount, month;
      let _startDate, _endDate;
      let monthlySMSCount = [];
      let monthlySucceedCount = 0;

      for (let i = 0; i <= numberOfMonth; i++) {
        _startDate = monthBegin.format('DD/MM/YYYY');
        _endDate = monthEnd.format('DD/MM/YYYY');

        // Total succeed message was sent by month.
        monthlySucceedCount = await CustomerStatisticalFunction.countMessagebyDate(
          {
            customerStationId: stationId,
            customerMessageCategories: MESSAGE_CATEGORY.SMS,
            messageSendStatus: MESSAGE_SEND_STATUS.COMPLETED,
          },
          _startDate,
          _endDate,
        );

        smsCount = {
          total: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.SMS,
            },
            _startDate,
            _endDate,
          ),
          cost: monthlySucceedCount * MESSAGE_PRICES.SMS,
          completed: monthlySucceedCount,
          sending: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.SMS,
              messageSendStatus: MESSAGE_SEND_STATUS.SENDING,
            },
            _startDate,
            _endDate,
          ),
          failed: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.SMS,
              messageSendStatus: MESSAGE_SEND_STATUS.FAILED,
            },
            _startDate,
            _endDate,
          ),
          new: await CustomerStatisticalFunction.countMessagebyDate(
            {
              customerStationId: stationId,
              customerMessageCategories: MESSAGE_CATEGORY.SMS,
              messageSendStatus: MESSAGE_SEND_STATUS.NEW,
            },
            _startDate,
            _endDate,
          ),
        };

        smsCount.canceled = smsCount.total - (smsCount.completed + smsCount.failed + smsCount.sending + smsCount.new);

        // Only add numberOfMonth
        if (i > 0) {
          month = monthBegin.format('YYYY/MM');
          monthlySMSCount.push({
            month,
            smsCount,
          });
        }

        // Go to next month
        if (i !== numberOfMonth) {
          monthBegin = monthBegin.add({ months: 1 });
          monthEnd = monthEnd.add({ months: 1 }).endOf('M');
        }
      }

      resolve(monthlySMSCount);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

function _mappingResponseSMSVivas(responseSMS) {
  const SMSAPIFunctions = require('./../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');

  let mappedStatusSendSMS = {
    externalResult: '0: Request được tiếp nhận thành công',
  };

  let code = responseSMS.code;

  if (code !== undefined) {
    mappedStatusSendSMS.externalStatus = responseSMS.code;

    if (code !== 0) {
      let responseError = SMSAPIFunctions.responseReceiveValidSMSVivas[code];
      mappedStatusSendSMS.externalResult = responseError ? responseError.errorMessage : `error ${code}`;

      if (code === 4) {
        mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.CANCELED;
      } else if (code === 1 || code === 2 || code === 5) {
        mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.SENDING;
      } else {
        mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.FAILED;
      }
    } else {
      let responseMessage = SMSAPIFunctions.responseReceiveValidSMSVivas[code];

      mappedStatusSendSMS.externalResult = responseMessage ? responseMessage.errorMessage : `error ${code}`;
      mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.COMPLETED;
      mappedStatusSendSMS.customerReceiveDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    mappedStatusSendSMS.externalStatus = '-1';
  }

  if (responseSMS.transactionid) {
    mappedStatusSendSMS.externalInfo = responseSMS.transactionid;
  }

  mappedStatusSendSMS.messageNote = JSON.stringify(responseSMS);
  mappedStatusSendSMS.externalProvider = SMS_PROVIDER.VIVAS;

  return mappedStatusSendSMS;
}

function _mappingResponseSMSVMG(responseSMS) {
  const SMSVMGAPIFunctions = require('./../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
  let mappedStatusSendSMS = {
    messageSendStatus: MESSAGE_STATUS.SENDING,
    externalResult: '- NoError Không lỗi',
  };

  let code = responseSMS.errorCode;
  if (code !== undefined) {
    mappedStatusSendSMS.externalStatus = code;
    if (code !== '000') {
      console.info(`sendSMS error code : ${responseSMS.errorMessage}`);
      let responseError = SMSVMGAPIFunctions.responseSMSVMG[code];
      mappedStatusSendSMS.externalResult = responseError ? responseError.errorMessage : `error ${code}`;
      mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.FAILED;
    } else {
      console.info(`sendSMS: ${responseSMS.errorMessage}`);
      let responseMessage = SMSVMGAPIFunctions.responseSMSVMG[code];
      let data = responseSMS.data ? responseSMS.data : {};
      console.info(data);
      mappedStatusSendSMS.externalResult = responseMessage ? responseMessage.errorMessage : `error ${code}`;
      mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.COMPLETED;
      mappedStatusSendSMS.customerReceiveDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    mappedStatusSendSMS.externalStatus = '-1';
  }

  if (responseSMS.referentId) {
    mappedStatusSendSMS.externalInfo = responseSMS.referentId;
  }

  mappedStatusSendSMS.messageNote = JSON.stringify(responseSMS);

  mappedStatusSendSMS.externalProvider = SMS_PROVIDER.VMG;
  return mappedStatusSendSMS;
}

function _mappingResponseSMSViettel(responseSMS) {
  const SMSSOAPFunctions = require('./../../ThirdParty/SMSSoapClient/SMSClientFunctions');
  let mappedStatusSendSMS = {
    messageSendStatus: MESSAGE_STATUS.SENDING,
    externalResult: 'Insert MT_QUEUE: OK',
  };
  let code = responseSMS.result;
  let errorMessageResponse = responseSMS.errorMessageResponse;

  if (code !== 0) {
    console.info(`sendSMS error : ${errorMessageResponse}`);
    let responseError = SMSSOAPFunctions.responseSMSViettel(errorMessageResponse);
    mappedStatusSendSMS.externalStatus = responseError.errorCode;
    mappedStatusSendSMS.externalResult = responseError ? responseError.errorMessage : `error ${code}`;
    mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.FAILED;
  } else {
    console.info(`sendSMS: Insert MT_QUEUE: OK`);
    mappedStatusSendSMS.messageSendStatus = MESSAGE_STATUS.COMPLETED;
    mappedStatusSendSMS.externalStatus = code;
    mappedStatusSendSMS.customerReceiveDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
  }

  mappedStatusSendSMS.externalInfo = mappedStatusSendSMS.externalResult;
  mappedStatusSendSMS.messageNote = JSON.stringify(responseSMS);
  mappedStatusSendSMS.externalProvider = SMS_PROVIDER.VIETTEL;
  return mappedStatusSendSMS;
}

function mappingResponseSMS(responseSMS, smsProvider) {
  let mappedResponseResult = {};
  if (smsProvider === SMS_PROVIDER.VIVAS) {
    mappedResponseResult = _mappingResponseSMSVivas(responseSMS);
  } else if (smsProvider === SMS_PROVIDER.VMG) {
    mappedResponseResult = _mappingResponseSMSVMG(responseSMS);
  } else {
    mappedResponseResult = _mappingResponseSMSViettel(responseSMS);
  }

  return mappedResponseResult;
}

async function createCrimeNotification(crime, appUserId, appUserVehicleId) {
  if (crime.status === 'Chưa xử phạt' && appUserId) {
    const customerInfo = await AppUserResourceAccess.findById(appUserId);
    const messageTitle = `Cảnh báo ! BSX ${crime.licenseNumber} có vé phạt nguội`;
    const message = `Phương tiện có biển số ${crime.licenseNumber} có vé phạt nguội, vui lòng kiểm tra và xử lý trước khi đăng kiểm`;

    await addMessageCustomer(messageTitle, undefined, message, undefined, appUserId, customerInfo ? customerInfo.email : '', appUserVehicleId);
  }
}

module.exports = {
  createNewUserMessageByStation,
  getTemplateMessages,
  sendMessageToManyCustomer,
  getMessageContentByTemplate,
  initEmailClientForStation,
  countMonthlySMSByStation,
  sumCustomerSMS,
  mappingResponseSMS,
  addMessageCustomer,
  createMessageForCustomerOnly,
  createCrimeNotification,
};
