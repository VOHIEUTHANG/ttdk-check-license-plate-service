/* Copyright (c) 2022 TORITI LIMITED 2022 */

require('dotenv').config();

const MQTT_ADMIN_USERNAME = process.env.MQTT_ADMIN_USERNAME || 'mqttadmin';
const MQTT_ADMIN_PASSWORD = process.env.MQTT_ADMIN_PASSWORD || 'mqttadminpass';

const MQTT_PORT = parseInt(process.env.MQTT_PORT || 5555);
const WEBSOCKET_SSL_PORT = parseInt(process.env.WEBSOCKET_SSL_PORT || 6666);
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || 7777);

const ws = require('websocket-stream');
const fs = require('fs');
const aedes = require('aedes')();
// const aedes = require('aedes')({
//   authenticate: (client, username, password, callback) => {

//   },
//   authorizePublish: (client, packet, callback) => {

//   },

//   authorizeSubscribe: (client, packet, callback) => {

//   }
// });

//MQTT Broker
const mqttBroker = require('net').createServer(aedes.handle);
mqttBroker.listen(MQTT_PORT, function () {
  console.log('mqtt broker started and listening on port ', MQTT_PORT);
});

//Websocket 'WS'
const httpServer = require('http').createServer();
ws.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(WEBSOCKET_PORT, function () {
  console.log('Aedes MQTT-WS listening on port: ' + WEBSOCKET_PORT);
});

async function initHttpsServer() {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(`${process.env.KEY_PATH}openssl/privkey.pem`, (err, keyData) => {
        if (err) {
          console.error(err);
          resolve(undefined);
          return;
        }
        fs.readFile(`${process.env.KEY_PATH}openssl/fullchain.pem`, (err, certData) => {
          if (err) {
            console.error(err);
            resolve(undefined);
            return;
          }
          //Websocket SSL 'WSS'
          const httpsServer = require('https').createServer({
            key: keyData,
            cert: certData,
          });
          ws.createServer({ server: httpsServer }, aedes.handle);
          httpsServer.listen(WEBSOCKET_SSL_PORT, function () {
            console.log('Aedes MQTT-WSS listening on port: ' + WEBSOCKET_SSL_PORT);
            resolve('ok');
          });
        });
      });

      // //Websocket SSL 'WSS'
      // const httpsServer = require('https').createServer({
      //   "key": fs.readFileSync(`${process.env.KEY_PATH}openssl1/privkey.pem`),
      //   "cert": fs.readFileSync(`${process.env.KEY_PATH}openssl1/fullchain.pem`),
      // });
      // ws.createServer({ server: httpsServer }, aedes.handle)
      // httpsServer.listen(WEBSOCKET_SSL_PORT, function () {
      //   console.log('Aedes MQTT-WSS listening on port: ' + WEBSOCKET_SSL_PORT)
      // });
    } catch (error) {
      console.error(error);
      return undefined;
    }
  });
}

var refreshIntervalId = setInterval(() => {
  initHttpsServer().then(result => {
    console.log(result);
    if (result) {
      clearInterval(refreshIntervalId);
    }
  });
}, 10000);

aedes.on('clientReady', function (client) {
  console.log('[MQTT] client connected ' + client.id);
});
aedes.on('clientDisconnect', function (client) {
  console.log('[MQTT] client disconnected ' + client.id);
});
aedes.on('subscribe', function (subscriptions) {
  console.log('[MQTT] client subscribe ' + JSON.stringify(subscriptions));
});

// fired when a message is received
aedes.on('published', function (packet, client) {
  console.log(`[MQTT] published ${JSON.stringify(packet)}`);
});

// server.on('ready', () => {
//   console.log('✓'.green + ' Mqtt server is running on port: '.cyan + `${MQTT_PORT}`.green);
//   console.log('✓'.green + ' Mqtt over websocket is on port: '.cyan + `${MQTT_WS_PORT}`.green);

//   server.authenticate = (client, username, password, callback) => {
//     console.log(username, password);
//     var authorized = username === MQTT_ADMIN_USERNAME && password.toString() === MQTT_ADMIN_PASSWORD;
//     if (authorized) client.user = username;
//     callback(null, authorized);
//   };

//   const message = {
//     topic: 'SERVER',
//     payload: `Mqtt Server over websocket started at ${new Date()}`,
//     qos: 2,
//     retain: true,
//   };
//   publish(message);
// });

const _publish = message =>
  new Promise((resolve, reject) => {
    message = Object.assign({ qos: 2, retain: false }, message);
    // console.log({ publish: message });
    aedes.publish(message, (obj, packet) => {
      // resolve(packet);
      resolve(message.topic);
    });
  });

async function publishJson(topic, json) {
  console.log('publishJson');
  const payload = Object.assign({ _id: new Date().toISOString() }, json);
  const message = {
    topic,
    payload: JSON.stringify(payload),
    qos: 2,
    retain: false,
  };
  return _publish(message);
}

async function publishMessage(topic, message) {
  const packetData = {
    topic,
    payload: message,
    qos: 2,
    retain: false,
  };
  return _publish(packetData);
}

module.exports = {
  publishMessage,
  publishJson,
};
