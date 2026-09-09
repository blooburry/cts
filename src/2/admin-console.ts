import { createInterface, Interface } from "node:readline/promises";
import { exit, stdin, stdout } from "node:process";
import { ConfigureLampMessage } from "../1/dto.js";
import { MqttPublisher } from "../common/mqtt-publisher.js";

class AdminConsole {
    private adminsPass = "1234"
    private lampIDs = ['woonkamer_lamp', 'keuken_lamp']
    private isAuthenticated = false
    private interface: Interface
    private publisher: MqttPublisher

    constructor(_interface: Interface) {
        this.interface = _interface;
        this.publisher = new MqttPublisher('admin-console')
    }

    public welcome() {
        console.log('Welcome to the Admin Console!');
    }

    public async run() {
        this.welcome();
        while (true) {
            if (this.isAuthenticated) {
                await this.configureLamp();
            } else {
                const input = await this.interface.question(
                'admin console> Please enter the admin password, or type "exit" to quit: '
                );
                if (input.trim() === "exit") {
                    console.log("admin console> bye bye");
                    exit();
                }
                await this.auth(input);
            }
        }
    }
    
    private async auth(input: string) {
        if (input === this.adminsPass) {
            console.log(" > Successfully authenticated!");
            this.isAuthenticated = true;
            return;
        }
        console.log(" > Wrong password, try again.");
    }

    private async configureLamp() {
        const id = await this.interface.question('admin console> Please enter the ID of the lamp you want to configure:');
        const maxLampBrightness = await this.interface.question(' > Maximum brightness:');
        const timeInterval = await this.interface.question(' > Time interval:');

        // Validate input
        if(!this.lampIDs.includes(id)) {
            console.log(` > Could not find lamp with ID ${id}, configuration failed.`);
            return;
        }
        if(!this.isNonNegativeFloat(timeInterval)) {
            console.log(` > Invalid time interval: ${timeInterval}, configuration failed.`);
            return;
        }
        if(!this.isNonNegativeFloat(maxLampBrightness) || parseFloat(maxLampBrightness) > 1.0) {
            console.log(` > Invalid brightness: ${maxLampBrightness}, configuration failed.`);
            return;
        }

        // Configure
        const message: ConfigureLampMessage = {
            maxBrightness: parseFloat(maxLampBrightness),
            date: new Date(),
            timeInterval: parseFloat(timeInterval),
        };

        this.publisher.client.publish(
            `admin/${id}`,
            JSON.stringify(message),
            (err) => {
                if (err) console.error("Publish failed:", err);
                else console.log("Published:", message);
            }
        );

        const input = await this.interface.question(' > Configuration done! Enter "exit" to stop or any key to continue.')
        if(input.trim() === 'exit') {
            console.log("admin console> bye bye");
            exit();
        }
    }

    private isNonNegativeFloat(input: string): boolean {
        const trimmed = input.trim();
        if (trimmed === "") return false;

        const value = Number(trimmed);
        return !isNaN(value) && value >= 0;
    }
}

const adminConsole = new AdminConsole(createInterface(stdin, stdout));
await adminConsole.run();