const CustomerCheckExpireDateFunction = require('./UserVehicleCheckingExpireDate');

async function autoCheckingExpireDate() {
  await CustomerCheckExpireDateFunction.checkingUserVehicleExpireDate();
  process.exit();
}

autoCheckingExpireDate();

module.exports = {
  autoCheckingExpireDate,
};
