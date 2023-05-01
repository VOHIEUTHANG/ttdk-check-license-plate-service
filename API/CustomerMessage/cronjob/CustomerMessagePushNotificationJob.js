/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
const { MESSAGE_SEND_STATUS } = require('../CustomerMessageConstant');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const Logger = require('../../../utils/logging');
const { pushNotificationByTopic } = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');

async function _cancelAllSMSMessage() {
  while (true) {
    let messageList = await MessageCustomerResourceAccess.find(
      {
        messageFCMStatus: MESSAGE_SEND_STATUS.NEW,
      },
      0,
      100,
    );
    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        await MessageCustomerResourceAccess.updateById(messageList[i].messageCustomerId, {
          messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
        });
      }
    } else {
      break;
    }
  }
}

async function sendFCMToAllCustomer() {
  console.info(`sendFCMToAllCustomer ${new Date()}`);
  return new Promise(async (resolve, reject) => {
    //Failure all message if station do not use SMS
    if (process.env.FIREBASE_ENABLE * 1 !== 1) {
      Logger.info(`FIREBASE_ENABLE disabled`);
      await _cancelAllSMSMessage(station);
      resolve('OK');
      return;
    }

    let messageList = await MessageCustomerResourceAccess.customSearch(
      {
        messageFCMStatus: [MESSAGE_SEND_STATUS.NEW, MESSAGE_SEND_STATUS.SENDING],
      },
      0,
      100,
    );

    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        const _customerMessage = messageList[i];

        //neu khong co so dien thoai thi khong gui sms
        if (!UtilsFunction.isValidValue(_customerMessage.customerId)) {
          //cap nhat trang thai la CANCELED
          await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          });
          continue;
        }

        //cap nhat trang thai la SENDING
        await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
          messageFCMStatus: MESSAGE_SEND_STATUS.SENDING,
        });

        let _receiverUser = await AppUsersResourceAccess.findById(_customerMessage.customerId);

        if (!_receiverUser) {
          await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          });
          continue;
        }

        if (UtilsFunction.isInvalidStringValue(_receiverUser.firebaseToken)) {
          await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          });
          continue;
        }

        let _sendResultData = {
          messageFCMStatus: MESSAGE_SEND_STATUS.FAILED,
        };

        let _pushResult = await pushNotificationByTopic(
          `USER_${_receiverUser.appUserId}`,
          _customerMessage.messageTitle,
          _customerMessage.messageContent,
        );
        if (_pushResult) {
          _sendResultData.messageFCMStatus = MESSAGE_SEND_STATUS.COMPLETED;
        }
        await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, _sendResultData);
      }
      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}

module.exports = {
  sendFCMToAllCustomer,
};
