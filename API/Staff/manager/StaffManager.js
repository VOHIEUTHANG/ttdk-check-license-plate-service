/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StaffResourceAccess = require('../resourceAccess/StaffResourceAccess');
const RoleStaffView = require('../resourceAccess/RoleStaffView');
const StaffFunctions = require('../StaffFunctions');
const TokenFunction = require('../../ApiUtils/token');
const Logger = require('../../../utils/logging');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffData = req.payload;
      if (staffData.roleId && staffData.roleId === 1) {
        reject('can not insert staff');
        return;
      }

      const NOT_VALID = false;
      if (StaffFunctions.isValidRole(staffData.roleId) === NOT_VALID) {
        reject('invalid role');
        return;
      }

      //hash password
      staffData.password = StaffFunctions.hashPassword(staffData.password);

      //create new user
      let addResult = await StaffResourceAccess.insert(staffData);
      if (addResult === undefined) {
        reject('can not insert staff');
        return;
      } else {
        resolve('success');
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      let staffs = await RoleStaffView.customSearch(filter, skip, limit, order);
      let staffsCount = await RoleStaffView.customCount(filter, order);
      if (staffs && staffsCount) {
        resolve({ data: staffs, total: staffsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffData = req.payload.data;
      let staffId = req.payload.id;

      const NOT_VALID = false;
      if (staffData.roleId && StaffFunctions.isValidRole(staffData.roleId) === NOT_VALID) {
        reject('invalid role');
        return;
      }

      let updateResult = await StaffResourceAccess.updateById(staffId, staffData);

      if (updateResult) {
        resolve('success');
      } else {
        reject('failed to update staff');
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffs = await RoleStaffView.findById(req.payload.id);
      if (staffs) {
        let foundStaff = staffs;
        if (foundStaff) {
          resolve(foundStaff);
          return;
        }
      }
      resolve('failed to find staff');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
    return;
  });
}

async function registerStaff(req) {
  return insert(req);
}

async function loginStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.payload.username;
      let password = req.payload.password;

      //verify credential
      let foundStaff = await StaffFunctions.verifyCredentials(userName, password);

      if (foundStaff) {
        if (!foundStaff.active) {
          reject('failed');
        }

        //create new login token
        let token = TokenFunction.createToken(foundStaff);
        foundStaff.token = token;
        await StaffResourceAccess.updateById(foundStaff.staffId, { lastActiveAt: new Date() });
        resolve(foundStaff);
        return;
      }

      reject('failed to login staff');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
    return;
  });
}

async function resetPasswordStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve('success');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function changePasswordStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.payload.username;
      let password = req.payload.password;
      let newPassword = req.payload.newPassword;
      //verify credential
      let foundStaff = await StaffFunctions.verifyCredentials(userName, password);

      if (foundStaff) {
        let result = StaffFunctions.changeStaffPassword(foundStaff, newPassword);
        if (result) {
          resolve(result);
          return;
        }
      }
      reject('change user password failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteStaffById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffId = req.payload.id;

      let result = StaffResourceAccess.updateById(staffId, { isDeleted: 1 });
      if (result) {
        resolve(result);
        return;
      }
      reject('delete failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function changePasswordUserOfStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let newPassword = req.payload.newPassword;
      //verify credential
      let result = await StaffFunctions.changePasswordUserOfStaff(appUserId, newPassword);
      if (result) {
        resolve('success');
      } else {
        resolve('false is change password user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  registerStaff,
  loginStaff,
  resetPasswordStaff,
  changePasswordStaff,
  changePasswordUserOfStaff,
  deleteStaffById,
};
