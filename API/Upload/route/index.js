/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const Upload = require('./UploadRoute');

module.exports = [
  { method: 'POST', path: '/Upload/uploadMediaFile', config: Upload.uploadMediaFile },
  { method: 'POST', path: '/Upload/advanceUser/uploadMediaFile', config: Upload.advanceUserUploadMediaFile },
  { method: 'POST', path: '/Upload/uploadUserAvatar', config: Upload.uploadUserAvatar },
  {
    method: 'GET',
    path: '/uploads/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/${request.params.filename}`);
    },
  },
  {
    method: 'GET',
    path: '/uploads/voices/alphabets/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/voices/alphabets/${request.params.filename}`);
    },
  },
  {
    method: 'GET',
    path: '/uploads/voices/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/voices/${request.params.filename}`);
    },
  },
  {
    method: 'GET',
    path: '/uploads/media/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/media/${request.params.filename}`);
    },
  },
  {
    method: 'GET',
    path: '/uploads/media/qrcode/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/media/qrcode/${request.params.filename}`);
    },
  },
  { method: 'POST', path: '/Upload/uploadAdMediaFile', config: Upload.uploadAdMediaFile },
  { method: 'POST', path: '/Upload/advanceUser/uploadAdMediaFile', config: Upload.advanceUserUploadAdMediaFile },
  {
    method: 'GET',
    path: '/uploads/media/quangcao/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/media/quangcao/${request.params.filename}`);
    },
  },
  //download Excel
  {
    method: 'GET',
    path: '/uploads/exportExcel/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/exportExcel/${request.params.filename}`);
    },
  },
  {
    method: 'GET',
    path: '/uploads/media/plate/{foldername}/{filename}',
    handler: function (request, h) {
      return h.file(`uploads/media/plate/${request.params.foldername}/${request.params.filename}`);
    },
  },
];
