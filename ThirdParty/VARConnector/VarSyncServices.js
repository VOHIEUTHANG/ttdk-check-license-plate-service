const VarClient = require('./VarSyncClient');

class VARSyncServices {
  static BASE_URL = process.env.REACT_APP_VAR_API_URL;
  static REQUEST_METHOD = 'POST';

  static async syncStationInfo(headers, data) {
    return new Promise(resolve => {
      VarClient.send({
        headers: headers,
        url: '/Sync/receiveStationData',
        data: data,
      }).then((result = {}) => {
        const { statusCode, data } = result;
        if (statusCode === 200) {
          return resolve(data);
        }
        resolve({});
      });
    });
  }

  static async syncEmployeeInfo(headers, data = {}) {
    return new Promise(resolve => {
      VarClient.send({
        headers: headers,
        url: '/Sync/receiveEmployeeData',
        data: data,
      }).then((result = {}) => {
        const { statusCode, data } = result;
        if (statusCode === 200) {
          return resolve(data);
        }
        resolve({});
      });
    });
  }

  static async syncCustomerRecord(headers, data = {}) {
    return new Promise(resolve => {
      VarClient.send({
        headers: headers,
        url: '/Sync/receiveCustomerData',
        data: data,
      }).then((result = {}) => {
        const { statusCode, data } = result;
        if (statusCode === 200) {
          return resolve(data);
        }
        resolve({});
      });
    });
  }
}

module.exports = VARSyncServices;
