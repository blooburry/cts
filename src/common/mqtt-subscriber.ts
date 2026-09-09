import { connect, MqttClient } from "mqtt";
import { env } from "node:process";

export class MqttSubscriber {
client: MqttClient

    constructor(clientId: string){

        this.client = connect(
            "mqtts://a0964b8c81284efdb5101e8ee20c1c31.s1.eu.hivemq.cloud:8883",
            {
                clientId,
                protocol: "mqtts",
                rejectUnauthorized: true,
                username: env.HIVEMQ_USERNAME,
                password: env.HIVEMQ_PASSWORD
            }
        );
        
        this.client.on("connect", () => {
            console.log("Subscriber connected to broker");
        });
    
        this.client.on("error", (err) => {
            console.error("Subscriber error:", err);
        });


        this.client.on("close", () => console.log("Connection closed"));
        this.client.on("offline", () => console.log("Client offline"));
        this.client.on("reconnect", () => console.log("Attempting reconnect..."));
    }
}