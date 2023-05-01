/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const fs = require('fs');

const Logger = require('../../utils/logging');
const UploadResourceAccess = require('./resourceAccess/UploadResourceAccess');

//Upload base64 image
//fileFormat: PNG, JPEG, MP4
async function uploadMediaFile(fileData, fileFormat = 'png', folderPath = 'media/') {
  return new Promise(async (resolve, reject) => {
    try {
      if (fileData) {
        //fake name with 64 ASCII chars
        let fileName =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15) +
          '_' +
          new Date().toISOString() +
          `.${fileFormat}`;
        const path = `uploads/${folderPath}${fileName}`;
        fs.appendFile(path, fileData, err => {
          if (err) {
            throw err;
          }
          let mediaUrl = `https://${process.env.HOST_NAME}/uploads/${folderPath}${fileName}`;

          //Store uploadedInfo for further usages (ex: search file)
          let uploadedInfo = {
            uploadFileName: path,
            uploadFileUrl: mediaUrl,
            uploadUnicodeName: '',
            uploadFileExtension: fileFormat,
            uploadFileSize: fileData.length,
          };
          UploadResourceAccess.insert(uploadedInfo);
          resolve(mediaUrl);
        });
      }
    } catch (e) {
      Logger.error('UploadFunction', e);
      reject(undefined);
    }
  });
}

async function uploadExcel(fileData, fileFormat = 'xlsx') {
  return new Promise(async (resolve, reject) => {
    try {
      if (fileData) {
        //fake name with 64 ASCII chars
        let fileName = 'DSKH_' + new Date().toJSON().slice(0, 10) + '_' + Math.random().toString(36).substring(2, 15) + '.xlsx';
        const path = 'uploads/importExcel/' + fileName;
        fs.appendFile(path, fileData, err => {
          if (err) {
            throw err;
          }
          resolve(fileName);
        });
      }
    } catch (e) {
      Logger.error('UploadFunction', e);
      reject(undefined);
    }
  });
}
module.exports = {
  uploadMediaFile,
  uploadExcel,
};
