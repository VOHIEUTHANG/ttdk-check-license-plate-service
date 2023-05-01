/* Copyright (c) 2022 TORITI LIMITED 2022 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secureConnection: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

async function sendTestEmail(testEmail = 'chaupad@gmail.com', emailClient) {
  let mailBody = '';
  mailBody += 'Thử nghiệm email hệ thống VTSS' + '\r\n\r\n' + 'Xin chào. Đây là thử nghiệm email hệ thống VTSS. Thử nghiệm thành công !!';
  let subject = 'Thử nghiệm email hệ thống VTSS';
  await sendEmail(testEmail, subject, mailBody, undefined, emailClient);
}

async function sendEmail(receiver, subject, body, html, emailClient) {
  let emailData = {
    from: `<${process.env.SMTP_EMAIL}>`,
    to: receiver,
    subject: subject,
  };

  if (emailClient) {
    try {
      emailData.from = emailClient.options.auth.user;
    } catch (error) {
      console.error(`can not get email of emailClient`);
      console.error(error);

      //if error, then use default
      emailData.from = `<${process.env.SMTP_EMAIL}>`;
    }
  }

  if (body) {
    emailData.text = body;
  }

  if (html) {
    emailData.html = html;
  }

  return new Promise((resolve, reject) => {
    if (emailClient === undefined) {
      emailClient = emailTransporter;
    }

    emailClient.sendMail(emailData, (err, info) => {
      if (err) {
        console.error('Send email error: ' + err);
        console.error(info);
        resolve(undefined);
      }
      if (info && info.messageId) {
        resolve(info.messageId);
      } else {
        resolve(undefined);
      }
    });
  });
}

async function createNewThirdpartyClient(email, password, serviceName = 'gmail', host = 'smtp.gmail.com') {
  var emailClient = nodemailer.createTransport({
    service: serviceName,
    host: host,
    auth: {
      user: email,
      pass: password,
    },
  });

  return emailClient;
}

async function createNewClient(smtpHost, smtpPort, smtpSecure, email, password) {
  const emailClient = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return emailClient;
}

module.exports = {
  sendEmail,
  sendTestEmail,
  createNewClient,
  createNewThirdpartyClient,
};
