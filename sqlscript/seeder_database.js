/* Copyright (c) 2022 TORITI LIMITED 2022 */

const { _getDefaultBookingConfig } = require('../API/Stations/resourceAccess/StationsResourceAccess');
const StationsResourceAccess = require('../API/Stations/resourceAccess/StationsResourceAccess');
const { STATION_TYPE, STATION_STATUS } = require('../API/Stations/StationsConstants');
async function _seedStationsLocal() {
  const { EXTERNAL_STATIONS } = require('../API/Stations/data/ExternalStations');

  const stationList = EXTERNAL_STATIONS;

  stationList.forEach((station, id) => {
    if (!station.stationCode) {
      station.stationCode = _generateStationCode(id + 1);
    }
  });

  for (let i = 0; i < stationList.length; i++) {
    const _station = stationList[i];
    let _existingStation = await StationsResourceAccess.find({
      stationCode: _station.stationCode,
    });
    if (_existingStation && _existingStation.length > 0) {
      console.info(`skip station ${_station.stationCode}`);
      continue;
    }
    await StationsResourceAccess.insert({
      stationsName: _station.stationsName,
      stationCode: _station.stationCode,
      stationsAddress: _station.stationsAddress,
      stationsHotline: _station.stationsHotline,
      // stationsFax: '0206.3888929',
      stationsEmail: _station.stationsEmail,
      stationsManager: _station.stationsManagerName,
      // stationsManagerPhone: _station.stationsManagerPhone,
      stationType: STATION_TYPE.EXTERNAL,
      stationMapSource: _station.stationMapSource,
    });
  }
}

async function _seedStations() {
  const { EXTERNAL_STATIONS } = require('../API/Stations/data/ExternalStations');
  const StationsManager = require('../API/Stations/manager/StationsManager');

  const stationList = EXTERNAL_STATIONS;

  stationList.forEach((station, id) => {
    if (!station.stationCode) {
      station.stationCode = _generateStationCode(id + 1);
    }
  });

  for (let i = 0; i < stationList.length; i++) {
    const _station = stationList[i];
    let _existingStation = await StationsResourceAccess.find({
      stationCode: _station.stationCode,
    });
    if (_existingStation && _existingStation.length > 0) {
      console.info(`update station ${_station.stationCode}`);
      let _updateDate = {
        stationArea: _station.stationArea,
      };
      if (_existingStation[0].stationBookingConfig) {
        _existingStation[0].stationBookingConfig = JSON.parse(_existingStation[0].stationBookingConfig);
        let _totalSmallCar = 0;
        let _totalOtherVehicle = 0;
        for (let i = 0; i < _existingStation[0].stationBookingConfig.length; i++) {
          _existingStation[0].stationBookingConfig[i].limitOtherVehicle = _existingStation[0].stationBookingConfig[i].limitSmallCar * 1;
          _totalSmallCar += _existingStation[0].stationBookingConfig[i].limitSmallCar * 1;
          _totalOtherVehicle += _existingStation[0].stationBookingConfig[i].limitOtherVehicle * 1;
          _totalOtherVehicle += _existingStation[0].stationBookingConfig[i].limitRoMooc * 1;
        }
        _updateDate.stationBookingConfig = JSON.stringify(_existingStation[0].stationBookingConfig);
        _updateDate.totalSmallCar = _totalSmallCar;
        _updateDate.totalOtherVehicle = _totalOtherVehicle;
        _updateDate.totalRoMooc = _totalOtherVehicle;
      }
      _updateDate.stationStatus = STATION_STATUS.ACTIVE;

      await StationsResourceAccess.updateById(_existingStation[0].stationsId, _updateDate);
      continue;
    }

    let _enableListStation = '2902V,2903V,2904V,2905V,2930D,5004V,5005V,1501V,1502S,2201S,4301S,4302S,9901S,6001S,6101S';
    let _newStationData = {
      stationsName: _station.stationsName,
      stationCode: _station.stationCode,
      stationsAddress: _station.stationsAddress,
      stationsHotline: _station.stationsHotline,
      // stationsFax: '0206.3888929',
      stationsEmail: _station.stationsEmail,
      stationsManager: _station.stationsManagerName,
      // stationsManagerPhone: _station.stationsManagerPhone,
      stationType: STATION_TYPE.EXTERNAL,
      stationMapSource: _station.stationMapSource,
      stationBookingConfig: _getDefaultBookingConfig(),
      stationArea: _station.stationArea,
    };
    if (_enableListStation.indexOf(_station.stationCode) >= 0) {
      _newStationData.stationStatus = STATION_STATUS.ACTIVE;
    } else {
      _newStationData.stationStatus = STATION_STATUS.BLOCK;
    }
    await StationsManager.insert({
      payload: {
        ..._newStationData,
      },
    });
  }
}
async function seedDatabase() {
  console.log('seedDatabase');
  await _seedStations();
  console.log('seeding done');
}

seedDatabase();
