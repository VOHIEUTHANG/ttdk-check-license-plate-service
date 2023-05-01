const StationNewsCategory = require('./StationNewsCategoryRoute');

module.exports = [
  { method: 'POST', path: '/StationNewsCategory/insert', config: StationNewsCategory.insert },
  { method: 'POST', path: '/StationNewsCategory/find', config: StationNewsCategory.find },
  { method: 'POST', path: '/StationNewsCategory/findById', config: StationNewsCategory.findById },
  { method: 'POST', path: '/StationNewsCategory/updateById', config: StationNewsCategory.updateById },
  { method: 'POST', path: '/StationNewsCategory/deleteById', config: StationNewsCategory.deleteById },
  { method: 'POST', path: '/StationNewsCategory/user/getList', config: StationNewsCategory.userGetCategoryList },

  { method: 'POST', path: '/StationNewsCategory/advanceUser/getList', config: StationNewsCategory.advanceUserGetListCategory },
];
