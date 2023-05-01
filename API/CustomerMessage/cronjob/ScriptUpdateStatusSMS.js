/* Copyright (c) 2022 TORITI LIMITED 2022 */

const MessageCustomer = require('../resourceAccess/MessageCustomerResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const MessageFunction = require('../CustomerMessageFunctions');
const { SMS_PROVIDER, MESSAGE_SEND_STATUS } = require('../CustomerMessageConstant');
const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
const moment = require('moment');

async function updateStatusForSendingSMS() {
  console.info(`start updateStatusForSendingSMS: ${new Date()}`);
  let counterSkip = 0;
  while (true) {
    let _customSMSClient = undefined;
    let _customConfig = undefined;

    let updatedMessageData = undefined;
    let _messageData = await MessageCustomerResourceAccess.find(
      {
        messageSendStatus: MESSAGE_SEND_STATUS.SENDING,
      },
      counterSkip,
      1,
    );
    counterSkip++;
    //neu co message thi xu ly
    if (_messageData && _messageData.length > 0) {
      _messageData = _messageData[0];
      console.info(`updateStatusForSendingSMS: ${_messageData.messageCustomerId}`);

      let now = moment();
      let minutesDiff = moment(now).diff(_messageData.messageSendDate, 'minutes');
      //neu da gui duoc 5 phut thi moi bat dau kiem tra status
      if (minutesDiff >= 5) {
        //goi API cua nha cung cap de lay status cua sms
        let station = await StationsResourceAccess.findById(_messageData.customerStationId);
        try {
          let _transactionId = _messageData.externalInfo;
          const _smsConfig = JSON.parse(station.stationCustomSMSBrandConfig);
          _customConfig = _smsConfig;

          let responseStatus = undefined;
          if (!_transactionId || _transactionId === null || _transactionId === '') {
            await MessageCustomer.updateById(_messageData.messageCustomerId, {
              messageSendStatus: MESSAGE_SEND_STATUS.FAILED,
              messageNote: 'INVALID_TRANSACTION_ID',
            });
            continue;
          }

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

            //kiem tra status cua sms.
            responseStatus = SMSSOAPFunctions.checkSMSStatusById(_transactionId, _customSMSClient);
          } else if (_smsConfig.smsProvider === SMS_PROVIDER.VIVAS) {
            const SMSAPIFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            _customSMSClient = await SMSAPIFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsBrand,
            );
            //init for VIVAS SERVICE
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            //kiem tra status cua sms.
            responseStatus = await SMSAPIClientFunctions.checkSMSStatusById(_transactionId, _customSMSClient);
            console.log(responseStatus);
          } else if (_smsConfig.smsProvider === SMS_PROVIDER.VMG) {
            //init for VMG SERVICE
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            _customSMSClient = await SMSVMGAPIFunctions.createClient(_smsConfig.smsUrl, _smsConfig.smsToken, _smsConfig.smsBrand);
            responseStatus = await SMSVMGAPIFunctions.checkSMSStatusById(_transactionId, _customSMSClient);
          }

          if (responseStatus) {
            updatedMessageData = MessageFunction.mappingResponseSMS(responseStatus, _customConfig.smsProvider);
            console.log(updatedMessageData);
            await MessageCustomer.updateById(_messageData.messageCustomerId, updatedMessageData);
          }
        } catch (error) {
          console.error(error);
          continue;
        }
      } else {
        //neu da gui chua duoc 5 phut thi bo qua
        continue;
      }
    } else {
      //neu het message roi thi break stop process
      break;
    }
  }
  console.info(`finish updateStatusForSendingSMS: ${new Date()}`);
}

module.exports = {
  updateStatusForSendingSMS,
};
