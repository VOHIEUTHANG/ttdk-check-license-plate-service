/* Copyright (c) 2022 TORITI LIMITED 2022 */

'use strict';

/* eslint-disable no-unused-vars */

const Schwifty = require('schwifty');

module.exports = class Model extends Schwifty.Model {
  static get tableName() {
    return '';
  }

  static createNotFoundError(ctx) {
    const error = super.createNotFoundError(ctx);

    return Object.assign(error, {
      modelName: this.name,
    });
  }

  static field(name) {
    return this.getJoiSchema().extract(name).optional().prefs({ noDefaults: true });
  }

  $beforeInsert(ctx) {
    const now = new Date();

    this.createdAt = now;
    this.updatedAt = now;
  }

  $beforeUpdate(opt, ctx) {
    this.updatedAt = new Date();
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    if (json.createdAt) {
      json.createdAt = new Date(json.createdAt);
    }

    if (json.updatedAt) {
      json.updatedAt = new Date(json.updatedAt);
    }

    return json;
  }
};
