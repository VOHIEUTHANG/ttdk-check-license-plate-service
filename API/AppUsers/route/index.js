/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const AppUsers = require('./AppUsersRoute');

module.exports = [
  // AppUsers APIs
  // { method: 'POST', path: '/AppUsers/registerUser', config: AppUsers.registerUser },
  { method: 'POST', path: '/AppUsers/registerUserByPhone', config: AppUsers.registerUserByPhone },
  { method: 'POST', path: '/AppUsers/registerEnterpriseAccount', config: AppUsers.registerEnterpriseAccount },
  { method: 'POST', path: '/AppUsers/user/deleteAccount', config: AppUsers.userDeleteUserAccount },
  { method: 'POST', path: '/AppUsers/loginUserByPhone', config: AppUsers.loginUserByPhone },
  { method: 'POST', path: '/AppUsers/loginUser', config: AppUsers.loginUser },
  { method: 'POST', path: '/AppUsers/user/updateInfoUser', config: AppUsers.userUpdateInfo },
  { method: 'POST', path: '/AppUsers/user/getDetailInfo', config: AppUsers.userGetDetailInfo },
  { method: 'POST', path: '/AppUsers/user/getUserInfo', config: AppUsers.userGetDetailInfo },
  { method: 'POST', path: '/AppUsers/user/changePasswordUser', config: AppUsers.userChangePassword },
  { method: 'POST', path: '/AppUsers/user/resetPasswordUserByToken', config: AppUsers.userResetPasswordByToken },
  { method: 'POST', path: '/AppUsers/user/resetPasswordByEmail', config: AppUsers.userResetPasswordByEmail },
  { method: 'POST', path: '/AppUsers/user/refreshToken', config: AppUsers.userRefreshToken },

  // { method: 'POST', path: '/AppUsers/loginApple', config: AppUsers.loginApple },
  // { method: 'POST', path: '/AppUsers/loginFacebook', config: AppUsers.loginFacebook },
  // { method: 'POST', path: '/AppUsers/loginGoogle', config: AppUsers.loginGoogle },
  // { method: 'POST', path: '/AppUsers/loginZalo', config: AppUsers.loginZalo },
  { method: 'POST', path: '/AppUsers/getListUser', config: AppUsers.find },
  { method: 'POST', path: '/AppUsers/getListStationUser', config: AppUsers.getListStationUser },
  { method: 'POST', path: '/AppUsers/getListStationStaff', config: AppUsers.getListStationStaff },
  { method: 'POST', path: '/AppUsers/getDetailUserById', config: AppUsers.findById },
  { method: 'POST', path: '/AppUsers/updateUserById', config: AppUsers.updateById },
  { method: 'POST', path: '/AppUsers/changePasswordUser', config: AppUsers.changePasswordUser },
  { method: 'POST', path: '/AppUsers/verify2FA', config: AppUsers.verify2FA },
  { method: 'GET', path: '/AppUsers/get2FACode', config: AppUsers.get2FACode },
  { method: 'POST', path: '/AppUsers/staffChangePasswordUser', config: AppUsers.staffChangePasswordUser },
  { method: 'POST', path: '/AppUsers/robot/activeUserByPhone', config: AppUsers.robotActiveUserByPhone },
  { method: 'POST', path: '/AppUsers/robot/resetUserPasswordByPhone', config: AppUsers.robotResetUserPasswordByPhone },
  { method: 'POST', path: '/AppUsers/exportAppUser', config: AppUsers.exportAppUser },
  { method: 'POST', path: '/AppUsers/exportAppUserExcel', config: AppUsers.exportAppUserExcel },
  { method: 'POST', path: '/AppUsers/importAppUserExcel', config: AppUsers.importAppUser },

  // Station User APIs
  { method: 'POST', path: '/AppUsers/advanceUser/changePassword', config: AppUsers.advanceUserChangePassword },
  { method: 'POST', path: '/AppUsers/advanceUser/updateUserById', config: AppUsers.advanceUserUpdateById },
  { method: 'POST', path: '/AppUsers/advanceUser/resetPasswordUserByToken', config: AppUsers.advanceUserResetPasswordByToken },
  { method: 'POST', path: '/AppUsers/advanceUser/resetPasswordByEmail', config: AppUsers.userResetPasswordByEmail },
  { method: 'POST', path: '/AppUsers/advanceUser/registerStationUser', config: AppUsers.registerStationUser },
  { method: 'POST', path: '/AppUsers/advanceUser/stationUserList', config: AppUsers.stationUserList },
  { method: 'POST', path: '/AppUsers/advanceUser/updateStationUserById', config: AppUsers.updateStationUserById },
  { method: 'POST', path: '/AppUsers/advanceUser/stationUserDetail', config: AppUsers.stationUserDetail },
];
