const StationMetadata = require('./StationMetadataRoute');

module.exports = [
  { method: 'POST', path: '/StationMetadata/insert', config: StationMetadata.insert },
  { method: 'POST', path: '/StationMetadata/find', config: StationMetadata.find },
  { method: 'POST', path: '/StationMetadata/findById', config: StationMetadata.findById },
  { method: 'POST', path: '/StationMetadata/findByStationsId', config: StationMetadata.findByStationId },
  { method: 'POST', path: '/StationMetadata/updateById', config: StationMetadata.updateById },
  { method: 'POST', path: '/StationMetadata/deleteById', config: StationMetadata.deleteById },
];
