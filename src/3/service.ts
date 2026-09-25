import azureClient from 'azure-iothub'
import { env } from "node:process";

const { Client } = azureClient
let sendInterval: NodeJS.Timeout | null = null;

var connectionString = env.IOTHUB_SERVICE_CONNECTION_STRING!;
var targetDevice = env.IOTHUB_DEVICE_ID!;
var methodParams = {
  methodName: env.IOTHUB_METHOD_NAME!,
  payload: env.IOTHUB_METHOD_PAYLOAD!,
  responseTimeoutInSeconds: 15
};

var client = Client.fromConnectionString(connectionString);

export function run_service() {
    if (!sendInterval) {
        sendInterval = setInterval(() => {
            client.invokeDeviceMethod(targetDevice, methodParams, function (err, result) {
              if (err) {
                console.error('Failed to invoke method \'' + methodParams.methodName + '\': ' + err.message);
              } else {
                console.log(methodParams.methodName + ' on ' + targetDevice + ':');
                console.log(JSON.stringify(result, null, 2));
              }
            });
    }, 2000);
    }
}
