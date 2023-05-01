'user strict';
const moment = require('moment');

const StationDocumentResourceAccess = require('../resourceAccess/StationDocumentResourceAccess');
const StationDocumentFileResourceAccess = require('../resourceAccess/StationDocumentFileResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const AppUserRoleResourceAccess = require('../../AppUserRole/resourceAccess/AppUserRoleResourceAccess');
const FirebaseFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');

const RoleUserView = require('../../AppUsers/resourceAccess/RoleUserView');
const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { getDetailDocumentById, updateReadStatus, getStationReadCount, getStationListNotViewDocument } = require('../StationDocumentFunctions');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;

      data.documentPublishedDay = moment().format('DD/MM/YYYY');
      data.documentPublishedDate = moment().format();

      let _documentFileList = [];
      if (data.documentFileUrlList) {
        _documentFileList = JSON.parse(JSON.stringify(data.documentFileUrlList));
        delete data.documentFileUrlList;
      }

      const result = await StationDocumentResourceAccess.insert(data);
      if (result) {
        let _newDocumentId = result[0];

        for (let i = 0; i < _documentFileList.length; i++) {
          const _documentFileUrl = _documentFileList[i];
          await StationDocumentFileResourceAccess.insert({
            stationDocumentId: _newDocumentId,
            documentFileUrl: _documentFileUrl,
          });
        }

        await _notifyNewDocumentToAppUser(data.documentTitle);

        return resolve(result);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _notifyNewDocumentToAppUser(documentTitle) {
  const MAX_COUNT = 20;
  const appUserRole = await AppUserRoleResourceAccess.find({}, 0, MAX_COUNT);
  if (appUserRole && appUserRole.length > 0) {
    const roleIdList = appUserRole.map(role => role.appUserRoleId);

    let skip = 0;
    while (true) {
      const appUserBunch = await RoleUserView.customSearch({ appUserRoleId: roleIdList }, skip, 50);
      if (appUserBunch && appUserBunch.length > 0) {
        const notifyNewDocumentPromiseList = appUserBunch.map(
          appUser =>
            new Promise(async (resolve, reject) => {
              const notifyTitle = 'Có công văn mới';
              await CustomerMessageFunctions.addMessageCustomer(notifyTitle, undefined, documentTitle, undefined, appUser.appUserId);
              if (appUser.firebaseToken) {
                FirebaseFunctions.pushNotificationByTokens(appUser.firebaseToken, notifyTitle, documentTitle);
              }
              resolve('ok');
            }),
        );
        await Promise.all(notifyNewDocumentPromiseList);
      } else {
        break;
      }
      skip += 50;
    }
  }
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let searchText = req.payload.searchText;
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      let stationDocumentRecords = await StationDocumentResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (stationDocumentRecords && stationDocumentRecords.length > 0) {
        for (let i = 0; i < stationDocumentRecords.length; i++) {
          stationDocumentRecords[i] = await getDetailDocumentById(stationDocumentRecords[i].stationDocumentId);
        }
        const documentCount = await StationDocumentResourceAccess.customCount(filter, undefined, undefined, searchText);

        // attach station read documents count
        const totalStationsCount = await StationsResourceAccess.count({});

        if (Number.isInteger(totalStationsCount)) {
          const promiseList = stationDocumentRecords.map(async document => {
            const stationsReadCount = await getStationReadCount(document.stationDocumentId, totalStationsCount);

            document.totalCountStation = totalStationsCount;
            document.totalViewedStation = stationsReadCount || 0;

            return document;
          });

          stationDocumentRecords = await Promise.all(promiseList);
        }

        return resolve({ data: stationDocumentRecords, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await await getDetailDocumentById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const oldRecord = await StationDocumentResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      } else {
        const result = await StationDocumentResourceAccess.deleteById(id);
        if (result === 1) {
          return resolve('success');
        } else {
          return reject(UNKNOWN_ERROR);
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updateData = req.payload.data;

      const targetRecord = await StationDocumentResourceAccess.findById(id);

      _documentFileList = [];
      if (updateData.documentFileUrlList) {
        _documentFileList = JSON.parse(JSON.stringify(updateData.documentFileUrlList));
        delete updateData.documentFileUrlList;
      }

      if (targetRecord) {
        const result = await StationDocumentResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          for (let i = 0; i < _documentFileList.length; i++) {
            const _documentFileUrl = _documentFileList[i];
            await StationDocumentFileResourceAccess.insert({
              stationDocumentId: id,
              documentFileUrl: _documentFileUrl,
            });
          }

          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetListDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let searchText = req.payload.searchText;
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      let stationDocumentRecords = await StationDocumentResourceAccess.customSearch(filter, skip, limit, undefined, undefined, searchText);

      if (stationDocumentRecords && stationDocumentRecords.length > 0) {
        for (let i = 0; i < stationDocumentRecords.length; i++) {
          stationDocumentRecords[i] = await getDetailDocumentById(stationDocumentRecords[i].stationDocumentId, req.currentUser.appUserId);
        }
        const documentCount = await StationDocumentResourceAccess.customCount(filter, undefined, undefined, searchText);

        return resolve({ data: stationDocumentRecords, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetDetailDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      //Thêm appUserId để biết user này đã đọc tài liệu
      const result = await getDetailDocumentById(id, req.currentUser.appUserId);
      if (result) {
        await updateReadStatus(id, req.currentUser.appUserId, req.currentUser.stationsId);
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getListStationsNotViewDocument(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const stationCodeList = await getStationListNotViewDocument(id);

      if (stationCodeList) {
        return resolve(stationCodeList);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  deleteById,
  updateById,
  advanceUserGetDetailDocument,
  advanceUserGetListDocument,
  getListStationsNotViewDocument,
};
