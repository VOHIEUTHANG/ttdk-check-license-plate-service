/* Copyright (c) 2022 TORITI LIMITED 2022 */

const tesseract = require('node-tesseract-ocr');

const config = {
  lang: 'eng',
  oem: 2,
  psm: 13,
  tessedit_char_whitelist: '1234567890qwertyuiopasdfghjklzxcvbnm',
  preserve_interword_spaces: 0,
};

async function extractText(imagePath) {
  return new Promise((resolve, reject) => {
    tesseract
      .recognize(imagePath, config)
      .then(text => {
        resolve(text);
      })
      .catch(error => {
        console.log(error.message);
        resolve(undefined);
      });
  });
}

module.exports = {
  extractText,
};
