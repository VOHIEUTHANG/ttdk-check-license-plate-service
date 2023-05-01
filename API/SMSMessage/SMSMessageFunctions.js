const SMSMessageResourceAccess = require('./resourceAccess/SMSMessageResourceAccess');

async function addNewSMSMessage(smsData) {
  console.log(smsData);
  let existingSMSMessage = await SMSMessageResourceAccess.insert(smsData);
  return existingSMSMessage;
}

function isOTPSMSMessage(message) {
  if (message) {
    if (message.toUpperCase().indexOf('TTDK_OTP') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('OTP') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK_KICH_HOAT') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('KICH') >= 0 && message.toUpperCase().indexOf('HOAT') >= 0) {
      return true;
    }
  }
  return false;
}

function isResetPasswordSMSMessage(message) {
  if (message) {
    if (message.toUpperCase().indexOf('TTDK_MATKHAU') >= 0) {
      return true;
    }
    if (message.toUpperCase().indexOf('TTDK') >= 0 && message.toUpperCase().indexOf('MATKHAU') >= 0) {
      return true;
    }
  }
  return false;
}

module.exports = {
  addNewSMSMessage,
  isOTPSMSMessage,
  isResetPasswordSMSMessage,
};
