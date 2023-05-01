const firebaseKey = require('./FirebaseConstant').firebaseKey;
require('dotenv').config();
const FCM = require('fcm-notification');
const firebaseCloudMessage = new FCM(firebaseKey);

async function pushNotificationByTopic(topic, title, message, data, type = '') {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  console.log(`pushNotificationByTopic ${topic} ${title}`);
  const fcmMessage = {
    topic: topic,
    notification: {
      body: message,
      title: title,
    },
  };
  if (data) {
    const dataStr = JSON.stringify(data);
    const MAX_LENGTH_MESSAGE = 2000;
    if (dataStr.length < MAX_LENGTH_MESSAGE) {
      fcmMessage.data = {
        ...fcmMessage.data,
        json: dataStr,
      };
    }
  }

  if (type !== '') {
    fcmMessage.data = {
      ...fcmMessage.data,
      type: type,
    };
  }

  return new Promise((resolve, reject) => {
    firebaseCloudMessage.send(fcmMessage, function (err, response) {
      if (err) {
        resolve(null);
      } else {
        resolve('OK');
      }
    });
  });
}

async function pushNotificationByTokens(tokens, title, message, data, type = '') {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const fcmMessage = {
    notification: {
      body: message,
      title: title,
    },
  };
  if (data) {
    const dataStr = JSON.stringify(data);
    const MAX_LENGTH_MESSAGE = 2000;
    if (dataStr.length < MAX_LENGTH_MESSAGE) {
      fcmMessage.data = {
        ...fcmMessage.data,
        json: dataStr,
      };
    }
  }

  if (type !== '') {
    fcmMessage.data = {
      ...fcmMessage.data,
      type: type,
    };
  }

  return new Promise((resolve, reject) => {
    firebaseCloudMessage.sendToMultipleToken(fcmMessage, tokens, function (err, response) {
      if (err) {
        resolve(undefined);
      } else {
        resolve('OK');
      }
    });
  });
}

module.exports = {
  pushNotificationByTopic,
  pushNotificationByTokens,
};
