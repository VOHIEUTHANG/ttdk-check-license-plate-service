/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const CustomerScheduleAttachment = require('./CustomerScheduleAttachmentRoute');

module.exports = [
  { method: 'POST', path: '/CustomerScheduleAttachment/insert', config: CustomerScheduleAttachment.insert },
  { method: 'POST', path: '/CustomerScheduleAttachment/findById', config: CustomerScheduleAttachment.findById },
  { method: 'POST', path: '/CustomerScheduleAttachment/find', config: CustomerScheduleAttachment.find },
  { method: 'POST', path: '/CustomerScheduleAttachment/updateById', config: CustomerScheduleAttachment.updateById },
  { method: 'POST', path: '/CustomerScheduleAttachment/deleteById', config: CustomerScheduleAttachment.deleteById },
];
