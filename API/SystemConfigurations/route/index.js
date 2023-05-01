const SystemConfigurations = require('./SystemConfigurationsRoute');

module.exports = [
  { method: 'POST', path: '/SystemConfigurations/updateById', config: SystemConfigurations.updateById },
  { method: 'POST', path: '/SystemConfigurations/findById', config: SystemConfigurations.findById },
];
