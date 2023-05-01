/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
var request = require('request');
var cheerio = require('cheerio');
const fs = require('fs');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const Logger = require('../../utils/logging');
const UtilsFunction = require('../ApiUtils/utilFunctions');
const TesseractFunction = require('../../ThirdParty/TesseractOCR/TesseractFunctions');
const CriminalRecordResource = require('./resourceAccess/CustomerCriminalRecordResourceAccess');

const ERROR_EXTRACT_FAILED = 'extract failed';

function _splitOnFirstSemicolon(text) {
  let splitText = text;
  if (splitText.indexOf(':') > 0) {
    splitText = splitText.split(':');
    let firstPart = UtilsFunction.replaceAll(splitText[0].trim(), '\n');
    let secondPart = UtilsFunction.replaceAll(text.replace(firstPart, '').replace(':', '').trim(), '\n');
    return [firstPart, secondPart];
  } else {
    return [text];
  }
}

//vehicleType: 1 = oto, 2 = xe may, 3 = xe dap dien
async function _requestNewSession() {
  console.log(`_requestNewSession`);
  const CRIMINAL_HOST = `http://www.csgt.vn`;
  const CRIMINAL_CRAWL_URL = `${CRIMINAL_HOST}/tra-cuu-phuong-tien-vi-pham.html`;

  return new Promise((resolve, reject) => {
    // creating a clean jar
    var newJar = request.jar();
    var options = {
      url: CRIMINAL_CRAWL_URL,
      headers: {
        'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
        'Content-Type': '',
        Referer: '',
      },
      jar: newJar,
    };

    request(options, async function (err, response, html) {
      if (err) {
        Logger.error('Error in request ', err);
      } else {
        try {
          if (response.headers['set-cookie'] !== undefined) {
            let sessionCookie = response.headers['set-cookie'][response.headers['set-cookie'].length - 1];
            sessionCookie = sessionCookie.split(';');
            sessionCookie = sessionCookie[0];
            resolve(sessionCookie);
          }
          resolve(undefined);
        } catch (e) {
          Logger.error(ERROR_EXTRACT_FAILED, e);
          resolve(undefined);
        }
      }
      resolve(undefined);
    });
  });
}

//vehicleType: 1 = oto, 2 = xe may, 3 = xe dap dien
async function _requestCaptchaImage(id, session) {
  const CRIMINAL_HOST = `http://www.csgt.vn`;
  const CRIMINAL_CRAWL_URL = `${CRIMINAL_HOST}/lib/captcha/captcha.class.php`;

  return new Promise((resolve, reject) => {
    var options = {
      url: CRIMINAL_CRAWL_URL,
      headers: {
        'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
        // 'Content-Type': 'image/jpeg',
        Cookie: `	__NM=17; ${session}; __R=3; __RC=5; __M=9_Linux_%20_%20_14_11.0.696.34__0; wurfljs_cache=%7B%22is_mobile%22%3Atrue%2C%22complete_device_name%22%3A%22Apple%20iPhone%22%2C%22form_factor%22%3A%22Smartphone%22%7D; _adm_rem=_adm_rem%3A%3B; _gat=1; _gat_dtfull=1; _ga=GA1.2.584734083.1629542792; _gid=GA1.2.1240471050.1639214037; _gat_dtmonly=1; __uid=3139214036712090758; __IP=712090758; _ckAdm=7434`, //`${newCookies}`,//`:	__M=1_5.1__12_14_39.0.0.0_OTHER-_0; ${newCookies}; _gat=1; _gat_dtfull=1; _ga=GA1.2.584734083.1629542792; _gat_dtmonly=1; __NM=17; wurfljs_cache=%7B%22is_mobile%22%3Atrue%2C%22complete_device_name%22%3A%22Apple%20iPhone%22%2C%22form_factor%22%3A%22Smartphone%22%7D; __R=3; __RC=5; __uid=3839197042712090758;`,// __IP=712090758; _ckAdm=16294`,
        Referer: '',
        Accept: 'image/webp,*/*;q=0.8',
        encoding: 'binary',
      },
      jar: true,
    };

    request(options, async function (err, response, html) {
      //Do nothing
    }).pipe(
      fs.createWriteStream(`ThirdParty/TesseractOCR/TesseractData/${id}.jpeg`).on('close', () => {
        resolve('OK');
      }),
    );
  });
}

async function _requestToGetCriminalRecord(id, session, captchaResult, plateNumber, vehicleType = 1) {
  Logger.info(`_requestToGetCriminalRecord ${id} - ${session} - ${captchaResult} - ${plateNumber} - ${vehicleType}`);
  const CRIMINAL_HOST = `http://www.csgt.vn`;
  const CRIMINAL_CRAWL_URL = `${CRIMINAL_HOST}/m/?mod=contact&task=tracuu_post&ajax`;

  return new Promise((resolve, reject) => {
    var options = {
      url: 'http://www.csgt.vn/m/?mod=contact&task=tracuu_post&ajax',
      headers: {
        'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: `__NM=17; ${session}; __R=3; __RC=5; __M=9_Linux_%20_%20_14_11.0.696.34__0; wurfljs_cache=%7B%22is_mobile%22%3Atrue%2C%22complete_device_name%22%3A%22Apple%20iPhone%22%2C%22form_factor%22%3A%22Smartphone%22%7D; _adm_rem=_adm_rem%3A%3B; _gat=1; _gat_dtfull=1; _ga=GA1.2.584734083.1629542792; _gid=GA1.2.1240471050.1639214037; _gat_dtmonly=1; __uid=3139214036712090758; __IP=712090758; _ckAdm=7434`,
        Referer: `${CRIMINAL_HOST}/tra-cuu-phuong-tien-vi-pham.html?&LoaiXe=${vehicleType}&BienKiemSoat=${plateNumber}`,
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US',
      },
      jar: true,
      body: `BienKS=${plateNumber}&Xe=${vehicleType}&captcha=${captchaResult}`.replace('\n\f', ''),
    };

    request.post(options, async function (err, response, html) {
      if (err) {
        Logger.error('Error in request ', err);
      } else {
        resolve('ok');
      }
      resolve(undefined);
    });
  });
}

async function _resolveCaptcha(id) {
  return await TesseractFunction.extractText(`ThirdParty/TesseractOCR/TesseractData/${id}.jpeg`);
}

//vehicleType: 1 = oto, 2 = xe may, 3 = xe dap dien
async function _retrieveCriminalRecord(plateNumber, vehicleType = 1) {
  Logger.info(`_retrieveCriminalRecord: ${plateNumber} - vehicleType: ${vehicleType}`);

  const CRIMINAL_HOST = `http://www.csgt.vn`;
  const CRIMINAL_CRAWL_URL = `${CRIMINAL_HOST}/tra-cuu-phuong-tien-vi-pham.html?&LoaiXe=${vehicleType}&BienKiemSoat=${plateNumber}`;

  let sessionId = new Date() - 1 + '';

  let captchaResult = '';
  let newSessionRequest = undefined;
  let retryNewSession = 0;
  while (true) {
    retryNewSession++;
    Logger.info(`retryNewSession: ${retryNewSession}`);
    if (retryNewSession === 5) {
      break;
    }

    newSessionRequest = await _requestNewSession();
    if (newSessionRequest === undefined) {
      Logger.error(`can not get new session`);
      continue;
    }

    if (newSessionRequest === undefined) {
      continue;
    }

    Logger.info('newSessionRequest: ' + newSessionRequest);
    let newCaptChaImage = await _requestCaptchaImage(sessionId, newSessionRequest);
    Logger.info(`_requestCaptchaImage: ${newCaptChaImage}`);

    if (captchaResult === undefined || captchaResult === '') {
      captchaResult = await _resolveCaptcha(sessionId);
      if (captchaResult) {
        captchaResult = captchaResult.replace('\n\f', '').trim();
        captchaResult = captchaResult.replace(/[\W_]+/g, ' ').trim();
        Logger.info(`captchaResult: ${captchaResult} ${captchaResult.length === 6}`);
      } else {
        Logger.info(`can not resolve captcha for sessionId ${sessionId}`);
      }
    }

    if (captchaResult && captchaResult.length === 6) {
      break;
    }
  }

  if (captchaResult === undefined || newSessionRequest === undefined) {
    Logger.error(`Extract captcha failed`);
    return;
  }
  await _requestToGetCriminalRecord(sessionId, newSessionRequest, captchaResult, plateNumber, vehicleType);

  return new Promise((resolve, reject) => {
    var options = {
      url: CRIMINAL_CRAWL_URL,
      headers: {
        'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
        'Content-Type': '',
        Cookie: `__NM=17; ${newSessionRequest}; __R=3; __RC=5; __M=9_Linux_%20_%20_14_11.0.696.34__0; wurfljs_cache=%7B%22is_mobile%22%3Atrue%2C%22complete_device_name%22%3A%22Apple%20iPhone%22%2C%22form_factor%22%3A%22Smartphone%22%7D; _adm_rem=_adm_rem%3A%3B; _gat=1; _gat_dtfull=1; _ga=GA1.2.584734083.1629542792; _gid=GA1.2.1240471050.1639214037; _gat_dtmonly=1; __uid=3139214036712090758; __IP=712090758; _ckAdm=7434`, //`${newCookies}`,//`:	__M=1_5.1__12_14_39.0.0.0_OTHER-_0; ${newCookies}; _gat=1; _gat_dtfull=1; _ga=GA1.2.584734083.1629542792; _gat_dtmonly=1; __NM=17; wurfljs_cache=%7B%22is_mobile%22%3Atrue%2C%22complete_device_name%22%3A%22Apple%20iPhone%22%2C%22form_factor%22%3A%22Smartphone%22%7D; __R=3; __RC=5; __uid=3839197042712090758;`,// __IP=712090758; _ckAdm=16294`,
        Referer: '',
      },
      jar: true,
    };
    Logger.info(`_retrieveCriminalRecord: ${newSessionRequest}`);
    request(options, async function (err, response, html) {
      if (err) {
        Logger.error('Error in request ', err);
      } else {
        try {
          //extract data from html
          var page = cheerio.load(html);

          let criminalData = cheerio.load(page('.form-horizontal').html());
          console.log(page('.form-horizontal').html());
          let criminalRecordCount = 0;
          console.log(criminalData('.form-group').length);
          if (criminalData('.form-group').length > 0) {
            criminalRecordCount = criminalData('.form-group').length / 8;
          }
          Logger.info(`criminalRecordCount ${criminalRecordCount}`);
          let textRecordCount = criminalData('.form-group');
          let criminalRecordsList = [];
          for (let i = 0; i < criminalRecordCount; i++) {
            for (let j = 0; j < 8; j++) {
              const textRecord = criminalData(textRecordCount[i * 8 + j]);
              const valueArray = _splitOnFirstSemicolon(textRecord.text().trim());
              criminalRecordsList.push({
                id: j,
                label: valueArray[0],
                value: valueArray[1],
              });
            }
          }
          resolve(criminalRecordsList);
        } catch (e) {
          Logger.error(ERROR_EXTRACT_FAILED, e);
        }
      }
      resolve(undefined);
    });
  });
}

// Demo functions
// crawlCriminalRecord(`30A88800`);
// crawlCriminalRecord(`30E59497`);
async function crawlCriminalRecord(plateNumber, vehicleType = 1) {
  let retry = 0;
  let MAX_RETRY = 5;
  let criminalRecords = undefined;
  while (true) {
    Logger.info(`retry: ${retry}`);
    criminalRecords = await _crawlCriminalRecordByAPI(plateNumber, vehicleType);
    if (criminalRecords && criminalRecords.length > 0) {
      break;
    }
    if (retry === MAX_RETRY) {
      break;
    } else {
      retry++;
    }
  }

  return criminalRecords;
}

async function _crawlCriminalRecordByAPI(plateNumber, vehicleType = 1) {
  console.info(`_crawlCriminalRecordByAPI ${plateNumber}`);
  return new Promise((resolve, reject) => {
    chai
      .request(`https://asia-east2-viphamgiaothong2019.cloudfunctions.net`)
      .post(`/national`)
      .set(
        'firebase-instance-id-token',
        `fYszNGv4RYOhC_zGZ14H0P:APA91bGVxUY4cW61MTzVwwpOrmBGxTkWGQpRALYsT_Y5mFOueuSvWdGLP4obhrnasf14rwi-6YC18i7QIjI57ltQxJhEwJOiNxjeySzCtwxCDF6oTA9Gl--DJ8Gegnuo_stCC2A8QUfA`,
      )
      .send({
        data: {
          AppName: 'com.cellhubs.giaothongvietnam',
          BienKS: plateNumber,
          Xe: vehicleType,
        },
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        console.log(res.body);
        let result = res.body;
        if (result && result.result && result.result.isSuccess) {
          resolve(result.result.violations);
        } else {
          resolve([]);
        }
      });
  });
}

// _crawlCriminalRecordByAPI('30E59497')

async function createNewCriminalRecord(customerRecordId, plateNumber, criminalRecordContent) {
  let _criminalContent = undefined;
  try {
    _criminalContent = JSON.parse(criminalRecordContent);
    if (_criminalContent === undefined || _criminalContent.length <= 0) {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
  let newData = {
    customerRecordId: customerRecordId,
    customerRecordPlatenumber: plateNumber,
    customerCriminalRecordContent: _criminalContent,
  };

  let createResult = await CriminalRecordResource.insert(newData);
  return createResult;
}

async function createNewCriminalRecord(data) {
  let createResult = await CriminalRecordResource.insert(data);
  return createResult;
}

async function bulkDeleteCriminalRecords(plateNumber) {
  const records = await CriminalRecordResource.customSearch({ customerRecordPlatenumber: plateNumber });

  if (records) {
    for (let record of records) {
      await CriminalRecordResource.deleteById(record.customerCriminalRecordId);
    }
  }
}

async function bulkInsertCriminalRecords(plateNumber, customerRecordId) {
  // Crawl criminals
  const crimes = await crawlCriminalRecord(plateNumber, 1);
  for (let crime of crimes) {
    const data = {
      customerRecordId: customerRecordId,
      customerRecordPlatenumber: plateNumber,
      crimeRecordContent: crime.behavior,
      crimeRecordStatus: crime.status,
      crimeRecordTime: moment(crime.violationTime, 'HH:mm, DD/MM/YYYY').toDate(),
      crimeRecordPIC: crime.provider,
      crimeRecordLocation: crime.violationAddress,
      crimeRecordContact: crime.contactPhone,
    };
    await CriminalRecordResource.insert(data);
  }
}

async function hasCrime(plateNumber) {
  const hasCrime = await CriminalRecordResource.customCount({ customerRecordPlatenumber: plateNumber });

  return hasCrime > 0;
}

module.exports = {
  crawlCriminalRecord,
  createNewCriminalRecord,
  bulkDeleteCriminalRecords,
  bulkInsertCriminalRecords,
  hasCrime,
};
