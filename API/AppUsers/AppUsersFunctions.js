/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const crypto = require('crypto');
const otplib = require('otplib');
const moment = require('moment');

const AppUsersResourceAccess = require('./resourceAccess/AppUsersResourceAccess');
const AppUserRoleResourceAccess = require('../AppUserRole/resourceAccess/AppUserRoleResourceAccess');
const RoleUserView = require('./resourceAccess/RoleUserView');
const QRCodeFunction = require('../../ThirdParty/QRCode/QRCodeFunctions');
const TokenFunction = require('../ApiUtils/token');
const Logger = require('../../utils/logging');
const { APP_USER_ERROR, USER_VERIFY_PHONE_NUMBER_STATUS } = require('./AppUsersConstant');

const { deleteUserVehicleOfAppUser } = require('../AppUserVehicle/AppUserVehicleFunctions');
const { deleteScheduleOfAppUser } = require('../CustomerSchedule/CustomerScheduleFunctions');
const { deleteRecordOfAppUser } = require('../CustomerRecord/CustomerRecordFunctions');
const { isNotValidValue } = require('../ApiUtils/utilFunctions');
const StationResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');

/** Gọi ra để sử dụng đối tượng "authenticator" của thằng otplib */
const { authenticator } = otplib;
/** Tạo secret key ứng với từng user để phục vụ việc tạo otp token.
  * Lưu ý: Secret phải được gen bằng lib otplib thì những app như
    Google Authenticator hoặc tương tự mới xử lý chính xác được.
  * Các bạn có thể thử để linh linh cái secret này thì đến bước quét mã QR sẽ thấy có lỗi ngay.
*/
const generateUniqueSecret = () => {
  return authenticator.generateSecret();
};

/** Tạo mã OTP token */
const generateOTPToken = (username, serviceName, secret) => {
  return authenticator.keyuri(username, serviceName, secret);
};

function hashPassword(password) {
  const hashedPassword = crypto.createHmac('sha256', 'ThisIsSecretKey').update(password).digest('hex');
  return hashedPassword;
}

function unhashPassword(hash) {
  const pass = crypto.decrypt(hash);
  return pass;
}

function verifyUniqueUser(req, res) {
  // Find an entry from the database that
  // matches either the email or username
}

async function verifyCredentials(username, password) {
  let hashedPassword = hashPassword(password);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await AppUsersResourceAccess.find({
    username: username,
    password: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser;
  } else {
    return undefined;
  }
}

async function retrieveUserDetail(appUserId) {
  //get user detial
  let user = await RoleUserView.findById(appUserId);
  await attachDataForUser([user]);

  if (user) {
    let foundUser = user;
    //create new login token
    let _tokenModelData = {
      appUserId: foundUser.appUserId,
      username: foundUser.username,
      active: foundUser.active,
    };
    if (foundUser.stationsId) {
      _tokenModelData.stationsId = foundUser.stationsId;
    }
    let token = TokenFunction.createToken(_tokenModelData);
    foundUser.token = token;
    return foundUser;
  }

  return undefined;
}

async function changeUserPassword(userData, newPassword) {
  let newHashPassword = hashPassword(newPassword);

  let result = await AppUsersResourceAccess.updateById(userData.appUserId, { password: newHashPassword });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function resetPasswordByUsername(username) {
  let _existingUser = await AppUsersResourceAccess.find(
    {
      username: username,
    },
    0,
    1,
  );
  if (_existingUser && _existingUser.length > 0) {
    _existingUser = _existingUser[0];
    const DEFAULT_PASSWORD = '123456';
    let result = await changeUserPassword(_existingUser, DEFAULT_PASSWORD);
    return result;
  }
  return undefined;
}
async function generate2FACode(appUserId) {
  // đây là tên ứng dụng của các bạn, nó sẽ được hiển thị trên app Google Authenticator hoặc Authy sau khi bạn quét mã QR
  const serviceName = process.env.HOST_NAME || 'trainingdemo.makefamousapp.com';

  let user = await AppUsersResourceAccess.findById(appUserId);

  if (user && user.length > 0) {
    user = user[0];

    // Thực hiện tạo mã OTP
    let topSecret = '';
    if (user.twoFACode || (user.twoFACode !== '' && user.twoFACode !== null)) {
      topSecret = user.twoFACode;
    } else {
      topSecret = generateUniqueSecret();
    }

    const otpAuth = generateOTPToken(user.username, serviceName, topSecret);
    const QRCodeImage = await QRCodeFunction.createQRCode(otpAuth);

    if (QRCodeImage) {
      await AppUsersResourceAccess.updateById(appUserId, {
        twoFACode: topSecret,
        twoFAQR: process.env.HOST_NAME + `/User/get2FACode?id=${appUserId}`,
      });
      return QRCodeImage;
    }
  }
  return undefined;
}

/** Kiểm tra mã OTP token có hợp lệ hay không
 * Có 2 method "verify" hoặc "check", các bạn có thể thử dùng một trong 2 tùy thích.
 */
const verify2FACode = (token, topSecret) => {
  return authenticator.check(token, topSecret);
};

async function createNewUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      if (userData.username) {
        let existedUser = await AppUsersResourceAccess.find({ username: userData.username });
        if (existedUser && existedUser.length > 0) {
          reject(APP_USER_ERROR.DUPLICATE_USER_NAME);
          return APP_USER_ERROR.DUPLICATE_USER_NAME;
        }
      }
      if (userData.email) {
        let existedUser = await AppUsersResourceAccess.find({ email: userData.email });
        if (existedUser && existedUser.length > 0) {
          reject(APP_USER_ERROR.DUPLICATE_EMAIL);
          return APP_USER_ERROR.DUPLICATE_EMAIL;
        }
      }
      if (userData.phoneNumber) {
        let existedUser = await AppUsersResourceAccess.find({ phoneNumber: userData.phoneNumber });
        if (existedUser && existedUser.length > 0) {
          reject(APP_USER_ERROR.DUPLICATE_PHONENUMBER);
          return APP_USER_ERROR.DUPLICATE_PHONENUMBER;
        }
      }
      //hash password
      userData.password = hashPassword(userData.password);

      //create new user
      let addResult = await AppUsersResourceAccess.insert(userData);
      if (addResult === undefined) {
        Logger.info('insert failed ' + JSON.stringify(userData));
        resolve(undefined);
      } else {
        let newUserId = addResult[0];
        // await generate2FACode(newUserId);
        resolve(newUserId);
      }
      return;
    } catch (e) {
      Logger.info('AppUserFunctions', e);
      Logger.info('can not createNewUser ', JSON.stringify(userData));
      resolve(undefined);
    }
  });
}

async function verifyUserPhoneNumber(phoneNumber) {
  let foundUser = await AppUsersResourceAccess.find({
    phoneNumber: phoneNumber,
  });

  if (foundUser && foundUser.length > 0) {
    foundUser = foundUser[0];

    foundUser = await AppUsersResourceAccess.updateById(foundUser.appUserId, {
      isVerifiedPhoneNumber: USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED,
    });

    return foundUser;
  } else {
    return undefined;
  }
}

async function deleteUserAccount(user) {
  let _userId = user.appUserId;

  //xu ly chuyen thanh ten username khac de phong tranh viec bi trung username
  await AppUsersResourceAccess.updateById(_userId, {
    username: user.username + '_1_' + moment().format('YYYYMMDDHHmm'),
    phoneNumber: user.phoneNumber + '_1_' + moment().format('YYYYMMDDHHmm'),
  });
  let result = await AppUsersResourceAccess.deleteById(_userId);

  await deleteUserVehicleOfAppUser(_userId);
  await deleteRecordOfAppUser(_userId);
  await deleteScheduleOfAppUser(_userId);

  return result;
}

async function getStationUserList(filter, skip, limit, searchText, order) {
  if (!filter.appUserRoleId) {
    const MAX_COUNT = 20;
    const appUserRoles = await AppUserRoleResourceAccess.find({}, 0, MAX_COUNT);
    if (appUserRoles && appUserRoles.length > 0) {
      const roleIdList = appUserRoles.map(role => role.appUserRoleId);
      filter.appUserRoleId = roleIdList;
    }
  }
  return RoleUserView.customSearch(filter, skip, limit, searchText, order);
}

async function activeUserByPhoneNumber(phoneNumber) {
  let _existingUser = await AppUsersResourceAccess.find(
    {
      phoneNumber: phoneNumber,
    },
    0,
    1,
  );
  if (_existingUser && _existingUser.length > 0) {
    _existingUser = _existingUser[0];
    let updateResult = await AppUsersResourceAccess.updateById(_existingUser.appUserId, {
      isVerifiedPhoneNumber: USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED,
    });
    if (updateResult) {
      return 'success';
    }
  }
  return undefined;
}

async function convertExcelDataToAppUserRecord(excelRecords) {
  const appUserRecordData = [];

  for (let record of excelRecords) {
    if (record.appUserIdentity) {
      const isExistedAccount = await AppUsersResourceAccess.find({ username: record.appUserIdentity }, 0, 1);

      if (!isExistedAccount || isExistedAccount.length <= 0) {
        const userData = {
          appUserRecord: {
            firstName: record.firstName,
            employeeCode: record.employeeCode,
            appUserIdentity: record.appUserIdentity,
            birthDay: record.birthDay,
            userHomeAddress: record.userHomeAddress,
            appUserRoleId: 2,
            isHidden: 1,
            username: record.appUserIdentity, // auto create account
            password: record.appUserIdentity, // auto create account
          },
          appUserWorkInfoRecord: {
            licenseDateFrom: record.licenseDateFrom,
            licenseDateEnd: record.licenseDateEnd,
            licenseDecisionDate: record.licenseDecisionDate,
            licenseCommitmentYear: record.licenseCommitmentYear,
            licenseNumber: record.licenseNumber,
            appUserLevel: record.appUserLevel,
          },
        };

        if (record.stationCode) {
          const userStation = await StationResourceAccess.find({ stationCode: record.stationCode }, 0, 1);
          if (userStation && userStation.length > 0) {
            userData.appUserRecord.stationsId = userStation[0].stationsId;
          }
        }

        appUserRecordData.push(userData);
      }
    }
  }

  return appUserRecordData;
}

async function countAllAppUser() {
  let _totalAppUser = 0;
  if (process.env.REDIS_ENABLE) {
    const RedisInstance = require('../../ThirdParty/Redis/RedisInstance');
    const _cacheKey = `TOTAL_APPUSER`;
    _totalAppUser = await RedisInstance.get(_cacheKey);

    if (isNotValidValue(_totalAppUser)) {
      _totalAppUser = 0;
    }

    if (_totalAppUser === 0) {
      _totalAppUser = await AppUsersResourceAccess.count({
        appUserRoleId: 0,
      });
    }

    await RedisInstance.setNoExpire(_cacheKey, Number(_totalAppUser) + 1);
  } else {
    _totalAppUser = await AppUsersResourceAccess.count({
      appUserRoleId: 0,
    });
  }

  return _totalAppUser;
}

async function attachDataForUser(appUserList) {
  const promiseList = appUserList.map(async user => {
    user.appUserRoleName = null;
    user.permissions = null;
    user.stationCode = null;

    if (user.appUserRoleId !== undefined) {
      const userRole = await AppUserRoleResourceAccess.findById(user.appUserRoleId);
      if (userRole) {
        user.appUserRoleName = userRole.appUserRoleName;
        user.permissions = userRole.permissions;
      }
    }

    if (user.stationsId !== undefined) {
      const station = await StationResourceAccess.findById(user.stationsId);
      if (station) {
        user.stationCode = station.stationCode;
      }
    }

    return user;
  });

  return await Promise.all(promiseList);
}

module.exports = {
  verifyUniqueUser,
  verifyCredentials,
  hashPassword,
  unhashPassword,
  retrieveUserDetail,
  changeUserPassword,
  generate2FACode,
  verify2FACode,
  createNewUser,
  verifyUserPhoneNumber,
  deleteUserAccount,
  getStationUserList,
  resetPasswordByUsername,
  activeUserByPhoneNumber,
  convertExcelDataToAppUserRecord,
  countAllAppUser,
  attachDataForUser,
};
