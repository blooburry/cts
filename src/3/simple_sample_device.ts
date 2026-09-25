import azureIotDeviceMqtt from 'azure-iot-device-mqtt'
import azureIotDevice from 'azure-iot-device'
import { env } from "node:process";
import { Twin } from 'azure-iot-device';

const { Mqtt } = azureIotDeviceMqtt
const { Client, Message } = azureIotDevice
type Message = InstanceType<typeof Message>
type Client = InstanceType<typeof Client>

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
const deviceConnectionString = env.IOTHUB_DEVICE_CONNECTION_STRING!;

// Networking functions
function disconnectHandler(client: Client) {
  client.open().catch((err: Error) => {
    console.error(err.message);
  });
}

function messageHandler(client: Client, msg: Message) {
  console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
  client.complete(msg, printResultFor('completed'));
}

function errorHandler(err: Error) {
  console.error(err.message);
}

// Helper function to print results in the console
function printResultFor(op: string) {
  return function printResult(err?: Error, res?: any) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}

// Bussiness logic
class EnvironmentSensor {
  sendInterval: NodeJS.Timeout | null;
  chargeInterval: NodeJS.Timeout | null = null;
  client: Client;
  batteryLevel: number = 1.0; // between 0.0 and 1.0

  constructor() {
    this.sendInterval = null;
    this.client = Client.fromConnectionString(deviceConnectionString, Mqtt);
    this.client.on('connect', this.startPeriodicEmit);
    this.client.on('error', (e) => { errorHandler(e); this.removeInterval(); });
    this.client.on('disconnect', disconnectHandler);
    this.client.on('message', messageHandler);

    this.client.open()
      .catch((err) => {
        console.error('Could not connect: ' + err.message);
      });

    this.client.getTwin(this.twinHandler);
  }

  private measure = (): Message => {
    const windSpeed = 10 + (Math.random() * 4); // range: [10, 14]
    const temperature = 20 + (Math.random() * 10); // range: [20, 30]
    const humidity = 60 + (Math.random() * 20); // range: [60, 80]
    this.batteryLevel = Math.max(0, this.batteryLevel - 0.001);
    const datetime = Date.now();
    const data = JSON.stringify({
      deviceId: 'environmentSensor',
      windSpeed,
      temperature,
      humidity,
      datetime,
    });

    let message = new Message(data);
    message.contentType = 'application/json';
    message.contentEncoding = 'utf-8';
    message.properties.add('temperatureAlert', (temperature > 28) ? 'true' : 'false');
    return message;
  };

  private startPeriodicEmit = (): void => {
    if (!this.sendInterval) {
      this.sendInterval = setInterval(() => {
        const message = this.measure();
        console.log('Sending message: ' + message.getData());
        this.client.sendEvent(message, printResultFor('send'));
      }, 2000);
    }
  };

  private chargeBattery = (): void => {
    if (this.chargeInterval) return; // already charging
    this.chargeInterval = setInterval(() => {
      this.batteryLevel = Math.min(1.0, this.batteryLevel + 0.1);
      if (this.batteryLevel >= 1.0) {
        clearInterval(this.chargeInterval!);
        this.chargeInterval = null;
      }
    }, 1000);
  };

  private removeInterval(): void {
    if (this.sendInterval) clearInterval(this.sendInterval);
    this.sendInterval = null;
  }

  private twinHandler = (err?: Error, twin?: Twin): void => {
    if (err) {
      console.error("Could not get twin: " + err.message);
      return;
    }

    // React to changes in desired properties
    twin!.on("properties.desired", (desiredChange) => {
      console.log("New desired properties received:", desiredChange);

      if (desiredChange.startCharging) {
        this.chargeBattery();
      }

      // Report back what we actually did
      twin!.properties.reported.update(
        {
          charging: this.chargeInterval !== null,
          batteryLevel: this.batteryLevel,
          lastUpdated: new Date().toISOString(),
        },
        (err: Error) => {
          if (err) console.error('Could not report properties: ' + err.message);
        }
    );
    });
  };
}

export function run_sample_device() {
  // fromConnectionString must specify a transport constructor, coming from any transport package.  
  const sensor = new EnvironmentSensor(); 
}