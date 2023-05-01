'use strict';
const SystemAppLogChangeAppUserResourceAccess = require('./resourceAccess/SystemAppLogChangeAppUserResourceAccess');

const StaffResource = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

async function logAppUserChanged(dataBefore, dataAfter, picUser, appUserId) {
  let beforeObjKeys = Object.keys(dataBefore);
  let afterObjKeys = Object.keys(dataAfter);
  if (afterObjKeys.length <= 0 || beforeObjKeys.length <= 0) {
    console.log(`Can not logAppDataChanged afterObjKeys ${afterObjKeys.length} - beforeObjKeys ${beforeObjKeys}`);
    return;
  }
  let changeLogs = [];
  for (let i = 0; i < beforeObjKeys.length; i++) {
    const key = beforeObjKeys[i];
    if (dataAfter[key] && dataAfter[key] !== dataBefore[key]) {
      let changedData = {
        dataValueBefore: dataBefore[key],
        dataValueAfter: dataAfter[key],
        dataFieldName: key,
      };

      if (appUserId) {
        changedData.appUserId = appUserId;
      }

      if (picUser.staffId) {
        changedData.dataPICName = `${picUser.firstName} ${picUser.lastName}`;
        changedData.dataPICId = picUser.staffId;
        changedData.dataPICTable = StaffResource.modelName;
      } else if (picUser.appUserId) {
        changedData.dataPICName = `${picUser.firstName} ${picUser.lastName}`;
        changedData.dataPICId = picUser.appUserId;
        changedData.dataPICTable = AppUserResource.modelName;
      }

      changeLogs.push(changedData);
    }
  }

  if (changeLogs.length > 0) {
    await SystemAppLogChangeAppUserResourceAccess.insert(changeLogs);
  }
}

module.exports = {
  logAppUserChanged,
};
