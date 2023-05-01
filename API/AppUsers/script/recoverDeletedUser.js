const AppUserDeletedResourceAccess = require('../resourceAccess/AppUserDeletedResourceAccess');
const AppUsersResourceAccess = require('../resourceAccess/AppUsersResourceAccess');
async function recoverAllDeletedAppUser() {
  let skip = 0;
  while (true) {
    let _userList = await AppUserDeletedResourceAccess.customSearch(
      {
        appUserRoleId: [2, 3, 4, 5, 6, 7],
      },
      skip,
      100,
    );
    if (_userList && _userList.length > 0) {
      for (let i = 0; i < _userList.length; i++) {
        delete _userList[i].appUserDeletedId;
        // await AppUsersResourceAccess.insert(_userList[i]);
        console.log(`recover ${_userList[i].username}`);
      }
      skip += 100;
    } else {
      break;
    }
  }
}
recoverAllDeletedAppUser();
