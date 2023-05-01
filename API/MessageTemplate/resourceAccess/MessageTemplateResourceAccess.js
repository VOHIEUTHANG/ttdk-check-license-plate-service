/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'MessageTemplate';
const primaryKeyField = 'messageTemplateId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('messageTemplateName', 500);
          table.string('messageTemplateContent', 500);
          table.string('messageTemplateScope');
          table.integer('messageZNSTemplateId');
          table.integer('stationsId');
          timestamps(table);
          table.index(primaryKeyField);
          table.index('stationsId');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(() => {
            resolve();
          });
        });
    });
  });
}

async function seeding() {
  const seedData = [
    // {
    //   messageTemplateId: 1,
    //   messageTemplateContent: "{{stationsBrandname}} mời bạn đăng ký đăng kiểm tại {{stationsAddress}} cho ô tô BKS số {{customerRecordPlatenumber}}",
    //   messageTemplateName: "CSKH",
    //   messageTemplateScope: ['CustomerRecord'],
    //   messageZNSTemplateId: null, //chua dang ky
    // },
    {
      messageTemplateId: 1,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 1',
      messageTemplateContent:
        '{{stationsBrandname}} {{stationsAddress}} kinh bao: Xe {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach can ho tro vui long lien he {{stationsHotline}}',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 227966,
    },
    // {
    //   messageTemplateId: 2,
    //   messageTemplateName: "Nhắc đăng kiểm mẫu 2",
    //   messageTemplateContent: "{{stationsBrandname}} {{stationsAddress}} t/t thong bao: oto bien so {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Lien he dat lich kiem dinh tai {{stationUrl}}. T/t cam on",
    //   messageTemplateScope: ['CustomerRecord'],
    //   messageZNSTemplateId: 227967,
    // },
    // {
    //   messageTemplateId: 4,
    //   messageTemplateName: "Nhắc đăng kiểm mẫu 3",
    //   messageTemplateContent: "{{stationsBrandname}} {{stationsAddress}} Thong bao: Xe {{customerRecordPlatenumber}} het han dang kiem ngay {{customerRecordCheckExpiredDate}}. Rat han hanh duoc phuc vu. LH: {{stationsHotline}}",
    //   messageTemplateScope: ['CustomerRecord'],
    //   messageZNSTemplateId: 227928
    // },
    // {
    //   messageTemplateId: 5,
    //   messageTemplateName: "Nhắc đăng kiểm mẫu 4",
    //   messageTemplateContent: "Xe {{customerRecordPlatenumber}} het han dang kiem ngay {{customerRecordCheckExpiredDate}}. Chung toi thong bao den quy khach kiem dinh dung thoi han. {{stationsBrandname}} {{stationsAddress}} han hanh duoc phuc vu. LH: {{stationsHotline}}",
    //   messageTemplateScope: ['CustomerRecord'],
    //   messageZNSTemplateId: null, //chua dang ky
    // },
    {
      messageTemplateId: 2,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 2',
      messageTemplateContent:
        'TT Dang kiem 29-02V Phu Thi-Gia Lam-HN kinh bao: Xe {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach can ho tro vui long lien he 0888939836/0936310333',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 227967,
      stationsId: 290,
    },
    {
      messageTemplateId: 3,
      messageTemplateName: 'Nhắc đăng kiểm mẫu 2',
      messageTemplateContent:
        'TTDK Cau Giay t/t thong bao: oto bien so {{customerRecordPlatenumber}} het han kiem dinh ngay {{customerRecordCheckExpiredDate}}. Quy khach co the lien he dat lich kiem chuan tai ttdk2903v.com. T/t cam on.',
      messageTemplateScope: ['CustomerRecord'],
      messageZNSTemplateId: 227967,
      stationsId: 162,
    },
  ];
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(seedData)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
      });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('messageTemplateName', 'like', `%${searchText}%`)
        .orWhere('messageTemplateContent', 'like', `%${searchText}%`)
        .orWhere('messageTemplateScope', 'like', `%${searchText}%`);
    });
  } else {
    if (filterData.messageTemplateName) {
      queryBuilder.where('messageTemplateName', 'like', `%${searchText}%`);
      delete filterData.messageTemplateName;
    }

    if (filterData.messageTemplateContent) {
      queryBuilder.where('messageTemplateContent', 'like', `%${searchText}%`);
      delete filterData.messageTemplateContent;
    }

    if (filterData.messageTemplateScope) {
      queryBuilder.where('messageTemplateScope', 'like', `%${searchText}%`);
      delete filterData.messageTemplateScope;
    }
  }
  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, order);
  return await query.select();
}

async function customCount(filter, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  updateAll,
};
