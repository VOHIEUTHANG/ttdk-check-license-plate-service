/* Copyright (c) 2022 TORITI LIMITED 2022 */

var soap = require('strong-soap').soap;

async function initClient(wdslURL) {
  return new Promise((resolve, reject) => {
    var options = {};
    let smsUrlRequest = process.env.SMS_API_URL || 'http://ams.tinnhanthuonghieu.vn:8009/bulkapi?wsdl';
    if (wdslURL) {
      smsUrlRequest = wdslURL;
    }

    soap.createClient(smsUrlRequest, options, function (err, client) {
      resolve(client);
    });
  });
}

module.exports = {
  initClient,
};
