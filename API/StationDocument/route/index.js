const StationDocument = require('./StationDocumentRoute');
const StationDocumentRoute_AdvanceUser = require('./StationDocumentRoute_AdvanceUser');

module.exports = [
  { method: 'POST', path: '/StationDocument/insert', config: StationDocument.insert },
  { method: 'POST', path: '/StationDocument/find', config: StationDocument.find },
  { method: 'POST', path: '/StationDocument/findById', config: StationDocument.findById },
  { method: 'POST', path: '/StationDocument/updateById', config: StationDocument.updateById },
  { method: 'POST', path: '/StationDocument/deleteById', config: StationDocument.deleteById },
  { method: 'POST', path: '/StationDocument/listStationsNotView', config: StationDocument.getListStationsNotView },

  //API danh cho nhan vien tram
  { method: 'POST', path: '/StationDocument/advanceUser/getListDocument', config: StationDocumentRoute_AdvanceUser.advanceUserGetListDocument },
  { method: 'POST', path: '/StationDocument/advanceUser/getDetailDocument', config: StationDocumentRoute_AdvanceUser.advanceUserGetDetailDocument },
];
