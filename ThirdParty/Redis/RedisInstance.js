/* Copyright (c) 2022 TORITI LIMITED 2022 */

const redis = require('redis');

const RedisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS,
});
const DEFAULT_EXPIRE = 300; //5 minutes
const PROJECT_NAME = process.env.PROJECT_NAME || 'PROJECTNAME';
const NODE_ENV = process.env.NODE_ENV || 'dev';

RedisClient.on('connect', function () {
  console.log(`Redis connected on ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} for project ${PROJECT_NAME} with ${NODE_ENV} environment`);
});

async function initRedis() {
  return RedisClient.connected;
}

async function setWithExpire(key, value, expire = DEFAULT_EXPIRE) {
  return new Promise((resolve, reject) => {
    if (!RedisClient.connected) {
      resolve(null);
    }

    let redisKey = PROJECT_NAME + '_' + NODE_ENV + '_' + key;
    RedisClient.set(redisKey, value, 'EX', expire, (err, reply) => {
      if (err) {
        console.log(err.toString());
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

async function setNoExpire(key, value) {
  return new Promise((resolve, reject) => {
    if (!RedisClient.connected) {
      resolve(null);
    }
    let redisKey = PROJECT_NAME + '_' + NODE_ENV + '_' + key;
    RedisClient.set(redisKey, value, (err, reply) => {
      if (err) {
        console.log(err.toString());
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

async function increment(key) {
  return new Promise((resolve, reject) => {
    if (!RedisClient.connected) {
      resolve(null);
    }
    let redisKey = PROJECT_NAME + '_' + NODE_ENV + '_' + key;
    RedisClient.incr(redisKey, (err, reply) => {
      if (err) {
        console.log(err.toString());
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

async function decrement(key) {
  return new Promise((resolve, reject) => {
    if (!RedisClient.connected) {
      resolve(null);
    }
    let redisKey = PROJECT_NAME + '_' + NODE_ENV + '_' + key;
    RedisClient.decr(redisKey, (err, reply) => {
      if (err) {
        console.log(err.toString());
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

async function get(key) {
  return new Promise((resolve, reject) => {
    if (!RedisClient.connected) {
      resolve(null);
    }
    let redisKey = PROJECT_NAME + '_' + NODE_ENV + '_' + key;
    RedisClient.get(redisKey, (err, reply) => {
      if (err) {
        console.log(err.toString());
        reject('');
      } else {
        resolve(reply);
      }
    });
  });
}

async function getJson(key) {
  let value = await get(key);
  if (value === '' || value === null) {
    return undefined;
  } else {
    return JSON.parse(value);
  }
}

deleteAllKeys();
async function deleteAllKeys() {
  console.log('Delete all redis key');
  RedisClient.keys('*', function (err, rows) {
    rows.forEach(row => {
      RedisClient.del(row);
    });
  });
}

async function deleteKey(key) {
  RedisClient.keys(key, function (err, rows) {
    rows.forEach(row => {
      RedisClient.del(row);
    });
  });
}
module.exports = {
  initRedis,
  getJson,
  get,
  deleteKey,
  increment,
  decrement,
  setNoExpire,
  setWithExpire,
  deleteAllKeys,
};
