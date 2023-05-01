/* Copyright (c) 2022 TORITI LIMITED 2022 */

const fs = require('fs');
var mqtt = require('mqtt');
////MQTT Client
// var client  = mqtt.connect('mqtt://localhost:5555')

////WS Client
var client = mqtt.connect('ws://localhost:7777', {
  wsOptions: {
    host: 'localhost',
    port: 7777,
  },
});

//WSS Client
// var client  = mqtt.connect('wss://vtss-station-server.makefamousapp.com:10666', {
//   rejectUnauthorized: false
// })

client.on('connect', function () {
  console.log('connected');
  client.subscribe('RECORD_DELETE_1', function (err) {
    console.log('Subcribed success');
  });
});

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  console.log(topic);
  client.end();
});

module.exports = {};
