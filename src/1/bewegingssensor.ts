import { connect, MqttClient } from "mqtt"
import { createInterface } from "node:readline";
import { BewegingsSensorMessage } from "./dto.js";

function parseInput(clientId: string, raw: string): BewegingsSensorMessage {
  if(parseInt(raw)) {
    return {
      clientId,
      date: new Date(),
      message: "beweging geconstateerd",
      value: parseInt(raw)
    }
  } else {
    switch(raw) {
      case "Q":
        return {
          clientId,
          date: new Date(),
          message: "apparaat uit",
        }
      default:
        return {
          clientId,
          date: new Date(),
          message: "error",
          errorMessage: raw
        }
    }
  }
}

export function runPublisher(clientId: string) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const client = connect("mqtt://localhost:1883", { clientId });

  client.on("connect", () => {
    console.log("Publisher connected to broker");
  });

  client.on("error", (err) => {
    console.error("Publisher error:", err);
  });

  console.log("Voor lichtsterkte in of 'Q' om het apparaat uit te zetten.");

  rl.on('line', (input: string) => {
    client.publish(
      'bewegingssensor',
      JSON.stringify(
        parseInput(clientId, input)
      )
    );
  });
}

