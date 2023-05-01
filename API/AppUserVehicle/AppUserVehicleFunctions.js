/* Copyright (c) 2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const AppUserVehicleResourceAccess = require('../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const { USER_VEHICLE_ERROR, VEHICLE_TYPE, VEHICLE_PLATE_TYPE } = require('./AppUserVehicleConstant');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const { APP_USER_CATEGORY } = require('../AppUsers/AppUsersConstant');

async function registerVehicleForUser(appUserId, vehicleIdentity, vehicleType) {
  let _newData = {
    appUserId: appUserId,
    vehicleIdentity: vehicleIdentity,
  };

  if (vehicleType) {
    _newData.vehicleType = vehicleType;
  }
  return await AppUserVehicleResourceAccess.insert(_newData);
}

async function checkIfVehicleRegistered(vehicleIdentity) {
  let _filter = {
    vehicleIdentity: vehicleIdentity,
  };

  let _existingRegistered = await AppUserVehicleResourceAccess.find(_filter, 0, 1);

  if (_existingRegistered && _existingRegistered.length > 0) {
    const VALID_FOR_NEW_REGISTER = false;
    return VALID_FOR_NEW_REGISTER;
  } else {
    const ALREADY_REGISTERED_BEFORE = true;
    return ALREADY_REGISTERED_BEFORE;
  }
}

async function addNewUserVehicle(userVehicleData) {
  const isValidForNewRegister = await checkIfVehicleRegistered(userVehicleData.vehicleIdentity);
  if (!isValidForNewRegister) {
    throw USER_VEHICLE_ERROR.DUPLICATE_VEHICLE;
  }

  // gioi han cho tai khoan khach hang binh thuong chi duoc dang ky toi da 5 phuong tien
  const appUser = await AppUsersResourceAccess.findById(userVehicleData.appUserId);
  if (appUser && appUser.appUserCategory !== APP_USER_CATEGORY.COMPANY_ACCOUNT) {
    const MAX_USER_VEHICLE = 5;
    const userVehicleList = await AppUserVehicleResourceAccess.find({ appUserId: userVehicleData.appUserId }, 0, MAX_USER_VEHICLE);
    if (userVehicleList && userVehicleList.length >= MAX_USER_VEHICLE) {
      throw USER_VEHICLE_ERROR.MAX_OWNER_VEHICLE;
    }
  }

  const insertResult = await AppUserVehicleResourceAccess.insert(userVehicleData);
  return insertResult;
}

async function deleteUserVehicleOfAppUser(appUserId) {
  const MAX_COUNT = 500;
  const vehicleList = await AppUserVehicleResourceAccess.find({ appUserId: appUserId }, 0, MAX_COUNT);

  if (vehicleList && vehicleList.length > 0) {
    const promiseList = vehicleList.map(vehicle => AppUserVehicleResourceAccess.deleteById(vehicle.appUserVehicleId));
    await Promise.all(promiseList);
  }
}

function checkValidVehicleIdentity(vehicleIdentity, vehicleType, plateColor) {
  let isValidVehicle = true;

  // checking contain valid serial character
  const specialSerialChar = 'KT,LD,DA,MK,MD,MĐ,TD,TĐ,HC,NG,QT,NN,CV,CD,LB,R'.split(',');
  const normalSerialChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z'];

  const includedNormalSerialChars = normalSerialChar.filter(char => vehicleIdentity.includes(char));
  const includedSpecialSerialChars = specialSerialChar.filter(char => vehicleIdentity.includes(char));
  let serialIndex = -1;

  if (includedSpecialSerialChars.length > 0) {
    if (includedSpecialSerialChars.length !== 1) {
      isValidVehicle = false;
    } else {
      const includedChar = includedSpecialSerialChars[0];
      serialIndex = vehicleIdentity.indexOf(includedChar);
      // check is also contain normal serial characters
      const serialMaxIndex = serialIndex + includedChar.length - 1;
      const isContainRedundantNormalChar = includedNormalSerialChars.some(char => {
        const index = vehicleIdentity.indexOf(char);
        return index < serialIndex || index > serialMaxIndex;
      });

      if (isContainRedundantNormalChar) {
        isValidVehicle = false;
      }
    }
  } else if (includedNormalSerialChars.length !== 1) {
    isValidVehicle = false;
  } else {
    serialIndex = vehicleIdentity.indexOf(includedNormalSerialChars[0]);
  }


  // // checking location number
  // if (serialIndex >= 0) {
  //   const locationNumber = vehicleIdentity.slice(0, serialIndex);
  //   if (Number(locationNumber) < 11 || Number(locationNumber) > 99 || locationNumber.length > 2) {
  //     isValidVehicle = false;
  //   }
  // }

  // // checking plate color match serial character
  // if (plateColor === VEHICLE_PLATE_TYPE.YELLOW && !includedNormalSerialChars) {
  //   return false;
  // }
  // if (plateColor === VEHICLE_PLATE_TYPE.WHITE && !includedNormalSerialChars) {
  //   return false;
  // }

  // checking vehicle type match serial character
  const SERIAL_CHARACTER_FOR_ROMOOC = 'R';
  if (vehicleType === VEHICLE_TYPE.RO_MOOC && !vehicleIdentity.includes(SERIAL_CHARACTER_FOR_ROMOOC)) {
    isValidVehicle = false;
  }
  if (vehicleType !== VEHICLE_TYPE.RO_MOOC && vehicleIdentity.includes(SERIAL_CHARACTER_FOR_ROMOOC)) {
    isValidVehicle = false;
  }

  // checking plate number length
  const MAX_LENGTH = 12;
  const MIN_LENGTH = 6;

  if (vehicleIdentity.length < MIN_LENGTH || vehicleIdentity.length > MAX_LENGTH) {
    isValidVehicle = false;
  }

  return isValidVehicle;
}

module.exports = {
  registerVehicleForUser,
  checkIfVehicleRegistered,
  addNewUserVehicle,
  deleteUserVehicleOfAppUser,
  checkValidVehicleIdentity,
};
