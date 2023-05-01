/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../utils/logging');
const StaffResourceAccess = require('./resourceAccess/StaffResourceAccess');
const RoleResourceAccess = require('../Role/resourceAccess/RoleResourceAccess');
const RoleStaffView = require('./resourceAccess/RoleStaffView');
const UserFunctions = require('../AppUsers/AppUsersFunctions');
const crypto = require('crypto');

function hashPassword(password) {
  const hashedPassword = crypto.createHmac('sha256', 'ThisIsStaffSecretKey').update(password).digest('hex');
  return hashedPassword;
}

function unhashPassword(hash) {
  const pass = cryptr.decrypt(hash);
  return pass;
}

async function verifyCredentials(username, password) {
  let hashedPassword = hashPassword(password);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await RoleStaffView.find({
    username: username,
    password: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    return verifyResult[0];
  } else {
    Logger.error('StaffFunctions', 'Staff password do not match');
    return undefined;
  }
}

async function changeStaffPassword(staffData, newPassword) {
  let newHashPassword = hashPassword(newPassword);

  let result = await StaffResourceAccess.updateById(staffData.staffId, { password: newHashPassword });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function isValidRole(roleId) {
  let result = await RoleResourceAccess.findById(roleId);

  if (result) {
    return true;
  } else {
    return false;
  }
}
async function changePasswordUserOfStaff(appUserId, newPassword) {
  let userData = {
    appUserId: appUserId,
  };
  let result = await UserFunctions.changeUserPassword(userData, newPassword);
  if (result) {
    return result;
  } else {
    return undefined;
  }
}
module.exports = {
  verifyCredentials,
  changeStaffPassword,
  unhashPassword,
  hashPassword,
  isValidRole,
  changePasswordUserOfStaff,
};
