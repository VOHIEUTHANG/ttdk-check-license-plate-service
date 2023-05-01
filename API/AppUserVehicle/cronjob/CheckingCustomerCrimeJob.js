const CustomerCheckCrimeFunction = require('./AppUserVehicleCheckingCrime');

async function autoCheckingCrime() {
  await CustomerCheckCrimeFunction.checkingCustomerViolations();
  process.exit();
}

autoCheckingCrime();

module.exports = {
  autoCheckingCrime,
};
