import { Lamp } from "../1/lamp.js";

import { Mqtt as Protocol } from "azure-iot-device-mqtt";
import {
  Client,
  DeviceMethodResponse,
  DeviceMethodRequest,
} from "azure-iot-device";

import { env, exit } from "node:process";
import { handleDirectMethodError } from "../common/util.js";

export class LampIOTDevice {
    private client: Client;
    lamp: Lamp;
    
    public constructor(lamp: Lamp) {
        this.lamp = lamp;
        // open a connection to the device
        const deviceConnectionString = env.IOTHUB_DEVICE_CONNECTION_STRING!;
    
        this.client = Client.fromConnectionString(deviceConnectionString, Protocol);
        this.client.open((err) => this.onConnect(err));
    }
    
    private onConnect(err?: Error, _result1?: any): void {
      if (err) {
        console.error("Could not connect: " + err.message);
      } else {
        console.log("Connected to device. Registering handlers for methods.");
      }
    
      this.client.onDeviceMethod(
        "turnOn",
        (req: DeviceMethodRequest, res: DeviceMethodResponse) => {
          this.lamp.turnOn();
          res.send(200, handleDirectMethodError("turnOn"));
        },
      );
      this.client.onDeviceMethod(
        "turnOff",
        (req: DeviceMethodRequest, res: DeviceMethodResponse) => {
          this.lamp.turnOff();
          res.send(200, handleDirectMethodError("turnOff"));
        },
      );
      this.client.onDeviceMethod("configure", (req, res) => {
        try {
          this.configureLamp(req.payload);
          res.send(200, handleDirectMethodError("configure"));
        } catch (e) {
          console.error("configure failed:", e);
          res.send(400, String(e));
        }
      });
    }
    
    private configureLamp(config: {
      blinkPeriod?: number;
      colour?: { r: number; g: number; b: number };
      maxBrightness?: number;
    }) {
      if (config.colour) this.lamp.setKleur(config.colour);
      if (config.blinkPeriod) this.lamp.setPeriod(config.blinkPeriod);
      if (config.maxBrightness) this.lamp.setMaxLichtsterkte(config.maxBrightness);
    }
}

