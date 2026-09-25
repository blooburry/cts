/* eslint-disable security/detect-non-literal-fs-filename */
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Choose a protocol by uncommenting one of these transports.
import { Mqtt as Protocol } from 'azure-iot-device-mqtt';
// import { Amqp as Protocol } from 'azure-iot-device-amqp';
// import { Http as Protocol } from 'azure-iot-device-Http';
// import { MqttWs as Protocol } from 'azure-iot-device-mqtt';
// import { AmqpWs as Protocol } from 'azure-iot-device-amqp';

import { Client, DeviceMethodResponse, DeviceMethodRequest } from 'azure-iot-device';

import { env, exit } from 'node:process';
import { handleError } from '../common/util.js';

let client: Client;
let locked: boolean = false;

export function run_door(): void {
  // open a connection to the device
  const deviceConnectionString = env.IOTHUB_DEVICE_CONNECTION_STRING || '';

  if (deviceConnectionString === '') {
    console.log('device connection string has not been set');
    exit(-1);
  }

  client = Client.fromConnectionString(deviceConnectionString, Protocol);
  client.open(onConnect);
}

function onConnect(err?: Error, _result1?: any): void {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Connected to device. Registering handlers for methods.');

    // register handlers for all the method names we are interested in
    client.onDeviceMethod('getDeviceLog', onGetDeviceLog);
    client.onDeviceMethod('lockDoor', onLockDoor);
    client.onDeviceMethod('locked', isDoorLocked);
  }
}

function onGetDeviceLog(request: DeviceMethodRequest, response: DeviceMethodResponse): void {
  printDeviceMethodRequest(request);

  // Implement actual logic here.

  // complete the response
  response.send(200, 'example payload', function (err: Error | undefined): void {
    if (err) {
      console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
      console.log('Response to method "%s" sent successfully.', request.methodName);
    }
  });
}

function isDoorLocked(request: DeviceMethodRequest, response: DeviceMethodResponse): void {
  printDeviceMethodRequest(request);

  response.send(200, {"locked": locked}, handleError(request.methodName));
}

function onLockDoor(request: DeviceMethodRequest, response: DeviceMethodResponse): void {
  printDeviceMethodRequest(request);

  var prevState = locked;
  switch(request.payload.action!) {
    case "lockDoor":
      locked = true;
        response.send(200, {"stateChanged": prevState != locked}, handleError(request.methodName));
      break;
    case "unlockDoor":
      locked = false;
      response.send(200, {"stateChanged": prevState != locked}, handleError(request.methodName));
      break;
  }
}



function printDeviceMethodRequest(request: DeviceMethodRequest): void {
  // print method name
  console.log('Received method call for method "%s"', request.methodName);

  // if there's a payload just do a default console log on it
  if (request.payload) {
    console.log('Payload:\n' + request.payload);
  }
}
