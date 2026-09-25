import { connect } from 'mqtt'
import { BewegingsSensorMessage, BewegingsSensorMessageDTO, ConfigureLampMessage, ConfigureLampMessageDTO } from './dto.js';
import { fileURLToPath } from 'url';
import { ChildProcess, fork } from 'child_process';
import { dirname, resolve } from 'path';
import { MqttSubscriber } from '../common/mqtt-subscriber.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class LampService {
    id: string
    private status: "aan" | "uit" = "uit"
    tijdsInterval: number = 5000
    private maxLichtsterkte: number = 1
    knipperPeriode: number = 1 // 1s period
    kleur: {r: number, g: number, b: number, a: number} = {r: 255, g: 0, b: 0, a: 255}
    private worker: ChildProcess | null = null;

    constructor(id: string) {
        this.id = id;
        // this.display();
    }

    public turnOn() {
        if(this.status === "uit") {
            this.status = "aan";
            this.syncStatus()
            setTimeout(() => {
                this.status = "uit"
                this.syncStatus();
            }, this.tijdsInterval);
        }
    }

    public turnOff() {
        if(this.status === "aan") this.status = "uit"
        this.syncStatus()
    }

    public getStatus() { return this.status; }

    public setLichtsterkte(n: number) {
        if(n > this.maxLichtsterkte) {
            console.error(`New brightness ${n} exceeds the maximum ${this.maxLichtsterkte}, could not update lamp.`)
            return;
        }
        this.kleur.a = n * 255;
        this.syncColor();
    }

    public getLichtsterkte() { return this.kleur.a / 255; }

    public setMaxLichtsterkte(n: number) {
        if(n < 0.0 || n > 1.0) {
            console.error(`Brightness must be between 0.0 and 1.0. Got: ${n}. Not updating lamp.`)
            return;
        }
        this.maxLichtsterkte = n;
        this.syncColor();
    }

    public setKleur(colour: {r: number, g: number, b: number}) {
        this.kleur.r = colour.r;
        this.kleur.g = colour.g;
        this.kleur.b = colour.b;
        this.syncColor()
    }

    public setPeriod(period: number) {
        this.knipperPeriode = period;
        this.syncPeriod();
    }

    public getMaxLichtsterkte() { return this.maxLichtsterkte; }


    public display() {
        const kleur = this.status === "aan" ? this.kleur : { r: 0, g: 0, b: 0, a: 0 };

        this.worker = fork(resolve(__dirname, "lamp-worker.js"), [
            this.id,
            JSON.stringify(kleur),
            String(this.knipperPeriode),
        ]);

        this.worker.on("error", (err) => console.error(`Lamp ${this.id} worker error:`, err));
        this.worker.on("exit", (code) => console.log(`Lamp ${this.id} window closed (code ${code})`));
    }

    private syncStatus() {
        this.worker?.send({ type: "status", value: this.status });
    }

    private syncColor() {
        this.worker?.send({ type: "color", value: this.kleur });
    }

    private syncPeriod() {
        this.worker?.send({ type: "period", value: this.knipperPeriode });
    }
}

function controlLamp(message: BewegingsSensorMessage, lamp: LampService) {
    switch(message.message) {
        case "beweging geconstateerd":
            if(lamp.getStatus() === "uit") lamp.turnOn();
            lamp.setLichtsterkte(message.value!)
            break;
        case "apparaat uit":
            if(lamp.getStatus() === "aan") lamp.turnOff();
            break;
        case 'error':
            console.error(message.errorMessage!)
            break;
    }
    console.log(
        `Lamp ${lamp.id} is ${lamp.getStatus()}`
        + (lamp.getStatus() === "aan"? ` met lichtsterkte ${lamp.getLichtsterkte()}`: "")
    );
}

export function runSubscriber(roomId: string, clientId: string, lamp: LampService) {
    const publisher = new MqttSubscriber(clientId);

    publisher.client.subscribe(`${roomId}/+`);
    publisher.client.subscribe(`admin/${lamp.id}`);

    publisher.client.on("message", (topic, payload) => {
    if (topic === `admin/${lamp.id}`) {
        // admin config message
        let parsed: ConfigureLampMessage = ConfigureLampMessageDTO.parse(
            JSON.parse(payload.toString())
        );
        console.log(`${parsed.date} - [ADMIN -> ${clientId}] Received: configuration.`);
        lamp.setMaxLichtsterkte(parsed.maxBrightness);
        lamp.tijdsInterval = parsed.timeInterval;
        console.log(`Lamp ${lamp.id} was reconfigured: new max brightness ${lamp.getMaxLichtsterkte()}, new time interval: ${lamp.tijdsInterval}`)
    } else if (topic.startsWith(`${roomId}/`)) {
        // sensor message
        let parsed: BewegingsSensorMessage = BewegingsSensorMessageDTO.parse(
        JSON.parse(payload.toString())
        );
        console.log(`${parsed.date} - [${parsed.clientId} -> ${clientId}] Received: ${parsed.message}`);
        controlLamp(parsed, lamp);
    }
    });
}
