/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const { reportToTelegram } = require('../../ThirdParty/TelegramBot/TelegramBotFunctions');
const token = require('../ApiUtils/token');
const { isInvalidStringValue } = require('../ApiUtils/utilFunctions');
const SystemStatus = require('../Maintain/MaintainFunctions').systemStatus;
const errorCodes = require('./route/response').errorCodes;
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const StaffResourceAccess = require('../Staff/resourceAccess/StaffResourceAccess');
const AppUserRoleResourceAccess = require('../AppUserRole/resourceAccess/AppUserRoleResourceAccess');

async function verifyToken(request, reply) {
  return new Promise(async function (resolve) {
    let requestToken = request.headers.authorization;
    let result = token.decodeToken(requestToken);

    // !!FEATURE 20230221 Tracking hacker IPs
    //store IP & last login
    const requestIp = require('request-ip');
    const clientIp = requestIp.getClientIp(request);

    //invalid token
    if (result === undefined) {
      console.error(`invalid token`);
      await reportToTelegram(`!! some one using invalid token from ${clientIp} : ${requestToken}`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    //append current user to request
    request.currentUser = result;

    if (!request.currentUser.active) {
      console.error(`currentUser inactive`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (result === undefined || (result.appUserId && SystemStatus.all === false)) {
      console.error(`currentUser invalid || SystemStatus maintain`);
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (result.appUserId) {
      let currentUser = await AppUsersResourceAccess.findById(result.appUserId);

      // requestToken = requestToken.replace('Bearer ', '');
      // if (currentUser && currentUser.length > 0 && currentUser[0].userToken && currentUser[0].userToken !== requestToken) {
      //   reply.response(errorCodes[505]).code(505).takeover();
      //   return;
      // }

      // !!FEATURE 20230221 Tracking hacker IPs
      //store IP & last login
      if (currentUser && (isInvalidStringValue(currentUser.userIpAddress) || currentUser.userIpAddress !== clientIp)) {
        //TODO check performance later
        if (currentUser.username === '0343902960') {
          await AppUsersResourceAccess.updateById(result.appUserId, {
            userIpAddress: clientIp,
          });
        }
      }

      if (currentUser && currentUser.active) {
        request.currentUser = currentUser;
        resolve('ok');
      } else {
        console.error(`currentUser invalid || currentUser inactive`);
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }
    } else if (result.staffId) {
      let currentStaff = await StaffResourceAccess.findById(result.staffId);
      // !!FEATURE 20230221 Tracking hacker IPs
      //store IP & last login
      await StaffResourceAccess.updateById(result.staffId, {
        ipAddress: clientIp,
      });

      if (currentStaff && currentStaff.active) {
        request.currentUser = currentStaff;
        resolve('ok');
      } else {
        console.error(`currentStaff invalid || currentStaff inactive`);
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }
    }
    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyTokenOrAllowEmpty(request, reply) {
  return new Promise(function (resolve) {
    if (request.headers.authorization !== undefined && request.headers.authorization.trim() !== '') {
      let result = token.decodeToken(request.headers.authorization);

      if (result === undefined || (result.appUserId && SystemStatus.all === false)) {
        reply.response(errorCodes[505]).code(505).takeover();
        return;
      }

      //append current user to request
      request.currentUser = result;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyStaffToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser || !currentUser.staffId || currentUser.staffId < 1) {
      console.error('do not have staffId or staff id is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser || !currentUser.roleId || currentUser.roleId < 1) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    const AGENT_ROLE = 5;
    if (currentUser.roleId === AGENT_ROLE) {
      //if it is agent, reject user
      reply.response(errorCodes[505]).code(505).takeover();
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyAdvanceUserToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser) {
      console.error('user data is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.appUserId || currentUser.appUserId < 1) {
      console.error('do not have appUserId or appUserId is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.appUserRoleId || currentUser.appUserRoleId < 1) {
      console.error('User have invalid role');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}
async function verifyAdminToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;

    if (!currentUser.staffId || currentUser.staffId < 1) {
      console.error('do not have staffId or staff id is invalid');
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (!currentUser.roleId || currentUser.roleId < 1) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    const AGENT_ROLE = 5;
    if (currentUser.roleId === AGENT_ROLE) {
      //if it is agent, reject user
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    if (currentUser.roleId != 1) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }
    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}
//verify token is belong to user or not
//to make sure they can not get info or update other user
async function verifyOwnerToken(request, reply) {
  return new Promise(function (resolve) {
    let currentUser = request.currentUser;
    let userId = request.payload.id;

    if (userId && currentUser.appUserId && userId !== currentUser.appUserId) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyStationToken(request, reply) {
  new Promise(function (resolve) {
    let result = token.decodeToken(request.headers.authorization);
    //append current user to request
    request.currentUser = result;

    if (request.payload.stationsId === undefined || request.payload.stationsId !== result.stationsId) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }
    if (result === undefined || (result.appUserId && SystemStatus.all === false)) {
      reply.response(errorCodes[505]).code(505).takeover();
      return;
    }

    resolve('ok');
  }).then(function () {
    reply('pre-handler done');
  });
}

async function verifyPermission(permissionList, appUserRoleId) {
  if (appUserRoleId) {
    const userRole = await AppUserRoleResourceAccess.findById(appUserRoleId);
    if (userRole) {
      const userPermissions = userRole.permissions;
      const isHavePermission = permissionList.some(permission => userPermissions.includes(permission));
      return isHavePermission;
    }
  }
  return false;
}

module.exports = {
  verifyToken,
  verifyAdvanceUserToken,
  verifyStaffToken,
  verifyOwnerToken,
  verifyStationToken,
  verifyTokenOrAllowEmpty,
  verifyAdminToken,
  verifyPermission,
};
