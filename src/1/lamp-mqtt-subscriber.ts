import {
  BewegingsSensorMessage,
  BewegingsSensorMessageDTO,
  ConfigureLampMessage,
  ConfigureLampMessageDTO,
  ControlLampMessage,
  ControlLampMessageDTO,
} from "../common/dto.js";
import { MqttSubscriber } from "../common/mqtt-subscriber.js";
import { Lamp } from "./lamp.js";

function handleSensorMessage(message: BewegingsSensorMessage, lamp: Lamp) {
  switch (message.message) {
    case "beweging geconstateerd":
      lamp.turnOn();
      lamp.setLichtsterkte(message.value!);
      break;
    case "apparaat uit":
      lamp.turnOff();
      break;
    case "error":
      console.error(message.errorMessage!);
      break;
  }
  console.log(
    `Lamp ${lamp.id} is ${lamp.getStatus()}` +
      (lamp.getStatus() === "aan"
        ? ` met lichtsterkte ${lamp.getLichtsterkte()}`
        : ""),
  );
}

function handleAdminControlMessage(message: ControlLampMessage, lamp: Lamp) {
    if (message.status == "on") lamp.turnOn();
    if (message.status == "off") lamp.turnOff();
}

function handleAdminConfigureMessage(message: ConfigureLampMessage, lamp: Lamp) {
    if (message.maxBrightness) lamp.setMaxLichtsterkte(message.maxBrightness);
    if (message.blinkPeriod) lamp.tijdsInterval = message.blinkPeriod;
    if (message.color) lamp.setKleur(message.color);
    console.log(
        `Lamp ${lamp.id} was reconfigured: new max brightness ${lamp.getMaxLichtsterkte()}, new time interval: ${lamp.tijdsInterval}`,
    );
}

export function runSubscriber(roomId: string, clientId: string, lamp: Lamp) {
  const subscriber = new MqttSubscriber(clientId);

  subscriber.client.subscribe(`${roomId}/+`);
  subscriber.client.subscribe(`admin/${lamp.id}/+`);

  subscriber.client.on("message", (topic, payload) => {
    try {
        const json = JSON.parse(payload.toString());
        if (topic.startsWith("admin/")) {
        if (topic.endsWith("/configure")) {
            const parsed = ConfigureLampMessageDTO.parse(json);
            console.log(`${parsed.date} - [ADMIN -> ${clientId}] Received: configuration.`);
            handleAdminConfigureMessage(parsed, lamp);
        } else if (topic.endsWith("/control")) {
            const parsed = ControlLampMessageDTO.parse(json);
            console.log(`${parsed.date} - [ADMIN -> ${clientId}] Received: control.`);
            handleAdminControlMessage(parsed, lamp);
        }
        } else if (topic.startsWith(`${roomId}/`)) {
        const parsed = BewegingsSensorMessageDTO.parse(json);
        console.log(`${parsed.date} - [${parsed.sensorClientId} -> ${clientId}] Received: ${parsed.message}`);
        handleSensorMessage(parsed, lamp);
        }
    } catch (err) {
        console.error(`Ignoring invalid message on ${topic}:`, err);
    }
  });
}
