/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Joi = require('joi');
const MessageCustomerView = require('../resourceAccess/MessageCustomerView');
const MessageCustomer = require('../resourceAccess/MessageCustomerResourceAccess');
const CustomerMessage = require('../resourceAccess/CustomerMessageResourceAccess');
const CustomerRecord = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const { MESSAGE_STATUS, MESSAGE_CATEGORY, SMS_PROVIDER, MESSAGE_SEND_STATUS } = require('../CustomerMessageConstant');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const MessageFunction = require('../CustomerMessageFunctions');
const Logger = require('../../../utils/logging');
const moment = require('moment');

async function _cancelAllSMSMessage(station) {
  let messageList = await CustomerMessage.find({
    customerMessageCategories: MESSAGE_CATEGORY.SMS,
    customerMessageStatus: MESSAGE_STATUS.NEW,
  });

  for (let i = 0; i < messageList.length; i++) {
    const messageObj = messageList[i];
    let failureFilter = {
      messageSendStatus: MESSAGE_STATUS.NEW,
      messageId: messageObj.customerMessageId,
      customerStationId: station.stationsId,
    };

    let sendSMSResultData = {
      messageSendStatus: MESSAGE_STATUS.CANCELED,
      messageNote: `Something wrong with SMS Config.`,
    };
    await MessageCustomer.updateAll(sendSMSResultData, failureFilter);
    await CustomerMessage.updateById(messageObj.customerMessageId, {
      customerMessageStatus: MESSAGE_STATUS.CANCELED,
    });
  }
}

async function sendMessageSMSToCustomer(station) {
  console.log(`sendMessageSMSToCustomer ${station.stationsId}`);
  return new Promise(async (resolve, reject) => {
    //Skip TEST station
    if (station.stationsId === 0) {
      Logger.info(`station empty ${station.stationsId} `);
      resolve('OK');
      return;
    }

    //Failure all message if station do not use SMS
    if (station.stationEnableUseSMS === 0) {
      Logger.info(`station ${station.stationsId} disabled SMS`);
      await _cancelAllSMSMessage(station);
      resolve('OK');
      return;
    }
    let _customSMSClient = undefined;
    let _customConfig = undefined;
    const ENABLED = 1;
    //Get sms client info if station use custom sms client
    if (station.stationUseCustomSMSBrand === ENABLED) {
      if (station.stationCustomSMSBrandConfig && station.stationCustomSMSBrandConfig !== null && station.stationCustomSMSBrandConfig.trim() !== '') {
        try {
          const _smsConfig = JSON.parse(station.stationCustomSMSBrandConfig);
          _customConfig = _smsConfig;
          if (_smsConfig.smsProvider === SMS_PROVIDER.VIETTEL) {
            //init for VIETTEL SERVICE
            const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');
            _customSMSClient = await SMSSOAPFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsCPCode,
              _smsConfig.smsServiceId,
            );
          } else if (_smsConfig.smsProvider === SMS_PROVIDER.VIVAS) {
            //init for VIVAS SERVICE
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            _customSMSClient = await SMSAPIClientFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsBrand,
            );
          } else if (_smsConfig.smsProvider === SMS_PROVIDER.VMG) {
            //init for VMG SERVICE
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            _customSMSClient = await SMSVMGAPIFunctions.createClient(_smsConfig.smsUrl, _smsConfig.smsToken, _smsConfig.smsBrand);
          } else {
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            _customSMSClient = await SMSAPIClientFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsBrand,
            );
          }
          if (_customSMSClient === undefined) {
            Logger.info(`station ${station.stationsId} enable custom but have wrong sms config`);
            Logger.info(station.stationCustomSMSBrandConfig);
            await _cancelAllSMSMessage(station);
            resolve('OK');
            return;
          }
        } catch (error) {
          Logger.info(`station ${station.stationsId} enable custom but convert custom sms config failed`);
          await _cancelAllSMSMessage(station);
          resolve('OK');
          return;
        }
      }
    }

    let messageList = await MessageCustomerView.find(
      {
        messageSendStatus: MESSAGE_STATUS.NEW,
        customerMessageCategories: MESSAGE_CATEGORY.SMS,
        customerStationId: station.stationsId,
      },
      0,
      100,
    );

    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        const _customerMessage = messageList[i];

        //neu khong co so dien thoai thi khong gui sms
        if (UtilsFunction.isInvalidStringValue(_customerMessage.customerMessagePhone)) {
          //cap nhat trang thai la CANCELED
          await MessageCustomer.updateById(_customerMessage.messageCustomerId, {
            messageSendStatus: MESSAGE_STATUS.CANCELED,
            messageContent: messageContent,
            messageTitle: messageContent,
            messageSendDate: new Date().toISOString(),
          });
          continue;
        }
        let _templateId = _customerMessage.customerMessageTemplateId;
        let messageContent = _customerMessage.customerMessageContent;

        //if using template, then generate content based on template
        if (_templateId && _templateId !== null && _templateId !== '') {
          let customer = await CustomerRecord.findById(_customerMessage.customerId);
          if (customer) {
            let templateContent = await MessageFunction.getMessageContentByTemplate(_templateId, station, customer);
            if (templateContent) {
              messageContent = templateContent;
            }
          }
        }

        messageContent = UtilsFunction.nonAccentVietnamese(messageContent);

        //cap nhat trang thai la SENDING
        await MessageCustomer.updateById(_customerMessage.messageCustomerId, {
          messageSendStatus: MESSAGE_STATUS.SENDING,
          messageContent: messageContent,
          messageTitle: messageContent,
          messageSendDate: new Date().toISOString(),
        });

        let sendSMSResultData = {
          messageSendStatus: MESSAGE_STATUS.SENDING,
        };

        //if we disable SMS
        if (process.env.SMS_ENABLE * 1 === 1) {
          let sendResult = undefined;

          sendSMSResultData.externalReceiveDate = new Date();

          if (_customConfig && _customConfig.smsProvider === SMS_PROVIDER.VIETTEL) {
            const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');
            sendResult = await SMSSOAPFunctions.sendSMS(messageContent, _customerMessage.customerMessagePhone, _customSMSClient);

            if (sendResult) {
              sendSMSResultData = MessageFunction.mappingResponseSMS(sendResult, _customConfig.smsProvider);
            } else {
              sendSMSResultData.messageSendStatus = MESSAGE_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          } else if (_customConfig && _customConfig.smsProvider === SMS_PROVIDER.VIVAS) {
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            sendResult = await SMSAPIClientFunctions.sendSMS(messageContent, [_customerMessage.customerMessagePhone], _customSMSClient);

            if (sendResult) {
              sendSMSResultData = MessageFunction.mappingResponseSMS(sendResult, _customConfig.smsProvider);
            } else {
              sendSMSResultData.messageSendStatus = MESSAGE_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          } else if (_customConfig && _customConfig.smsProvider === SMS_PROVIDER.VMG) {
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            sendResult = await SMSVMGAPIFunctions.sendSMSMessage(
              _customerMessage.customerMessagePhone,
              messageContent,
              _customSMSClient,
              _customerMessage.messageCustomerId,
            );

            if (sendResult) {
              sendSMSResultData = MessageFunction.mappingResponseSMS(sendResult, _customConfig.smsProvider);
            } else {
              sendSMSResultData.messageSendStatus = MESSAGE_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          } else {
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            sendResult = await SMSVMGAPIFunctions.sendSMSMessage(
              _customerMessage.customerMessagePhone,
              messageContent,
              undefined,
              _customerMessage.messageCustomerId,
            );

            if (sendResult) {
              sendSMSResultData = MessageFunction.mappingResponseSMS(sendResult, SMS_PROVIDER.VMG);
            } else {
              sendSMSResultData.messageSendStatus = MESSAGE_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          }

          //neu da gui sms thanh cong thi cap nhat ngay notify cho customer
          if (sendResult) {
            await CustomerRecord.updateById(_customerMessage.customerId, {
              customerRecordSMSNotifyDate: new Date(),
            });
          }
        } else {
          sendSMSResultData.messageSendStatus = MESSAGE_STATUS.CANCELED;
          sendSMSResultData.messageNote = `SMS_SERVICE_DISABLED`;
        }

        await MessageCustomer.updateById(_customerMessage.messageCustomerId, sendSMSResultData);
      }
      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}

module.exports = {
  sendMessageSMSToCustomer,
};
