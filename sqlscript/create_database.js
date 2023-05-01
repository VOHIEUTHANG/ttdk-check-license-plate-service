/* Copyright (c) 2022-2023 TORITI LIMITED 2022 */

const Staff = require('../API/Staff/resourceAccess/StaffResourceAccess');
const AppUsers = require('../API/AppUsers/resourceAccess/AppUsersResourceAccess');
const AppUserRole = require('../API/AppUserRole/resourceAccess/AppUserRoleResourceAccess');

const AppUserPermission = require('../API/AppUserPermission/resourceAccess/AppUserPermissionResourceAccess');
const CustomerSchedule = require('../API/CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const CustomerRecord = require('../API/CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const CustomerCriminalRecord = require('../API/CustomerCriminalRecord/resourceAccess/CustomerCriminalRecordResourceAccess');
const Stations = require('../API/Stations/resourceAccess/StationsResourceAccess');
const SystemAppLog = require('../API/SystemAppChangedLog/resourceAccess/SystemAppChangedLogResourceAccess');
const StationNew = require('../API/StationNews/resourceAccess/StationNewsResourceAccess');

const StationNewsCategory = require('../API/StationNewsCategory/resourceAccess/StationNewsCategoryResourceAccess');
const StationIntro = require('../API/StationIntroduction/resourceAccess/StationIntroductionResourceAccess');
const UploadResource = require('../API/Upload/resourceAccess/UploadResourceAccess');
const CustomerMessage = require('../API/CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
const MessageCustomer = require('../API/CustomerMessage/resourceAccess/MessageCustomerResourceAccess');
const AppDevices = require('../API/AppDevices/resourceAccess/AppDevicesResourceAccess');

const SystemConfigResource = require('../API/SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
const MessageTemplate = require('../API/MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const StationMetadata = require('../API/StationMetadata/resourceAccess/StationMetadataResourceAccess');
const CustomerReceiptResourceAccess = require('../API/CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');
const PaymentQRResourceAccess = require('../API/PaymentQR/resourceAccess/PaymentQRResourceAccess');
const StationVNPayResourceAccess = require('../API/StationVNPay/resourceAccess/StationVNPayResourceAccess');
const AppUserChatLogResourceAccess = require('../API/AppUserConversation/resourceAccess/AppUserChatLogResourceAccess');
const AppUserConversationResourceAccess = require('../API/AppUserConversation/resourceAccess/AppUserConversationResourceAccess');
const StationDevicesResourceAccess = require('../API/StationDevices/resourceAccess/StationDevicesResourceAccess');
const StationDevicesView = require('../API/StationDevices/resourceAccess/StationDevicesView');
const AppUserVehicleExpiredResourceAccess = require('../API/AppUserVehicleExpired/resourceAccess/AppUserVehicleExpiredResourceAccess');
const CustomerScheduleAttachmentResourceAccess = require('../API/CustomerScheduleAttachment/resourceAccess/CustomerScheduleAttachmentResourceAccess');
const CustomerScheduleChangeResourceAccess = require('../API/CustomerSchedule/resourceAccess/CustomerScheduleChangeResourceAccess');

const CustomerScheduleTrackingResourceAccess = require('../API/CustomerSchedule/resourceAccess/CustomerScheduleTrackingResourceAccess');
const SystemAppLogChangeScheduleResourceAccess = require('../API/SystemAppLogChangeSchedule/resourceAccess/SystemAppLogChangeScheduleResourceAccess');
const SystemAppLogChangeAppUserResourceAccess = require('../API/SystemAppLogChangeAppUser/resourceAccess/SystemAppLogChangeAppUserResourceAccess');
const SystemAppLogChangeVehicleResourceAccess = require('../API/SystemAppLogChangeVehicle/resourceAccess/SystemAppLogChangeVehicleResourceAccess');
const SystemAppLogChangeStationResourceAccess = require('../API/SystemAppLogChangeStation/resourceAccess/SystemAppLogChangeStationResourceAccess');
const AppUserLoginHistoryResourceAccess = require('../API/AppUsers/resourceAccess/AppUserLoginHistoryResourceAccess');

async function createDatabase() {
  //can than khi su dung cho production
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // //create tables
  // await AppUsers.initDB();
  // await require('../API/AppUserWorkInfo/resourceAccess/AppUserWorkInfoResourceAccess').initDB();
  // await CustomerRecord.initDB();
  // await require('../API/Permission/resourceAccess/PermissionResourceAccess').initDB();
  // await require('../API/Role/resourceAccess/RoleResourceAccess').initDB();
  // await Staff.initDB();
  // await CustomerSchedule.initDB();
  // await require('../API/CustomerSchedule/resourceAccess/CustomerScheduleView').initViews();
  // await require('../API/StationWorkSchedule/resourceAccess/StationsWorkScheduleResourceAccess').initDB();

  // await Stations.initDB();
  // await StationNew.initDB();
  // await StationNewsCategory.initDB();
  // await require('../API/StationDocument/resourceAccess/StationDocumentFileResourceAccess').initDB();
  // await require('../API/StationDocument/resourceAccess/StationDocumentReadingResourceAccess').initDB();
  // await require('../API/StationDocument/resourceAccess/StationDocumentResourceAccess').initDB();
  // await require('../API/StationReport/resourceAccess/StationReportResourceAccess').initDB();
  // await SystemAppLog.initDB();
  // await UploadResource.initDB();
  // await AppDevices.initDB();
  // await StationIntro.initDB();
  // await SystemConfigResource.initDB();
  // await AppUserPermission.initDB();
  // await AppUserRole.initDB();
  // await CustomerCriminalRecord.initDB();
  // await MessageTemplate.initDB();
  //we use 1 table to store content of message & 1 table to store need-to-send customer
  // await CustomerMessage.initDB();
  // await MessageCustomer.initDB();

  // await require('../API/AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess').initDB();
  await require('../API/AppUserVehicle/resourceAccess/AppUserVehicleView').initViews();
  // await require('../API/CustomerReview/resourceAccess/CustomerReviewResourceAccess').initDB();

  // await require('../API/SMSMessage/resourceAccess/SMSMessageResourceAccess').initDB();
  // //create views
  await require('../API/Staff/resourceAccess/RoleStaffView').initViews();
  await require('../API/CustomerMessage/resourceAccess/MessageCustomerView').initViews();
  await require('../API/AppDevices/resourceAccess/AppDevicesView').initViews();

  await require('../API/StationNews/resourceAccess/StationNewsCategoryViews').initViews();
  await require('../API/MessageTemplate/resourceAccess/MessageTemplateView').initViews();
  // await CustomerReceiptResourceAccess.initDB();
  // await PaymentQRResourceAccess.initDB();
  // await StationVNPayResourceAccess.initDB();
  // await AppUserConversationResourceAccess.initDB();
  // await AppUserChatLogResourceAccess.initDB();
  await require('../API/AppUserConversation/resourceAccess/AppUserConversationResourceView').initViews();
  await require('../API/AppUsers/resourceAccess/RoleUserView').initViews();
  // await require('../API/AppUserDevices/resourceAccess/AppUserDevicesResourceAccess').initDB();
  // await require('../API/StaffNotification/resourceAccess/StaffNotificationResourceAccess').initDB();
  // await require('../API/AppUsers/resourceAccess/AppUserDeletedResourceAccess').initDB();
  // await require('../API/CustomerRecord/resourceAccess/CustomerRecordDeletedResourceAccess').initDB();

  // await require('../API/OTPMessage/resourceAccess/OTPMessageResourceAccess').initDB();
  // await require('../API/CustomerReceipt/resourceAccess/CustomerReceiptView').initViews();
  // await require('../API/AppUserVehicle/resourceAccess/AppUserVehicleDeletedResourceAccess').initDB();
  // await AppUserVehicleExpiredResourceAccess.initDB();
  // await require('../API/CustomerMessage/resourceAccess/MessageCustomerDeletedResourceAccess').initDB();
  // await CustomerScheduleAttachmentResourceAccess.initDB();
  // await CustomerScheduleChangeResourceAccess.initDB();
  // await SystemAppLogChangeScheduleResourceAccess.initDB();
  // await AppUserLoginHistoryResourceAccess.initDB();
  // await CustomerScheduleTrackingResourceAccess.initDB();
  // await SystemAppLogChangeScheduleResourceAccess.initDB();
  // await SystemAppLogChangeAppUserResourceAccess.initDB();
  // await SystemAppLogChangeVehicleResourceAccess.initDB();
  // await SystemAppLogChangeStationResourceAccess.initDB();
  // await CustomerScheduleChangeResourceAccess.initDB();

  // await require('../API/CustomerScheduleAttachment/resourceAccess/CustomerScheduleAttachmentResourceAccess').initDB();
  // await require('../API/AppUsers/resourceAccess/AppUserLoginHistoryResourceAccess').initDB();
  // await require('../API/CustomerSchedule/resourceAccess/CustomerScheduleTrackingResourceAccess').initDB();
  // await require('../API/SystemAppLogChangeSchedule/resourceAccess/SystemAppLogChangeScheduleResourceAccess').initDB();
  // await require('../API/CustomerSchedule/resourceAccess/CustomerScheduleChangeResourceAccess').initDB();

}

createDatabase().then(() => {
  // process.exit(0);
});
