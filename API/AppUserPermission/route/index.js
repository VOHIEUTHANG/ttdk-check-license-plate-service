const AppUserPermission = require('./AppUserPermissionRoute');

module.exports = [{ method: 'POST', path: '/AppUserPermission/find', config: AppUserPermission.find }];
