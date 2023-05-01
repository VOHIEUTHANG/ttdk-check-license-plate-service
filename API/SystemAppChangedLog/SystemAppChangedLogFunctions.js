/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const CustomerRecordResource = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const CustomerScheduleResource = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const AppLogResource = require('./resourceAccess/SystemAppChangedLogResourceAccess');
const StaffResource = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserResource = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

async function logAppDataChanged(dataBefore, dataAfter, picUser, tableName, recordId) {
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
        dataTableName: tableName,
        dataFieldName: key,
      };

      if (recordId) {
        changedData.dataRecordId = recordId;
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
    await AppLogResource.insert(changeLogs);
  }
}

async function logCustomerRecordChanged(dataBefore, dataAfter, picUser, recordId) {
  await logAppDataChanged(dataBefore, dataAfter, picUser, CustomerRecordResource.modelName, recordId);
}

module.exports = {
  logCustomerRecordChanged,
};
