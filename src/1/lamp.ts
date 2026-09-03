import { connect } from 'mqtt'
import { BewegingsSensorMessage, BewegingsSensorMessageDTO } from './dto.js';

export class Lamp {
    id: string
    status: "aan" | "uit" = "uit"
    lichtsterkte: number | null = null

    constructor(id: string) {
        this.id = id;
    }

    turnOn() {
        if(this.status === "uit") {
            this.status = "aan";
            setTimeout(() => {
                this.status = "uit"
            }, 5000);
        }
    }

    turnOff() {
        if(this.status === "aan") this.status = "uit"
    }

    getStatus() {};
}

function controlLamp(message: BewegingsSensorMessage, lamp: Lamp) {
    switch(message.message) {
        case "beweging geconstateerd":
            if(lamp.status === "uit") lamp.status = "aan";
            lamp.lichtsterkte = message.value!
            break;
        case "apparaat uit":
            if(lamp.status === "aan") lamp.status = "uit";
            break;
        case 'error':
            console.error(message.errorMessage!)
            break;
    }
    console.log(
        `Lamp ${lamp.id} is ${lamp.status}`
        + (lamp.status === "aan"? ` met lichtsterkte ${lamp.lichtsterkte}`: "")
    );
}

export function runSubscriber(clientId: string, lamp: Lamp) {
    const client = connect("mqtt://localhost:1883", { clientId });

    client.on("connect", () => {
        console.log("Subscriber connected to broker");
    });

    client.on("error", (err) => {
        console.error("Subscriber error:", err);
    });

    client.subscribe("bewegingssensor");

    client.on("message", (topic, payload) => {
        let parsed: BewegingsSensorMessage = BewegingsSensorMessageDTO.parse(
            JSON.parse(payload.toString())
        )
        console.log(`${parsed.date} - [${parsed.clientId} -> ${clientId}] Received on ${topic}: ${parsed.message}`);
        controlLamp(parsed, lamp);
    });
}
