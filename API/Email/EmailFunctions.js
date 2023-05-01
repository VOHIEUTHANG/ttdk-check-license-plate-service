/* Copyright (c) 2022 TORITI LIMITED 2022 */

require('dotenv').config();

const EmailClient = require('../../ThirdParty/Email/EmailClient');
const Handlebars = require('handlebars');

const EMAIL_TEMPLATE_COMFIRM_SCHEDULE = require('./emailTemplates/confirmSchedule');
const EMAIL_TEMPLATE_RESET_USER_PASS = require('./emailTemplates/resetUserPassword');
const EMAIL_TEMPLATE_REPORT_DATA = require('./emailTemplates/reportData');

function convertBodyFromTemplate(template, subjectParams, bodyParams) {
  const subject = Handlebars.compile(template.subject)(subjectParams);
  const bodyHtml = Handlebars.compile(template.htmlBody)(bodyParams);
  const body = Handlebars.compile(template.body)(bodyParams);
  return { subject, body, bodyHtml };
}

async function sendResetPasswordEmail(receiverEmail, fullName, userToken) {
  if (!userToken || !receiverEmail) {
    console.error(`sendResetPasswordEmail: undefined receiverEmail ${receiverEmail} or token ${userToken}`);
    return undefined;
  }

  let subjectParams = {};
  let bodyParams = {
    paramFullName: fullName,
    paramResetPasswordUrl: `https://${process.env.WEB_HOST_NAME}/fogot-password?action=updatePass&token=${userToken}`,
    paramCopyright: process.env.PROJECT_NAME,
  };

  let { subject, bodyHtml } = convertBodyFromTemplate(EMAIL_TEMPLATE_RESET_USER_PASS, subjectParams, bodyParams);

  let sendResult = await EmailClient.sendEmail(receiverEmail, subject, undefined, bodyHtml);
  return sendResult;
}

async function sendReportDataEmail(receiver, subjectParams, bodyParams) {
  let { subject, bodyHtml } = convertBodyFromTemplate(EMAIL_TEMPLATE_REPORT_DATA, subjectParams, bodyParams);
  let sendResult = await EmailClient.sendEmail(receiver, subject, undefined, bodyHtml);
  return sendResult;
}

module.exports = {
  sendResetPasswordEmail,
  sendReportDataEmail,
};
