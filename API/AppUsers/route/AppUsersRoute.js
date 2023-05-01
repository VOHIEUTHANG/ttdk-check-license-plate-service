/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moduleName = 'AppUsers';
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require('joi');
const { VEHICLE_PLATE_TYPE } = require('../../AppUserVehicle/AppUserVehicleConstant');
const Response = require('../../Common/route/response').setup(Manager);
const CommonFunctions = require('../../Common/CommonFunctions');
const AppUsersFunctions = require('../AppUsersFunctions');
const SystemStatus = require('../../Maintain/MaintainFunctions').systemStatus;
const { CUSTOMER_RECORD_DISPLAY_DATE_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { COMPANY_STATUS } = require('../AppUsersConstant');
const moment = require('moment');

const insertSchema = {
  lastName: Joi.string(),
  firstName: Joi.string(),
  username: Joi.string().alphanum().min(6).max(30).required(),
  email: Joi.string().email().max(255),
  password: Joi.string().min(6).max(30).required(),
  phoneNumber: Joi.string().min(5).max(20),
  stationsId: Joi.number().required().min(0),
  appUserPosition: Joi.string(),
  appUserWorkStep: Joi.string(),
};

const updateSchema = {
  firstName: Joi.string().allow(''),
  phoneNumber: Joi.string().min(5).max(20),
  email: Joi.string().email().max(255).allow(''),
  active: Joi.number().min(0).max(1),
  twoFAEnable: Joi.number().min(0).max(1),
  isDeleted: Joi.number(),
  isVerifiedPhoneNumber: Joi.number(),
  appUserPosition: Joi.string(),
  appUserWorkStep: Joi.string(),
  appUserWorkInfoId: Joi.number().integer(),
  userHomeAddress: Joi.string(),
  birthDay: Joi.string().example(moment().subtract(23, 'years').format(CUSTOMER_RECORD_DISPLAY_DATE_FORMAT)),
  appUserIdentity: Joi.string().min(9).max(12),
  companyName: Joi.string().allow(''),
  appUserCategory: Joi.number().integer(),
  isHidden: Joi.number().valid([0, 1]),
  companyStatus: Joi.number().valid([COMPANY_STATUS.ACCEPT, COMPANY_STATUS.NOT_ACCEPT]),
};

const filterSchema = {
  active: Joi.number().min(0).max(1),
  appUserRoleId: Joi.number().min(0).default(0),
  stationsId: Joi.number().min(0),
  isVerifiedPhoneNumber: Joi.number().integer(),
  appUserCategory: Joi.number().integer(),
};

module.exports = {
  insert: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      Response(req, res, 'insert');
    },
  },
  updateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object({
          ...updateSchema,
          stationsId: Joi.number().min(0),
          appUserRoleId: Joi.number().integer(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  advanceUserUpdateById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object(updateSchema),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateById');
    },
  },
  find: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          ...filterSchema,
          appUserLevel: Joi.number().integer(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string().allow(''),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'find');
    },
  },
  getListStationUser: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          ...filterSchema,
          appUserLevel: Joi.number().integer(),
          stationArea: Joi.string(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string().allow(''),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getListStationUser');
    },
  },
  getListStationStaff: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object({
          ...filterSchema,
          appUserLevel: Joi.number().integer(),
        }),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string().allow(''),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'getListStationStaff');
    },
  },
  exportAppUser: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(''),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportAppUser');
    },
  },
  exportAppUserExcel: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        searchText: Joi.string().allow(''),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'exportAppUserExcel');
    },
  },
  findById: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'findById');
    },
  },
  userGetDetailInfo: {
    tags: ['api', `${moduleName}`],
    description: `userGetDetailInfo ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userGetDetailInfo');
    },
  },
  loginUser: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        username: Joi.string().alphanum().min(6).max(30).required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'loginUser');
    },
  },
  loginUserByPhone: {
    tags: ['api', `${moduleName}`],
    description: `loginUserByPhone ${moduleName}`,
    validate: {
      payload: Joi.object({
        password: Joi.string().required().min(6).max(30), //mat khau
        phoneNumber: Joi.string().required().min(8).max(20).alphanum(), //so dien thoai dang ky
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'loginUserByPhone');
    },
  },

  loginFacebook: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        facebook_id: Joi.string().required(),
        facebook_avatar: Joi.string(),
        facebook_name: Joi.string(),
        facebook_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'loginFacebook');
    },
  },
  loginGoogle: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        google_id: Joi.string().required(),
        google_avatar: Joi.string(),
        google_name: Joi.string(),
        google_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'loginGoogle');
    },
  },
  loginZalo: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        zalo_id: Joi.string().required(),
        zalo_avatar: Joi.string(),
        zalo_name: Joi.string(),
        zalo_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'loginZalo');
    },
  },
  loginApple: {
    tags: ['api', `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        apple_id: Joi.string().required(),
        apple_avatar: Joi.string(),
        apple_name: Joi.string(),
        apple_email: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'loginApple');
    },
  },
  registerUser: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        ...insertSchema,
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'registerUser');
    },
  },
  registerUserByPhone: {
    tags: ['api', `${moduleName}`],
    description: `registerUserByPhone ${moduleName}`,
    validate: {
      payload: Joi.object({
        password: Joi.string().required().min(6).max(30), //mat khau
        phoneNumber: Joi.string().required().min(8).max(20).alphanum(), //so dien thoai dang ky
        firstName: Joi.string().min(1).max(255), //ho va ten khach hang
        vehiclePlateNumber: Joi.string().min(5).max(15).alphanum(), //bien so xe
        vehicleType: Joi.string().min(5).max(15).alphanum().default(VEHICLE_PLATE_TYPE.WHITE).valid(Object.keys(VEHICLE_PLATE_TYPE)), //bien so xe
        email: Joi.string().email(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'registerUserByPhone');
    },
  },
  registerEnterpriseAccount: {
    tags: ['api', `${moduleName}`],
    description: `registerEnterpriseAccount ${moduleName}`,
    validate: {
      payload: Joi.object({
        password: Joi.string().required().min(6).max(30), //mat khau
        phoneNumber: Joi.string().required().min(8).max(20).alphanum(), //so dien thoai dang ky
        firstName: Joi.string().min(1).max(255), //ho va ten khach hang
        vehiclePlateNumber: Joi.string().min(5).max(15).alphanum(), //bien so xe
        vehicleType: Joi.string().min(5).max(15).alphanum().default(VEHICLE_PLATE_TYPE.WHITE).valid(Object.keys(VEHICLE_PLATE_TYPE)), //bien so xe
        email: Joi.string().email(),
        businessLicenseUrl: Joi.string().required(),
        companyName: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'registerEnterpriseAccount');
    },
  },
  userDeleteUserAccount: {
    tags: ['api', `${moduleName}`],
    description: `userDeleteUserAccount ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({}),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'userDeleteUserAccount');
    },
  },
  userResetPasswordByToken: {
    tags: ['api', `${moduleName}`],
    description: `reset password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'userResetPasswordByToken');
    },
  },
  advanceUserResetPasswordByToken: {
    tags: ['api', `${moduleName}`],
    description: `reset password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'userResetPasswordByToken');
    },
  },
  userResetPasswordByEmail: {
    tags: ['api', `${moduleName}`],
    description: `reset password ${moduleName}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().required().email().max(255),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'userResetPasswordByEmail');
    },
  },
  changePasswordUser: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'changePasswordUser');
    },
  },
  advanceUserChangePassword: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'changePasswordUser');
    },
  },
  userChangePassword: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        password: Joi.string().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'changePasswordUser');
    },
  },
  verify2FA: {
    tags: ['api', `${moduleName}`],
    description: `change password ${moduleName}`,
    validate: {
      payload: Joi.object({
        otpCode: Joi.string().required(),
        id: Joi.number().required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'verify2FA');
    },
  },
  get2FACode: {
    tags: ['api', `${moduleName}`],
    description: `get QrCode for 2FA ${moduleName}`,
    validate: {
      query: {
        id: Joi.number(),
      },
    },
    handler: function (req, res) {
      if (req.query.id) {
        AppUsersFunctions.generate2FACode(req.query.id).then(qrCode => {
          if (qrCode) {
            res.file(qrCode);
          } else {
            res('error').code(500);
          }
        });
      } else {
        res('error').code(500);
      }
    },
  },
  registerStationUser: {
    tags: ['api', `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object({
        lastName: Joi.string(),
        firstName: Joi.string(),
        username: Joi.string().alphanum().min(6).max(30).required(),
        email: Joi.string().email(),
        password: Joi.string().required(),
        phoneNumber: Joi.string(),
        stationsId: Joi.number().required().min(0),
        appUserRoleId: Joi.number(),
        appUserPosition: Joi.string(),
        appUserWorkStep: Joi.string(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res('maintain').code(500);
        return;
      }
      Response(req, res, 'registerStationUser');
    },
  },
  stationUserList: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        filter: Joi.object(filterSchema),
        skip: Joi.number().default(0).min(0),
        limit: Joi.number().default(20).max(100),
        searchText: Joi.string(),
        order: Joi.object({
          key: Joi.string().default('createdAt').allow(''),
          value: Joi.string().default('desc').allow(''),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'stationUserList');
    },
  },
  stationUserDetail: {
    tags: ['api', `${moduleName}`],
    description: `find by id ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'stationUserDetail');
    },
  },
  userUpdateInfo: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} update info`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyOwnerToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number(),
        data: Joi.object({
          firstName: Joi.string().min(1).max(255),
          firebaseToken: Joi.string().max(1999),
          email: Joi.string().email().max(100),
          companyName: Joi.string().min(1).max(255),
          tokenWeb: Joi.string(),
          tokenfcm: Joi.string(),
          deviceModel: Joi.object(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userUpdateInfo');
    },
  },
  updateStationUserById: {
    tags: ['api', `${moduleName}`],
    description: `update ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyAdvanceUserToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().min(0),
        data: Joi.object({
          lastName: Joi.string(),
          firstName: Joi.string(),
          phoneNumber: Joi.string(),
          active: Joi.number().min(0).max(1),
          email: Joi.string(),
          isDeleted: Joi.number(),
          appUserRoleId: Joi.number(),
          appUserPosition: Joi.string(),
          appUserWorkStep: Joi.string(),
        }),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'updateStationUserById');
    },
  },
  staffChangePasswordUser: {
    tags: ['api', `${moduleName}`],
    description: `staffChangePasswordUser ${moduleName}`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        id: Joi.number().required(),
        newPassword: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'staffChangePasswordUser');
    },
  },
  robotActiveUserByPhone: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} robotActiveUserByPhone`,
    validate: {
      query: Joi.object({
        phoneNumber: Joi.string().required(),
        apiKey: Joi.string().required(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'robotActiveUserByPhone');
    },
  },
  robotResetUserPasswordByPhone: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} robotResetUserPasswordByPhone`,
    validate: {
      query: Joi.object({
        phoneNumber: Joi.string().required(),
        apiKey: Joi.string().required(),
      }).unknown(),
    },
    handler: function (req, res) {
      Response(req, res, 'robotResetUserPasswordByPhone');
    },
  },
  importAppUser: {
    tags: ['api', `${moduleName}`],
    description: `${moduleName} import appUser`,
    pre: [{ method: CommonFunctions.verifyToken }, { method: CommonFunctions.verifyStaffToken }],
    auth: {
      strategy: 'jwt',
    },
    validate: {
      headers: Joi.object({
        authorization: Joi.string(),
      }).unknown(),
      payload: Joi.object({
        file: Joi.binary().encoding('base64').required(),
        fileFormat: Joi.string().valid(['xlsx', 'xls', 'csv']).required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'importAppUser');
    },
  },
  userRefreshToken: {
    tags: ['api', `${moduleName}`],
    description: `refresh token ${moduleName}`,
    validate: {
      payload: Joi.object({
        token: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      Response(req, res, 'userRefreshToken');
    },
  },
};
