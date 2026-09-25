import { LampService } from "../1/lamp-service.js";

import { Mqtt as Protocol } from 'azure-iot-device-mqtt';
import { Client, DeviceMethodResponse, DeviceMethodRequest } from 'azure-iot-device';

import { env, exit } from 'node:process';
import { handleError } from "../common/util.js";

let client: Client;
let locked: boolean = false;
const lamp = new LampService('badkamer_lamp');

export function run_lamp_device(): void {
    // open a connection to the device
    const deviceConnectionString = env.IOTHUB_DEVICE_CONNECTION_STRING!;

    client = Client.fromConnectionString(deviceConnectionString, Protocol);
    client.open(onConnect);

    lamp.display();
}

function onConnect(err?: Error, _result1?: any): void {
    if (err) {
        console.error('Could not connect: ' + err.message);
    } else {
        console.log('Connected to device. Registering handlers for methods.');
    }

    client.onDeviceMethod('turnOn', (req: DeviceMethodRequest, res: DeviceMethodResponse) => {
        lamp.turnOn();
        res.send(200, handleError('turnOn'))
    })
    client.onDeviceMethod('turnOff', (req: DeviceMethodRequest, res: DeviceMethodResponse) => {
        lamp.turnOff();
        res.send(200, handleError('turnOff'))
    })
    client.onDeviceMethod('configure', (req, res) => {
        try {
            configureLamp(req.payload);
            res.send(200, handleError('configure'));
        } catch (e) {
            console.error('configure failed:', e);
            res.send(400, String(e));
        }
    });
}

function configureLamp(
    config: { 
        blinkPeriod: number,
        colour: {r: number, g: number, b: number, a: number}
    }
) {
    lamp.setKleur(config.colour);
    lamp.setPeriod(config.blinkPeriod);
}
