import { runBroker } from "./1/mqtt-broker.js";
import { Lamp } from "./1/lamp.js";
import { runSubscriber } from "./1/lamp-mqtt-subscriber.js";
import { run_sample_device } from "./3/simple_sample_device.js";
import { run_door } from "./3/door.js";
import { run_service } from "./3/service.js";
import { run_lamp_device } from "./3/lamp-iot-device.js";

console.log("=== PRACTICUM 3 START ===");
// await runBroker();
// let lamp1 = new LampService("woonkamer_lamp");
// let lamp2 = new LampService("keuken_lamp");
// runSubscriber('woonkamer', 'subscriber 1', lamp1);
// runSubscriber('keuken', 'subscriber 2', lamp2);

run_lamp_device();
