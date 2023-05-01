/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Staff = require('../API/Staff/route/StaffRoute');
const Role = require('../API/Role/route/RoleRoute');
const Permission = require('../API/Permission/route/PermissionRoute');
const AppUserRole = require('../API/AppUserRole/route/AppUserRoleRoute');
const AppUserPermission = require('../API/AppUserPermission/route/AppUserPermissionRoute');
const Maintain = require('../API/Maintain/route/MaintainRoute');
const SystemConfig = require('../API/SystemConfigurations/route/SystemConfigurationsRoute');
const CustomerSchedule = require('../API/CustomerSchedule/route/CustomerScheduleRoute');
const CustomerMessage = require('../API/CustomerMessage/route/CustomerMessageRoute');
const StationIntro = require('../API/StationIntroduction/route/StationIntroductionRoute');
const StationNews = require('../API/StationNews/route/StationNewsRoute');
const StationNewsCategory = require('../API/StationNewsCategory/route/StationNewsCategoryRoute');
const CustomerStatistical = require('../API/CustomerStatistical/route/CustomerStatisticalRoute');
const AppDevices = require('../API/AppDevices/route/AppDevicesRoute');
const CustomerCriminalRecord = require('../API/CustomerCriminalRecord/route/CustomerCriminalRecordRoute');
const MessageTemplate = require('../API/MessageTemplate/route/MessageTemplateRoute');
const StationMetadata = require('../API/StationMetadata/route/StationMetadataRoute');
const CustomerReceiptRoute = require('../API/CustomerReceipt/route/CustomerReceiptRoute');
const PaymentGateway = require('../API/PaymentGateway/route/PaymentGatewayRoute');
const PaymentQR = require('../API/PaymentQR/route/PaymentQRRoute');
const StationVNPayRoute = require('../API/StationVNPay/route/StationVNPayRoute');
const { reportToTelegram } = require('../ThirdParty/TelegramBot/TelegramBotFunctions');

let APIs = [
  //FEATURE 2023020601 Improve Security of APIs
  {
    method: 'GET',
    path: '/HealthCheck',
    handler: function (request, reply) {
      return reply(`Hi`).code(200);
    },
  },
  //FEATURE 2023020601 Improve Security of APIs
  {
    method: 'GET',
    path: '/{path*}',
    handler: function (request, reply) {
      if (request.url.path.indexOf('uploads/') >= 0) {
        return reply.file(`${request.params.path}`);
      } else {
        // !!FEATURE 20230221 Tracking hacker IPs
        //store IP & last login
        const requestIp = require('request-ip');
        const clientIp = requestIp.getClientIp(request);
        console.info(
          `SECURITY LEAKS!! Some one from ${clientIp} is trying to discover project ${process.env.PROJECT_NAME} using ${request.url.path}`,
        );
        reportToTelegram(`SECURITY LEAKS !! Some one is trying to discover project using ${request.url.path}`);
        return reply.redirect(`https://google.com`);
      }
    },
  },
];

APIs = APIs.concat(require('../API/AppUserConversation/route'));
APIs = APIs.concat(require('../API/AppDevices/route'));
APIs = APIs.concat(require('../API/AppUserDevices/route'));
APIs = APIs.concat(require('../API/AppUserPermission/route'));
APIs = APIs.concat(require('../API/AppUserRole/route'));
APIs = APIs.concat(require('../API/AppUsers/route'));
APIs = APIs.concat(require('../API/AppUserWorkInfo/route'));
APIs = APIs.concat(require('../API/AppUserVehicle/route'));
APIs = APIs.concat(require('../API/CustomerCriminalRecord/route'));
APIs = APIs.concat(require('../API/CustomerMessage/route'));
APIs = APIs.concat(require('../API/CustomerReceipt/route'));
APIs = APIs.concat(require('../API/CustomerRecord/route'));
APIs = APIs.concat(require('../API/CustomerReview/route'));
APIs = APIs.concat(require('../API/CustomerSchedule/route'));
APIs = APIs.concat(require('../API/CustomerStatistical/route'));
APIs = APIs.concat(require('../API/MessageTemplate/route'));
APIs = APIs.concat(require('../API/OTPMessage/router'));
APIs = APIs.concat(require('../API/PaymentGateway/route'));
APIs = APIs.concat(require('../API/PaymentQR/route'));
APIs = APIs.concat(require('../API/Permission/route'));
APIs = APIs.concat(require('../API/Role/route'));
APIs = APIs.concat(require('../API/SMSMessage/route'));
APIs = APIs.concat(require('../API/Staff/route'));
APIs = APIs.concat(require('../API/StationDocument/route'));
APIs = APIs.concat(require('../API/StationIntroduction/route'));
APIs = APIs.concat(require('../API/StationMetadata/route'));
APIs = APIs.concat(require('../API/StationNews/route'));
APIs = APIs.concat(require('../API/StationNewsCategory/route'));
APIs = APIs.concat(require('../API/StationReport/route'));
APIs = APIs.concat(require('../API/Stations/route'));
APIs = APIs.concat(require('../API/StationVNPay/route'));
APIs = APIs.concat(require('../API/StationWorkSchedule/route'));
APIs = APIs.concat(require('../API/SystemConfigurations/route'));
APIs = APIs.concat(require('../API/Upload/route'));
APIs = APIs.concat(require('../API/StaffNotification/route'));
APIs = APIs.concat(require('../API/StationDevices/route'));
APIs = APIs.concat(require('../API/AppUserVehicleExpired/route'));
APIs = APIs.concat(require('../API/SystemAppLogChangeSchedule/route'));

module.exports = APIs;
