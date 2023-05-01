/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Joi = require('joi');
const moment = require('moment');
const MessageCustomerView = require('../resourceAccess/MessageCustomerView');
const MessageCustomer = require('../resourceAccess/MessageCustomerResourceAccess');
const CustomerMessage = require('../resourceAccess/CustomerMessageResourceAccess');
const CustomerRecord = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const { MESSAGE_STATUS, MESSAGE_CATEGORY } = require('../CustomerMessageConstant');
const EmailClient = require('../../../ThirdParty/Email/EmailClient');
const MessageFunction = require('../CustomerMessageFunctions');
const Logger = require('../../../utils/logging');
const CustomerMessageResourceAccess = require('../resourceAccess/CustomerMessageResourceAccess');
const StaffResourceAccess = require('../../Staff/resourceAccess/StaffResourceAccess');

async function _cancelAllEmailMessage(station) {
  let messageList = await CustomerMessage.find({
    customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
    customerMessageStatus: MESSAGE_STATUS.NEW,
  });

  for (let i = 0; i < messageList.length; i++) {
    const messageObj = messageList[i];
    let failureFilter = {
      messageSendStatus: MESSAGE_STATUS.NEW,
      messageId: messageObj.customerMessageId,
      customerStationId: station.stationsId,
    };

    let updatedMessageData = {
      messageSendStatus: MESSAGE_STATUS.CANCELED,
      messageNote: `Something wrong with Email Config.`,
    };
    await MessageCustomer.updateAll(updatedMessageData, failureFilter);
    await CustomerMessage.updateById(messageObj.customerMessageId, {
      customerMessageStatus: MESSAGE_STATUS.CANCELED,
    });
  }
}

async function sendMessageEmailToCustomer(station) {
  console.log(`sendMessageEmailToCustomer ${station.stationsId}`);
  return new Promise(async (resolve, reject) => {
    //init email client for station
    let customEmailClient = await MessageFunction.initEmailClientForStation(station);

    if (!process.env.SMTP_ENABLE || process.env.SMTP_ENABLE * 1 === 0) {
      await _cancelAllEmailMessage(station);
      return resolve('OK');
    }
    //if there is no email client then mark all task are failed
    if (customEmailClient === undefined || customEmailClient === null) {
      await _cancelAllEmailMessage(station);
      Logger.error(`Station ${station.stationsId} can not create new smtp client`);
      resolve('OK');
      return;
    }

    let messageList = await MessageCustomerView.find(
      {
        messageSendStatus: MESSAGE_STATUS.NEW,
        customerMessageCategories: MESSAGE_CATEGORY.EMAIL,
        customerStationId: station.stationsId,
      },
      0,
      100,
    );

    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        const _customerMessage = messageList[i];
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

        let updatedMessageData = {
          messageSendStatus: MESSAGE_STATUS.FAILED,
        };

        //if valid email then process
        if (Joi.string().email().validate(_customerMessage.customerMessageEmail).error === null) {
          let sendResult = undefined;
          sendResult = await EmailClient.sendEmail(
            _customerMessage.customerMessageEmail,
            _customerMessage.customerMessageTitle,
            messageContent,
            '',
            customEmailClient,
          );

          //if send success
          if (sendResult !== undefined) {
            updatedMessageData.messageSendStatus = MESSAGE_STATUS.COMPLETED;
            updatedMessageData.messageNote = sendResult;
            await CustomerRecord.updateById(_customerMessage.customerId, {
              customerRecordEmailNotifyDate: new Date(),
            });
          } else {
            updatedMessageData.messageNote = `Send fail`;
          }
        } else {
          updatedMessageData.messageNote = `wrong email format`;
        }

        await MessageCustomer.updateById(_customerMessage.messageCustomerId, updatedMessageData);
      }

      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}

async function sendCountSMSToEmailMonthly() {
  let startDate = moment().startOf('month').add(-1, 'month').format();
  let endDate = moment().endOf('month').add(-1, 'month').format();
  let count = await CustomerMessageResourceAccess.customCount(undefined, startDate, endDate, undefined);
  let emalilList = await StaffResourceAccess.find({ roleId: 1 }, undefined, 100, undefined);
  let subject = 'Báo cáo số lượng SMS hàng tháng';
  let mailBody =
    'Hệ thông VTSS gửi thông báo' + '\r\n\r\n' + `Xin chào, trong tháng ${moment().format('MM') - 1} có tất cả ${count} SMS được tạo. Xin cảm ơn!!`;
  for (let i = 0; i < emalilList.length; i++) {
    await EmailClient.sendEmail(emalilList[i].email, subject, mailBody, undefined, undefined);
  }
}

module.exports = {
  sendMessageEmailToCustomer,
  sendCountSMSToEmailMonthly,
};
