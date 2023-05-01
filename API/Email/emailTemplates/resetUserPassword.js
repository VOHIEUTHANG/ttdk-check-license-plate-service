/* Copyright (c) 2022 TORITI LIMITED 2022 */
const fs = require('fs');

const htmlBody = fs.readFileSync('./ThirdParty/Email/emailTemplates/emailForgotPassword.html');

module.exports = {
  subject: '[TTDK] TẠO LẠI MẬT KHẨU',
  htmlBody: htmlBody.toString(),
  body: '',
};
