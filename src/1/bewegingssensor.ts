import { createInterface } from "node:readline";
import { BewegingsSensorMessage } from "./dto.js";
import { MqttPublisher } from "../common/mqtt-publisher.js";
import { argv } from "node:process";

function parseInput(clientId: string, raw: string): BewegingsSensorMessage {
  const num = parseFloat(raw);
  if(!isNaN(num)) {
    return {
      clientId,
      date: new Date(),
      message: "beweging geconstateerd",
      value: num,
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

function runPublisher(roomId: string, clientId: string) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const publisher = new MqttPublisher(clientId);

  console.log("Voor lichtsterkte in of 'Q' om het apparaat uit te zetten.");

  rl.on('line', (input: string) => {
    const msg = parseInput(clientId, input)
    publisher.client.publish(
      `${roomId}/${clientId}`,
      JSON.stringify(msg),
      (err) => {
        if (err) console.error("Publish failed:", err);
        else console.log("Published:", msg);
      }
    );
  });
}

const roomId = argv[2];
const clientId = argv[3];

runPublisher(roomId, clientId);
