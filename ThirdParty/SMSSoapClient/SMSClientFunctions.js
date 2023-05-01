/* Copyright (c) 2022 TORITI LIMITED 2022 */

const SoapClient = require('./SoapClient');

const SMS_USER = process.env.SMS_API_USERNAME || 'smsbrand_ttdk2903v';
const SMS_PASSWORD = process.env.SMS_API_PASSWORD || 'TTDK2903V@123';
const SMS_CPCODE = process.env.SMS_CPCODE || 'TTDK2903V';
const SMS_SERVICEID = process.env.SMS_SERVICEID || 'TTDK2903V';

//for testing only
// SoapClient.initClient().then((client) => {
//   var method = client['wsCpMt2'];

//   return new Promise((resolve, reject) => {
//     const SMS_COMMANDCODE = 'bulksms';
//     const SMS_CONTENTTYPE = 0;
//     var requestArgs = {
//       'User'       :SMS_USER,
//       'Password'   :SMS_PASSWORD,
//       'CPCode'     :SMS_CPCODE,
//       'RequestID'  :1,
//       'UserID'     :'84343902960',
//       'ReceiverID' :'84343902960',
//       'ServiceID'  :SMS_SERVICEID,
//       'CommandCode':SMS_COMMANDCODE,
//       'Content'    : 'TEST',
//       'ContentType':SMS_CONTENTTYPE
//     };

//     method(requestArgs, function (err, result, envelope, soapHeader) {
//       if (err) {
//         reject(err);
//       }
//       console.log("sendSMS: ");
//       console.log(result);
//       resolve(result);
//     });
//   });
// });

async function _createSoapClient(smsUrl) {
  smsUrl = 'http://ams.tinnhanthuonghieu.vn:8009/bulkapi?wsdl';
  return new Promise((resolve, reject) => {
    SoapClient.initClient(smsUrl).then(client => {
      if (client) {
        resolve(client);
      } else {
        console.error(`can not SMSSoapClient with url ${smsUrl}`);
        resolve(undefined);
      }
    });
  });
}

async function checkBalance(customClientConfig) {
  console.log(`check balance`);
  let smsClient = await _createSoapClient(customClientConfig.smsApiUrl);

  if (!smsClient) {
    return;
  }

  var method = smsClient['checkBalance'];

  return new Promise((resolve, reject) => {
    var requestArgs = {
      User: SMS_USER,
      Password: SMS_PASSWORD,
      CPCode: SMS_CPCODE,
    };

    if (customClientConfig) {
      requestArgs = {
        User: customClientConfig.smsApiUsername,
        Password: customClientConfig.smsApiPassword,
        CPCode: customClientConfig.smsCPCode,
      };
    }
    method(requestArgs, function (err, result, envelope, soapHeader) {
      if (err) {
        reject(err);
      }
      console.log('checkBalance: ');
      console.log(result);
      resolve(result);
    });
  });
}

async function sendSMS(message, phoneNumber, customClientConfig) {
  let smsClient = await _createSoapClient(customClientConfig ? customClientConfig.smsApiUrl : undefined);

  if (!smsClient) {
    return;
  }

  var method = smsClient['wsCpMt2'];

  return new Promise((resolve, reject) => {
    const SMS_COMMANDCODE = 'bulksms';
    const SMS_CONTENTTYPE = 0;
    var requestArgs = {
      User: SMS_USER,
      Password: SMS_PASSWORD,
      CPCode: SMS_CPCODE,
      RequestID: 1,
      UserID: phoneNumber[0] === '0' ? phoneNumber.replace('0', '84') : phoneNumber,
      ReceiverID: phoneNumber[0] === '0' ? phoneNumber.replace('0', '84') : phoneNumber,
      ServiceID: SMS_SERVICEID,
      CommandCode: SMS_COMMANDCODE,
      Content: message + ' ' + new Date().toISOString(),
      ContentType: SMS_CONTENTTYPE,
    };

    if (customClientConfig) {
      requestArgs = {
        User: customClientConfig.smsApiUsername,
        Password: customClientConfig.smsApiPassword,
        CPCode: customClientConfig.smsCPCode,
        RequestID: 1,
        UserID: phoneNumber[0] === '0' ? phoneNumber.replace('0', '84') : phoneNumber,
        ReceiverID: phoneNumber[0] === '0' ? phoneNumber.replace('0', '84') : phoneNumber,
        ServiceID: customClientConfig.smsServiceId,
        CommandCode: SMS_COMMANDCODE,
        Content: message,
        ContentType: SMS_CONTENTTYPE,
      };
    }

    console.log(requestArgs);

    method(requestArgs, function (error, result, envelope, soapHeader) {
      if (error) {
        console.error(error);
        resolve(undefined);
      }
      console.info(result);
      resolve(result.return);
    });
  });
}

async function createClient(smsApiUrl, smsApiUsername, smsApiPassword, smsCPCode, smsServiceId) {
  const invalidClient = undefined;
  if (smsApiUrl === undefined || smsApiUrl === null || smsApiUrl.trim() === '') {
    console.error(`invalid smsApiUrl ${smsApiUrl}`);
    return invalidClient;
  }

  if (smsApiUsername === undefined || smsApiUsername === null || smsApiUsername.trim() === '') {
    console.error(`invalid smsApiUsername ${smsApiUsername}`);
    return invalidClient;
  }

  if (smsApiPassword === undefined || smsApiPassword === null || smsApiPassword.trim() === '') {
    console.error(`invalid smsApiPassword ${smsApiPassword}`);
    return invalidClient;
  }

  if (smsCPCode === undefined || smsCPCode === null || smsCPCode.trim() === '') {
    console.error(`invalid smsCPCode ${smsCPCode}`);
    return invalidClient;
  }

  if (smsServiceId === undefined || smsServiceId === null || smsServiceId.trim() === '') {
    console.error(`invalid smsServiceId ${smsServiceId}`);
    return invalidClient;
  }

  const newClient = {
    smsApiUrl: smsApiUrl,
    smsApiUsername: smsApiUsername,
    smsApiPassword: smsApiPassword,
    smsServiceId: smsServiceId,
    smsCPCode: smsCPCode,
    smsServiceId: smsServiceId,
  };

  return newClient;
}

const errorMessages = [
  'Authenticate: Cp_code: NULL_OR_BLANK',
  'Authenticate: UserName: NULL_OR_BLANK',
  'Authenticate: Password: NULL_OR_BLANK',
  'CP_CODE_NOT_FOUND',
  'WRONG_INFORMATION_AUTHENTICATE',
  'Authenticate: IP_INVALID',
  'Check RequestID: NULL_OR_BLANK',
  'Check RequestID: REQUEST_ID_NOT_NUMBER',
  'Check UserID: NULL_OR_BLANK',
  'Check ReceiverID: NULL_OR_BLANK',
  'Check ReceiverID: FORMAT_ERROR',
  'UserID_NOT_EQUAL_ReceiverID',
  'Unable to check telco from input receiver',
  'Check ServiceID: DUPLICATE MESSAGE',
  'Check ServiceID: ALIAS_INVALID:TELCO=MB',
  'Check ServiceID: ALIAS_INVALID:TELCO=VT',
  'Check ServiceID: ALIAS_INVALID:TELCO=VN',
  'Check ServiceID: ALIAS_INVALID:TELCO=VM',
  'Check CommandCode: NULL_OR_BLANK',
  'Check CommandCode: COMMAND_CODE_ERROR',
  'Check Content: NULL_OR_BLANK',
  'Check Content: MAXLENGTH_LIMIT_XXXX_BYTE (YOUR_CONTENT: YY BYTE)',
  'Check Content: MSG_ERROR_CONTAIN_BLACKLIST',
  'Check information error',
  'Check template: CONTENT_NOT_MATCH_TEMPLATE',
];

function responseSMSViettel(errorMessageResponse) {
  if (errorMessageResponse === 'Authenticate: Cp_code: NULL_OR_BLANK') {
    return {
      errorCode: 2,
      errorMessage: '2- Thiếu thông tin cp_code',
    };
  } else if (errorMessageResponse === 'Authenticate: UserName: NULL_OR_BLANK') {
    return {
      errorCode: 3,
      errorMessage: '3- Thiếu thông tin user_name',
    };
  } else if (errorMessageResponse === 'Authenticate: Password: NULL_OR_BLANK') {
    return {
      errorCode: 4,
      errorMessage: '4- Thiếu thông tin password',
    };
  } else if (errorMessageResponse === 'CP_CODE_NOT_FOUND') {
    return {
      errorCode: 5,
      errorMessage: '5- Thông tin cp_code không chính xác',
    };
  } else if (errorMessageResponse === 'WRONG_INFORMATION_AUTHENTICATE') {
    return {
      errorCode: 6,
      errorMessage: '6- Thông tin user/pass không chính xác',
    };
  } else if (errorMessageResponse === 'Authenticate: IP_INVALID') {
    return {
      errorCode: 8,
      errorMessage: '8- IP XXXX của hệ thống bạn đang gửi tin chưa được đăng ký whitelist.',
    };
  } else if (errorMessageResponse === 'Check RequestID: NULL_OR_BLANK') {
    return {
      errorCode: 9,
      errorMessage: '9- Thiếu thông tin RequestID',
    };
  } else if (errorMessageResponse === 'Check RequestID: REQUEST_ID_NOT_NUMBER') {
    return {
      errorCode: 11,
      errorMessage: '11- RequestID không đúng',
    };
  } else if (errorMessageResponse === 'Check UserID: NULL_OR_BLANK') {
    return {
      errorCode: 13,
      errorMessage: '13- Thiếu thông tin UserID',
    };
  } else if (errorMessageResponse === 'Check ReceiverID: NULL_OR_BLANK') {
    return {
      errorCode: 14,
      errorMessage: '14- Thiếu thông tin ReceiverID',
    };
  } else if (errorMessageResponse === 'Check ReceiverID: FORMAT_ERROR') {
    return {
      errorCode: 15,
      errorMessage: '15- ReceiverID không đúng',
    };
  } else if (errorMessageResponse === 'UserID_NOT_EQUAL_ReceiverID') {
    return {
      errorCode: 16,
      errorMessage: '16- UserID và ReceiverID phải giống nhau',
    };
  } else if (errorMessageResponse === 'Unable to check telco from input receiver') {
    return {
      errorCode: 17,
      errorMessage: '17- Không xác định được nhà mạng của thuê bao (do ReceiverID sai)',
    };
  } else if (errorMessageResponse === 'Check ServiceID: DUPLICATE MESSAGE') {
    return {
      errorCode: 18,
      errorMessage: '18- Tin nhắn bị lặp',
    };
  } else if (errorMessageResponse === 'Check ServiceID: ALIAS_INVALID:TELCO=VT') {
    return {
      errorCode: 19,
      errorMessage: `19- Sai thương hiệu hoặc thương hiệu chưa được khai báo cho nhà mạng tương ứng với thuê bao,
        XX là nhà mạng của thuê bao (VT: Viettel, VN: Vinaphone, MB: Mobiphone, VM: Vietnammobile)`,
    };
  } else if (errorMessageResponse === 'Check ServiceID: ALIAS_INVALID:TELCO=VN') {
    return {
      errorCode: 19,
      errorMessage: `19- Sai thương hiệu hoặc thương hiệu chưa được khai báo cho nhà mạng tương ứng với thuê bao,
        XX là nhà mạng của thuê bao (VT: Viettel, VN: Vinaphone, MB: Mobiphone, VM: Vietnammobile)`,
    };
  } else if (errorMessageResponse === 'Check ServiceID: ALIAS_INVALID:TELCO=MB') {
    return {
      errorCode: 19,
      errorMessage: `19- Sai thương hiệu hoặc thương hiệu chưa được khai báo cho nhà mạng tương ứng với thuê bao,
        XX là nhà mạng của thuê bao (VT: Viettel, VN: Vinaphone, MB: Mobiphone, VM: Vietnammobile)`,
    };
  } else if (errorMessageResponse === 'Check ServiceID: ALIAS_INVALID:TELCO=VM') {
    return {
      errorCode: 19,
      errorMessage: `19- Sai thương hiệu hoặc thương hiệu chưa được khai báo cho nhà mạng tương ứng với thuê bao,
        XX là nhà mạng của thuê bao (VT: Viettel, VN: Vinaphone, MB: Mobiphone, VM: Vietnammobile)`,
    };
  } else if (errorMessageResponse === 'Check CommandCode: NULL_OR_BLANK') {
    return {
      errorCode: 21,
      errorMessage: '21- Thiếu thông tin command_code',
    };
  } else if (errorMessageResponse === 'Check CommandCode: COMMAND_CODE_ERROR') {
    return {
      errorCode: 23,
      errorMessage: '23- Sai command_code',
    };
  } else if (errorMessageResponse === 'Check Content: NULL_OR_BLANK') {
    return {
      errorCode: 24,
      errorMessage: '24- Không có nội dung tin nhắn',
    };
  } else if (errorMessageResponse === 'Check Content: MAXLENGTH_LIMIT_XXXX_BYTE (YOUR_CONTENT: YY BYTE)') {
    return {
      errorCode: 25,
      errorMessage: '25- Độ dài tin vượt quá giới hạn (XXXX: số byte tối đa, YY là số byte nội dung tin mà bạn nhập)',
    };
  } else if (errorMessageResponse === 'Check Content: MSG_ERROR_CONTAIN_BLACKLIST') {
    return {
      errorCode: 26,
      errorMessage: '26- Nội dung chứa từ ngữ bị chặn',
    };
  } else if (errorMessageResponse === 'Check information error') {
    return {
      errorCode: 99,
      errorMessage: '99- Lỗi chung hệ thống',
    };
  } else if (errorMessageResponse === 'Check template: CONTENT_NOT_MATCH_TEMPLATE') {
    return {
      errorCode: 98,
      errorMessage: '98- Lỗi sai định dạng mẫu tin nhắn',
    };
  } else {
    return {
      errorCode: 99,
      errorMessage: '99- Lỗi chung hệ thốngn',
    };
  }
}

function checkSMSStatusById(responseSMS) {
  let errorMessage = errorMessages.find(err => responseSMS.message.toLocaleLowerCase().indexOf(err.toLocaleLowerCase() > -1));
  if (errorMessage) {
    responseSMS.errorMessageResponse = errorMessage;
    return responseSMS;
  }
  return undefined;
}

module.exports = {
  checkBalance,
  sendSMS,
  createClient,
  responseSMSViettel,
  checkSMSStatusById,
};
