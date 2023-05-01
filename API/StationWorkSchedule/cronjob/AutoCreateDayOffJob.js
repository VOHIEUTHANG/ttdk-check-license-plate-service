const CreateDayOffFunction = require('./StationWorkAutoCreateDayOff');

async function autoCreateDayOff() {
  await CreateDayOffFunction.autoCreateDayOffForStation();
}

autoCreateDayOff();

module.exports = {
  autoCreateDayOff,
};
