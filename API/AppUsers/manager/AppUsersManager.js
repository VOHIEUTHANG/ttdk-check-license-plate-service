/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
const AppUsersFunctions = require('../AppUsersFunctions');
const RoleUserView = require('../resourceAccess/RoleUserView');
const { getStationUserList } = require('../AppUsersFunctions');
const { logAppUserChanged } = require('../../SystemAppLogChangeAppUser/SystemAppLogChangeAppUserFunctions');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

const Logger = require('../../../utils/logging');
const StationsFunctions = require('../../Stations/StationsFunctions');
const { APP_USER_ERROR, USER_VERIFY_PHONE_NUMBER_STATUS, APP_USER_CATEGORY } = require('../AppUsersConstant');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { registerVehicleForUser, checkIfVehicleRegistered } = require('../../AppUserVehicle/AppUserVehicleFunctions');
const { sendResetPasswordEmail } = require('../../Email/EmailFunctions');
const { USER_VEHICLE_ERROR } = require('../../AppUserVehicle/AppUserVehicleConstant');
const { isValidValue, isNotValidValue } = require('../../ApiUtils/utilFunctions');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const VarSyncServices = require('../../../ThirdParty/VARConnector/VarSyncServices');
const AppUserWorkInfoResourceAccess = require('../../AppUserWorkInfo/resourceAccess/AppUserWorkInfoResourceAccess');
const { APP_USER_LEVEL } = require('../../AppUserWorkInfo/AppUserWorkInfoConstants');
const ExcelFunction = require('../../../ThirdParty/Excel/excelFunction');
const UploadFunctions = require('../../Upload/UploadFunctions');
const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
const AppUserDevicesResourceAccess = require('../../AppUserDevices/resourceAccess/AppUserDevicesResourceAccess');
const AppUserLoginHistoryResourceAccess = require('../resourceAccess/AppUserLoginHistoryResourceAccess');
const tokenService = require('../../ApiUtils/token');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload;
      let newUserId = await AppUsersFunctions.createNewUser(userData);
      if (newUserId) {
        let userDetail = await AppUsersFunctions.retrieveUserDetail(newUserId);
        if (userDetail) {
          if (userDetail.appUserRoleId > 0) {
            let stations = await StationsFunctions.getStationDetailById(userData.stationsId);

            await VarSyncServices.syncEmployeeInfo(req.headers, {
              stationCode: stations.stationCode,
              data: userDetail,
            }).catch(function (err) {
              console.error(`Insert appUser with employeeCode = ${employeeCode} to VAR failed`, err);
            });
          }
          resolve(userDetail);
        } else {
          reject('failed');
        }
      } else {
        reject('failed');
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
      let searchText = req.payload.searchText;
      let users = await RoleUserView.customSearch(filter, skip, limit, searchText, order);

      if (users && users.length >= 0) {
        users = await AppUsersFunctions.attachDataForUser(users);

        let usersCount = users.length;
        if (limit && users.length >= limit) {
          usersCount = await RoleUserView.customCount(filter, searchText);
        }

        resolve({ data: users, total: usersCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getListStationUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      let users = await AppUsersFunctions.getStationUserList(filter, skip, limit, searchText, order);

      if (users && users.length >= 0) {
        users = await AppUsersFunctions.attachDataForUser(users);

        let usersCount = users.length;
        if (limit && users.length >= limit) {
          usersCount = await RoleUserView.customCount(filter, searchText);
        }

        resolve({ data: users, total: usersCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getListStationStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      // fitler station staff
      const STATION_STAFF_ROLES = [2, 3];
      if (!filter.appUserRoleId) {
        filter.appUserRoleId = STATION_STAFF_ROLES;
      }

      let users = await RoleUserView.customSearch(filter, skip, limit, searchText, order);

      if (users && users.length >= 0) {
        users = await AppUsersFunctions.attachDataForUser(users);

        let usersCount = users.length;
        if (limit && users.length >= limit) {
          usersCount = await RoleUserView.customCount(filter, searchText);
        }

        resolve({ data: users, total: usersCount });
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
      let userData = req.payload.data;
      let appUserId = req.payload.id;

      const previousData = (await AppUsersResourceAccess.findById(appUserId)) || {};

      if (previousData && userData.email && userData.email !== previousData.email) {
        const existedRegisterEmail = await AppUsersResourceAccess.find({ email: userData.email }, 0, 1);
        if (existedRegisterEmail && existedRegisterEmail.length > 0) {
          return reject(APP_USER_ERROR.DUPLICATE_EMAIL);
        }
      }

      let updateResult = await AppUsersResourceAccess.updateById(appUserId, userData);
      if (updateResult) {
        let appUserData = await AppUsersResourceAccess.findById(appUserId);
        let stations = (await StationsFunctions.getStationDetailById(appUserData.stationsId)) || {};

        if (appUserData.appUserRoleId > 0) {
          await VarSyncServices.syncEmployeeInfo(req.headers, {
            stationCode: stations.stationCode,
            data: appUserData,
          }).catch(function (err) {
            console.error(`Update appUser with employeeCode = ${employeeCode} to VAR failed`, err);
          });
        }

        await logAppUserChanged(previousData, userData, req.currentUser, appUserId);

        resolve('success');
      } else {
        reject('failed to update user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let foundUser = await AppUsersFunctions.retrieveUserDetail(req.payload.id);

      if (foundUser) {
        resolve(foundUser);
      } else {
        reject(`can not find user`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function registerUser(req) {
  return insert(req);
}

async function loginUserByPhone(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.payload.phoneNumber;
      let password = req.payload.password;
      //verify credential
      let foundUser = await AppUsersFunctions.verifyCredentials(userName, password);

      if (foundUser) {
        if (!foundUser.active) {
          return reject(APP_USER_ERROR.USER_INACTIVATED);
        }
        if (!foundUser.isVerifiedPhoneNumber) {
          return reject(APP_USER_ERROR.NOT_VERIFIED_PHONE_NUMBER);
        }
        const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
        let _userVehiclesList = await AppUserVehicleResourceAccess.find(
          {
            appUserId: foundUser.appUserId,
          },
          0,
          100,
        );

        foundUser.vehicleList = _userVehiclesList;

        // save login ip address

        const requestIp = require('request-ip');
        const clientIp = requestIp.getClientIp(req);
        await _saveLoginHistory(clientIp, foundUser.appUserId);

        //TODO recheck performane later
        // await AppUsersResourceAccess.updateById(foundUser.appUserId, { lastActiveAt: new Date(), userToken: foundUser.token });
        resolve(foundUser);
      }

      reject(APP_USER_ERROR.INVALID_USER);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function loginUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.payload.username;
      let password = req.payload.password;
      //verify credential

      let foundUser = await AppUsersFunctions.verifyCredentials(userName, password);

      if (foundUser) {
        // Verify user's stations for web application only
        // if (req.headers.origin) {
        //   const { stationUrl } = await StationsFunctions.getStationDetailById(foundUser.stationsId);
        //   const requestURL = new URL(req.headers.origin);
        //   const stationHost = new URL(stationUrl).hostname;
        //   if (requestURL.hostname !== stationHost) {
        //     Logger.error(__filename, {
        //       message: 'incorrect stations',
        //       stationUrl: stationHost,
        //       requestURL: requestURL.hostname,
        //     });
        //     reject('failed');
        //   }
        // }

        if (foundUser.appUserRoleId <= 0) {
          console.error('NORMAL_USER_DO_NOT_HAVE_PERMISSION');
          return reject('failed');
        }
        //TODO recheck performane later
        // await AppUsersResourceAccess.updateById(foundUser.appUserId, { lastActiveAt: new Date(), userToken: foundUser.token });

        if (foundUser.stationsId > 0) {
          //TODO recheck performane later
          // await StationResourceAccess.updateById(foundUser.stationsId, { stationLastActiveAt: new Date() });
        }

        // save login ip address

        const requestIp = require('request-ip');
        const clientIp = requestIp.getClientIp(req);
        await _saveLoginHistory(clientIp, foundUser.appUserId);

        if (foundUser.twoFAEnable && foundUser.twoFAEnable > 0) {
          resolve({
            appUserId: foundUser.appUserId,
            twoFAEnable: foundUser.twoFAEnable,
          });
        } else {
          resolve(foundUser);
        }
      }

      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userResetPasswordByToken(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newPassword = req.payload.password;

      let result = AppUsersFunctions.changeUserPassword(req.currentUser, newPassword);
      if (result) {
        return resolve(result);
      } else {
        reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userResetPasswordByEmail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let _userEmail = req.payload.email;
      let _existingUser = await AppUsersResourceAccess.find(
        {
          email: _userEmail,
        },
        0,
        1,
      );
      if (_existingUser && _existingUser.length > 0) {
        let userDetail = await AppUsersFunctions.retrieveUserDetail(_existingUser[0].appUserId);
        await sendResetPasswordEmail(userDetail.email, userDetail.firstName, userDetail.token);
        resolve('success');
      } else {
        resolve('ok');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function changePasswordUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.currentUser.username;
      let password = req.payload.password;
      let newPassword = req.payload.newPassword;
      //verify credential
      let foundUser = await AppUsersFunctions.verifyCredentials(userName, password);

      if (foundUser) {
        let result = AppUsersFunctions.changeUserPassword(foundUser, newPassword);
        if (result) {
          return resolve(result);
        }
      }
      reject('change user password failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function verify2FA(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let users = await AppUsersResourceAccess.findById(req.payload.id);
      if (users) {
        let foundUser = users;
        if (foundUser) {
          let otpCode = req.payload.otpCode;

          let verified = AppUsersFunctions.verify2FACode(otpCode.toString(), foundUser.twoFACode);

          if (verified) {
            foundUser = await AppUsersFunctions.retrieveUserDetail(foundUser.appUserId);

            await AppUsersResourceAccess.updateById(foundUser.appUserId, {
              twoFAEnable: true,
            });
            resolve(foundUser);
          } else {
            reject('failed to verify2FA');
          }
        } else {
          reject('user is invalid to verify2FA');
        }
      } else {
        reject('user not found to verify2FA');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _loginSocial(userName, password, name, email, avatar, socialInfo) {
  //verify credential
  let foundUser = await AppUsersFunctions.verifyCredentials(userName, password);

  //if user is not found
  if (!foundUser) {
    let newUserData = {
      userName: userName,
      password: password,
      firstName: name,
      email: email,
      userAvatar: avatar,
    };

    if (socialInfo) {
      newUserData.socialInfo = JSON.stringify(socialInfo);
    }

    let registerResult = await AppUsersFunctions.createNewUser(newUserData);
    if (registerResult !== 'success') {
      return undefined;
    }
  }

  foundUser = await AppUsersFunctions.verifyCredentials(userName, password);

  await AppUsersResourceAccess.updateById(foundUser.appUserId, { lastActiveAt: new Date(), userToken: foundUser.token });

  if (foundUser.twoFAEnable && foundUser.twoFAEnable > 0) {
    return {
      appUserId: foundUser.appUserId,
      twoFAEnable: foundUser.twoFAEnable,
    };
  } else {
    return foundUser;
  }
}

async function loginFacebook(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.facebook_id && req.payload.facebook_id !== '' && req.payload.facebook_id !== null) {
        let userName = 'FB_' + req.payload.facebook_id;
        let password = req.payload.facebook_id;
        let avatar = req.payload.facebook_avatar;
        let email = req.payload.facebook_email;
        let firstName = req.payload.facebook_name;

        let loginResult = _loginSocial(userName, password, firstName, email, avatar, req.payload);
        if (loginResult) {
          resolve(loginResult);
        } else {
          reject('failed');
        }
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function loginGoogle(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.google_id && req.payload.google_id !== '' && req.payload.google_id !== null) {
        let userName = 'GOOGLE_' + req.payload.google_id;
        let password = req.payload.google_id;
        let avatar = req.payload.google_avatar;
        let email = req.payload.google_email;
        let firstName = req.payload.google_name;

        let loginResult = _loginSocial(userName, password, firstName, email, avatar, req.payload);
        if (loginResult) {
          resolve(loginResult);
        } else {
          reject('failed');
        }
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function loginApple(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.apple_id && req.payload.apple_id !== '' && req.payload.apple_id !== null) {
        let userName = 'APPLE_' + req.payload.apple_id;
        let password = req.payload.apple_id;
        let avatar = req.payload.apple_avatar;
        let email = req.payload.apple_email;
        let firstName = req.payload.apple_name;

        let loginResult = _loginSocial(userName, password, firstName, email, avatar, req.payload);
        if (loginResult) {
          resolve(loginResult);
        } else {
          reject('failed');
        }
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function loginZalo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.payload.zalo_id && req.payload.zalo_id !== '' && req.payload.zalo_id !== null) {
        let userName = 'ZALO_' + req.payload.zalo_id;
        let password = req.payload.zalo_id;
        let avatar = req.payload.zalo_avatar;
        let email = req.payload.zalo_email;
        let firstName = req.payload.zalo_name;

        let loginResult = _loginSocial(userName, password, firstName, email, avatar, req.payload);
        if (loginResult) {
          resolve(loginResult);
        } else {
          reject('failed');
        }
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function registerStationUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload;

      let insertResult = await AppUsersFunctions.createNewUser(userData);

      if (insertResult) {
        resolve(insertResult);
      } else {
        reject('failed');
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(APP_USER_ERROR).indexOf(e) >= 0) {
        console.error(`error AppUserManage can not registerUser: ${e}`);
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        console.error(`error AppUserManage can not registerUser: ${e}`);
        reject(e);
      } else {
        console.error(`error AppUserManage can not registerUser: ${UNKNOWN_ERROR}`);
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

let _totalAppUser = undefined;
async function _registerUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      let _appUserVehicle = undefined;
      if (userData.vehiclePlateNumber) {
        _appUserVehicle = userData.vehiclePlateNumber;
        delete userData.vehiclePlateNumber;
      }

      let _vehicleType = undefined;
      if (userData.vehicleType) {
        _vehicleType = userData.vehicleType;
        delete userData.vehicleType;
      }

      if (_appUserVehicle) {
        let _notValidToRegister = await checkIfVehicleRegistered(_appUserVehicle);
        if (_notValidToRegister) {
          console.error(userData);
          console.error(`USER_VEHICLE_ERROR.DUPLICATE_VEHICLE: ${_appUserVehicle} ${_vehicleType}`);
          return reject(USER_VEHICLE_ERROR.DUPLICATE_VEHICLE);
        }
      }

      // check valid phone number use api VMG
      // const isValidPhoneNumber = await SMSVMGAPIFunctions.checkPhoneNumber(userData.phoneNumber);
      // console.log(isValidPhoneNumber)
      // if (!isValidPhoneNumber) {
      //   throw APP_USER_ERROR.INVALID_PHONE_NUMBER;
      // }

      let newUser = await AppUsersFunctions.createNewUser(userData);

      if (newUser) {
        if (_appUserVehicle) {
          await registerVehicleForUser(newUser, _appUserVehicle, _vehicleType);
        }

        if (process.env.TELEGRAM_CHAT_ID && process.env.NODE_ENV === 'production') {
          if (!_totalAppUser) {
            _totalAppUser = await AppUsersFunctions.countAllAppUser();
          }

          if (_totalAppUser) {
            _totalAppUser++;
            await reportToTelegram(`Có người dùng mới: ${userData.username} - Tổng số người dùng: ${_totalAppUser}`);
          }
        }
        resolve(newUser);
      } else {
        console.error(`error AppUserManage can not registerUser: ${UNKNOWN_ERROR}`);
        reject('failed');
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(APP_USER_ERROR).indexOf(e) >= 0) {
        console.error(`error AppUserManage can not registerUser: ${e}`);
        reject(e);
      } else if (Object.keys(USER_VEHICLE_ERROR).indexOf(e) >= 0) {
        console.error(`error AppUserManage can not registerUser: ${e}`);
        reject(e);
      } else {
        console.error(`error AppUserManage can not registerUser: ${UNKNOWN_ERROR}`);
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function registerUserByPhone(req) {
  let userData = req.payload;

  //Coi số điện thoại là username luôn
  userData.username = req.payload.phoneNumber;
  userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.NOT_VERIFIED;

  return await _registerUser(userData);
}

async function registerEnterpriseAccount(req) {
  let userData = req.payload;

  //Coi số điện thoại là username luôn
  userData.username = req.payload.phoneNumber;
  userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.NOT_VERIFIED;

  userData.appUserCategory = APP_USER_CATEGORY.COMPANY_ACCOUNT;

  return await _registerUser(userData);
}

async function userDeleteUserAccount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await AppUsersFunctions.deleteUserAccount(req.currentUser);

      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function stationUserList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;

      filter.isHidden = 0;

      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.stationsId = req.currentUser.stationsId;
      } else {
        Logger.error('Do not have authorized to stationUserList');
        reject('failed');
      }

      let users = await getStationUserList(filter, skip, limit, searchText, order);
      users = await AppUsersFunctions.attachDataForUser(users);
      let usersCount = await RoleUserView.customCount(filter, searchText, order);
      if (users && usersCount) {
        resolve({ data: users, total: usersCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateStationUserById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload.data;
      let appUserId = req.payload.id;

      const isValidRequest = await _verifyOwnerStationUsers(req);
      if (!isValidRequest) {
        return reject(APP_USER_ERROR.NOT_HAVE_PERMISSION);
      }
      const previousData = await AppUsersResourceAccess.findById(appUserId);
      let updateResult = await AppUsersResourceAccess.updateById(appUserId, userData);
      if (updateResult) {
        await logAppUserChanged(previousData, userData, req.currentUser, appUserId);
        resolve('success');
      } else {
        reject('failed to update user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function userUpdateInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = req.payload.data;
      let appUserId = req.currentUser.appUserId;

      if (userData.tokenWeb) delete userData.tokenWeb;
      if (userData.tokenfcm) delete userData.tokenfcm;

      // save user devices
      if (userData.deviceModel) {
        const userDeviceInfo = userData.deviceModel;
        if (userDeviceInfo.macAddress) {
          const existedRecord = await AppUserDevicesResourceAccess.find({ macAddress: userDeviceInfo.macAddress }, 0, 1);
          if (!existedRecord || existedRecord.length <= 0) {
            const deviceData = { macAddress: userDeviceInfo.macAddress };
            if (userDeviceInfo.brand) {
              deviceData.deviceBrand = userDeviceInfo.brand;
            }
            if (userDeviceInfo.model) {
              deviceData.deviceModel = userDeviceInfo.model;
            }
            if (userDeviceInfo.deviceId) {
              deviceData.deviceCode = userDeviceInfo.deviceId;
            }

            await AppUserDevicesResourceAccess.insert(deviceData);
          }
        }
        delete userData.deviceModel;
      }

      // case only update user devices
      if (Object.keys(userData).length <= 0) {
        return resolve('success');
      }

      const previousData = await AppUsersResourceAccess.findById(appUserId);
      let updateResult = await AppUsersResourceAccess.updateById(appUserId, userData);
      if (updateResult) {
        await logAppUserChanged(previousData, userData, req.currentUser, appUserId);
        resolve('success');
      } else {
        reject('failed to update user');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function stationUserDetail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const isValidRequest = await _verifyOwnerStationUsers(req);
      if (!isValidRequest) {
        return reject(APP_USER_ERROR.NOT_HAVE_PERMISSION);
      }

      let foundUser = await AppUsersFunctions.retrieveUserDetail(req.payload.id);

      if (foundUser) {
        resolve(foundUser);
      } else {
        reject(`can not find user`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function staffChangePasswordUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newPassword = req.payload.newPassword;
      //verify credential
      let foundUser = await AppUsersFunctions.retrieveUserDetail(req.payload.id);

      if (foundUser) {
        let result = AppUsersFunctions.changeUserPassword(foundUser, newPassword);
        if (result) {
          resolve(result);
        }
      }
      reject('change user password failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function robotActiveUserByPhone(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let apiKey = req.query.apiKey;
      if (!process.env.SYSTEM_API_KEY || process.env.SYSTEM_API_KEY === '' || apiKey !== process.env.SYSTEM_API_KEY) {
        return reject('INVALID_API_KEY');
      }

      await AppUsersFunctions.activeUserByPhoneNumber(req.query.phoneNumber);
      resolve('ok');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function robotResetUserPasswordByPhone(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let apiKey = req.query.apiKey;
      if (!process.env.SYSTEM_API_KEY || process.env.SYSTEM_API_KEY === '' || apiKey !== process.env.SYSTEM_API_KEY) {
        return reject('INVALID_API_KEY');
      }

      await AppUsersFunctions.resetPasswordByUsername(req.query.phoneNumber);
      resolve('ok');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetDetailInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let foundUser = await AppUsersFunctions.retrieveUserDetail(req.currentUser.appUserId);
      if (foundUser) {
        resolve(foundUser);
      } else {
        reject(`can not find user`);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _verifyOwnerStationUsers(req) {
  let currentUser = req.currentUser;
  let userId = req.payload.id;

  if (currentUser.appUserId && currentUser.stationsId && currentUser.appUserRoleId === 1) {
    // checking manipulate users belongs to owner station
    const targetAppUser = await AppUsersResourceAccess.findById(userId);

    if (targetAppUser && targetAppUser.stationsId === currentUser.stationsId) {
      return true;
    }
  }

  return false;
}

async function exportAppUser(req) {
  return new Promise(async (resolve, reject) => {
    let fileName = 'DS_DKV' + moment().format('YYYYMMDDHHmm') + '.xlsx';
    const filepath = 'uploads/exportExcel/' + fileName;
    try {
      let filter = req.payload.filter || {};
      let searchText = req.payload.searchText;
      let order = req.payload.order;
      let skip = undefined;
      let limit = undefined;

      const appUserList = await getStationUserList(filter, skip, limit, searchText, order);

      if (appUserList && appUserList.length > 0) {
        let newData = await _exportRecordToExcel(appUserList, filepath);
        if (newData) {
          let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + filepath;
          return resolve(newExcelUrl);
        } else {
          console.error(`error exportCustomerRecord Customer Record: ${UNKNOWN_ERROR}`);
          return reject(UNKNOWN_ERROR);
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _exportRecordToExcel(records, filepath) {
  const workSheetName = 'Danh sách đăng kiểm viên';
  const dataRows = [];

  //worksheet title
  const workSheetTitle = [
    '', //break 1 columns
    '', //break 1 columns
    '', //break 1 columns
    'Danh sách đăng kiểm viên',
  ];
  dataRows.push(workSheetTitle);

  dataRows.push(['']); //break 1 rows

  //table headers
  const workSheetColumnNames = [
    'Mã Trạm',
    'Họ và Tên',
    'Mã số',
    'Hạng ĐKV',
    'Năm Sinh',
    'Quê quán',
    'Từ Ngày Giấy Chứng Nhận',
    'Đến Ngày Giấy Chứng Nhận',
    'Ngày Quyết Định',
    'Số Giấy Chứng Nhận',
    'Năm ký',
  ];
  dataRows.push(workSheetColumnNames);

  //Table data
  for (let record of records) {
    let userLevel = '-';
    switch (record.appUserLevel) {
      case APP_USER_LEVEL.NORMAL:
        userLevel = 'Đăng kiểm viên xe cơ giới';
        break;
      case APP_USER_LEVEL.HIGH_LEVEL:
        userLevel = 'Đăng kiểm viên xe cơ giới bậc cao';
        break;
    }

    dataRows.push([
      record.stationCode,
      record.firstName,
      record.employeeCode,
      userLevel,
      record.birthDay,
      record.userHomeAddress,
      record.licenseDateFrom,
      record.licenseDateEnd,
      record.licenseDecisionDate,
      record.licenseNumber,
      record.licenseCommitmentYear,
    ]);
  }

  ExcelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
  return 'OK';
}

async function exportAppUserExcel(req) {
  return new Promise(async (resolve, reject) => {
    let fileName = 'DS_DKV' + moment().format('YYYYMMDDHHmm') + '.xlsx';
    const filepath = 'uploads/exportExcel/' + fileName;
    try {
      let filter = req.payload.filter || {};
      let searchText = req.payload.searchText;
      let order = req.payload.order;
      let skip = undefined;
      let limit = undefined;

      const appUserList = await getStationUserList(filter, skip, limit, searchText, order);

      if (appUserList && appUserList.length > 0) {
        let newData = await _exportAppUserListToExcel(appUserList, filepath);
        if (newData) {
          let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + filepath;
          return resolve(newExcelUrl);
        } else {
          console.error(`error exportCustomerRecord Customer Record: ${UNKNOWN_ERROR}`);
          return reject(UNKNOWN_ERROR);
        }
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _exportAppUserListToExcel(records, filepath) {
  const workSheetName = 'Danh sách đăng kiểm viên';
  const dataRows = [];

  //table headers
  const workSheetColumnNames = [
    'Mã Trạm',
    'Họ và Tên',
    'Mã số ĐKV',
    'ĐKV XCG Bậc cao',
    'ĐKV XCG',
    'Số CCCD',
    'Năm Sinh',
    'Quê Quán',
    'Ngày hết hạn GCN ĐKV',
    'Số chưng nhận ĐKV',
  ];
  dataRows.push(workSheetColumnNames);

  //Table data
  for (let record of records) {
    dataRows.push([
      record.stationCode,
      record.firstName,
      record.employeeCode,
      record.appUserLevel === APP_USER_LEVEL.HIGH_LEVEL ? 'x' : '',
      record.appUserLevel === APP_USER_LEVEL.NORMAL ? 'x' : '',
      record.appUserIdentity,
      record.birthDay,
      record.userHomeAddress,
      record.licenseDateEnd,
      record.licenseNumber,
    ]);
  }

  ExcelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
  return 'OK';
}

async function importAppUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let fileData = req.payload.file;
      let fileFormat = req.payload.fileFormat;

      const originalData = Buffer.from(fileData, 'base64');
      let newExcel = await UploadFunctions.uploadExcel(originalData, fileFormat);
      if (newExcel) {
        let path = 'uploads/importExcel/' + newExcel;
        let excelData = await ExcelFunction.importAppUserList(path);

        if (excelData === undefined) {
          return reject('failed to import');
        } else {
          //notify to front-end
          //front-end will use this counter to display user waiting message
          if (excelData.length > 1000) {
            //!! IMPORTANT: do not return function here
            //if there are more than 1000 record, we will response before function done
            resolve({
              needToImportRecordSuccess: 'importSuccess',
              importTotalWaiting: excelData.length,
            });
          }

          // if it is less than 1000 records, let user wait until it finishes
          const needToImportRecords = await AppUsersFunctions.convertExcelDataToAppUserRecord(excelData);
          if (needToImportRecords === undefined) {
            return reject('failed to convert excel to appUser model');
          }

          let importSuccessCount = 0;

          for (let appUser of needToImportRecords) {
            const appUserId = await AppUsersFunctions.createNewUser(appUser.appUserRecord);
            if (appUserId) {
              const isExistedInfo = await AppUserWorkInfoResourceAccess.findById(appUserId);
              if (!isExistedInfo) {
                await AppUserWorkInfoResourceAccess.insert({ ...appUser.appUserWorkInfoRecord, appUserId: appUserId });
              } else {
                await AppUserWorkInfoResourceAccess.updateById(appUserId, appUser.appUserWorkInfoRecord);
              }

              importSuccessCount++;
            }
          }

          // //if data is bigger than 1000 record, API will response before import,
          // //then no need to respon here
          if (excelData.length < 1000) {
            resolve({
              importSuccess: importSuccessCount,
              importTotal: needToImportRecords.length,
            });
          }
        }
      } else {
        return reject('failed to upload');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userRefreshToken(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = req.payload.token;
      const userData = tokenService.decodeTokenWithoutExpired(token);

      if (userData) {
        const refreshUserInfo = await AppUsersFunctions.retrieveUserDetail(userData.appUserId);
        if (refreshUserInfo && refreshUserInfo.token) {
          return resolve({ newToken: refreshUserInfo.token });
        }
      }

      return reject(APP_USER_ERROR.INVALID_TOKEN);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

function _saveLoginHistory(clientIp, appUserId) {
  const data = {
    loginIpAddress: clientIp,
    appUserId: appUserId,
  };

  return AppUserLoginHistoryResourceAccess.insert(data);
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  registerUser,
  registerUserByPhone,
  userDeleteUserAccount,
  loginUser,
  loginUserByPhone,
  userGetDetailInfo,
  userResetPasswordByToken,
  userResetPasswordByEmail,
  changePasswordUser,
  verify2FA,
  loginFacebook,
  loginGoogle,
  loginZalo,
  loginApple,
  registerStationUser,
  registerEnterpriseAccount,
  robotActiveUserByPhone,
  robotResetUserPasswordByPhone,
  stationUserList,
  updateStationUserById,
  userUpdateInfo,
  stationUserDetail,
  staffChangePasswordUser,
  exportAppUser,
  exportAppUserExcel,
  getListStationUser,
  getListStationStaff,
  importAppUser,
  userRefreshToken,
};
