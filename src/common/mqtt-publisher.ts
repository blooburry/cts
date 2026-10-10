import { connect, IClientOptions, IClientPublishOptions, MqttClient } from "mqtt";
import { env } from "node:process";
import { randomUUID } from "node:crypto";

export class MqttPublisher {
    client: MqttClient

    private static sharedInstance?: MqttPublisher;

    constructor(clientId: string, options: IClientOptions = {}) {
        this.client = connect(
            `mqtts://${env.HIVEMQ_BROKER_ID}.s1.eu.hivemq.cloud:8883`,
            {
                clientId,
                protocol: "mqtts",
                rejectUnauthorized: true,
            username: env.HIVEMQ_USERNAME,
            password: env.HIVEMQ_PASSWORD,
            ...options
            }
        );
    
        this.client.on("connect", () => {
            console.log("Publisher connected to broker");
        });
        
        this.client.on("error", (err) => {
            console.error("Publisher error:", err);
        });

        this.client.on("close", () => console.log("Connection closed"));
        this.client.on("offline", () => console.log("Client offline"));
        this.client.on("reconnect", () => console.log("Attempting reconnect..."));
    }

    static shared(prefix = "func"): MqttPublisher {
        return (MqttPublisher.sharedInstance ??= new MqttPublisher(
            `${prefix}-${randomUUID()}`,
            { keepalive: 30 }
        ));
    }

    ready(timeoutMs = 10_000): Promise<void> {
        if (this.client.connected) return Promise.resolve();

        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error(`MQTT connect timed out after ${timeoutMs} ms`));
            }, timeoutMs);

            const onConnect = () => { cleanup(); resolve(); };
            const onError = (err: Error) => { cleanup(); reject(err); };

            const cleanup = () => {
                clearTimeout(timer);
                this.client.off("connect", onConnect);
                this.client.off("error", onError);
            };

            this.client.once("connect", onConnect);
            this.client.once("error", onError);
        });
    }

    async publish(
        topic: string,
        message: string | Buffer,
        options: IClientPublishOptions = { qos: 1 }
    ): Promise<void> {
        await this.ready();
        await this.client.publishAsync(topic, message, options);
    }

    async close(force = false): Promise<void> {
        await this.client.endAsync(force);
    }
}