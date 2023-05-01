const StationDocumentResourceAccess = require('./resourceAccess/StationDocumentResourceAccess');
const StationDocumentFileResourceAccess = require('./resourceAccess/StationDocumentFileResourceAccess');
const StationDocumentReadingResourceAccess = require('./resourceAccess/StationDocumentReadingResourceAccess');
const StationResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');

const { MAX_LIMIT_FILE_PER_DOCUMENT, READING_STATUS } = require('./StationDocumentConstants');

async function getDetailDocumentById(documentId, appUserId) {
  let _existingDocument = await StationDocumentResourceAccess.findById(documentId);
  const UNKNOWN_DOCUMENT = undefined;
  if (!_existingDocument) {
    return UNKNOWN_DOCUMENT;
  }

  let _documentFiles = await StationDocumentFileResourceAccess.find(
    {
      stationDocumentId: documentId,
    },
    0,
    MAX_LIMIT_FILE_PER_DOCUMENT,
  );

  if (_documentFiles) {
    _existingDocument.documentFiles = _documentFiles;
  }

  if (appUserId) {
    const READ_ID = `${documentId}_${appUserId}`;
    let _readStatusData = await StationDocumentReadingResourceAccess.findById(READ_ID);
    if (_readStatusData) {
      _existingDocument.readStatus = READING_STATUS.ALREADY_READ;
    } else {
      _existingDocument.readStatus = READING_STATUS.NOT_READ;
    }
  }

  return _existingDocument;
}

async function updateReadStatus(documentId, appUserId, stationsId) {
  const READ_ID = `${documentId}_${appUserId}`;
  let _readStatusData = await StationDocumentReadingResourceAccess.findById(READ_ID);
  if (!_readStatusData) {
    const data = {
      appUserId: appUserId,
      stationDocumentId: documentId,
      stationDocumentReadingId: READ_ID,
    };

    if (stationsId) {
      data.stationsId = stationsId;
    }

    await StationDocumentReadingResourceAccess.insert(data);
  }
}

async function getStationListNotViewDocument(documentId) {
  const MAX_LIMIT_COUNT = 500;
  const stationList = await StationResourceAccess.find({}, 0, MAX_LIMIT_COUNT);
  const documentReadingList = await StationDocumentReadingResourceAccess.find({ stationDocumentId: documentId });
  const stationReadDocumentIdList = [];

  if (documentReadingList && documentReadingList.length > 0) {
    documentReadingList.forEach(documentReading => {
      if (documentReading.stationsId) {
        stationReadDocumentIdList.push(documentReading.stationsId);
      }
    });
  }

  const notViewStationCodeList = [];

  for (station of stationList) {
    if (!stationReadDocumentIdList.includes(station.stationsId)) {
      notViewStationCodeList.push(station.stationCode);
    }
  }

  return notViewStationCodeList;
}

async function getStationReadCount(documentId, totalStation) {
  const stationsNotView = await getStationListNotViewDocument(documentId);
  if (stationsNotView && stationsNotView.length >= 0) {
    return totalStation - stationsNotView.length;
  }
  return 0;
}

async function getStationListNotViewDocument(documentId) {
  const MAX_LIMIT_COUNT = 500;
  const stationList = await StationResourceAccess.find({}, 0, MAX_LIMIT_COUNT);
  const documentReadingList = await StationDocumentReadingResourceAccess.find({ stationDocumentId: documentId });
  const stationReadDocumentIdList = [];
  if (documentReadingList && documentReadingList.length > 0) {
    documentReadingList.forEach(documentReading => {
      if (documentReading.stationsId) {
        stationReadDocumentIdList.push(documentReading.stationsId);
      }
    });
  }

  const notViewStationCodeList = [];
  for (station of stationList) {
    if (!stationReadDocumentIdList.includes(station.stationsId)) {
      notViewStationCodeList.push(station.stationCode);
    }
  }

  return notViewStationCodeList;
}

async function getStationReadCount(documentId, totalStation) {
  const stationsNotView = await getStationListNotViewDocument(documentId);
  if (stationsNotView && stationsNotView.length >= 0) {
    return totalStation - stationsNotView.length;
  }
  return 0;
}

module.exports = {
  getDetailDocumentById,
  updateReadStatus,
  getStationListNotViewDocument,
  getStationReadCount,
};
