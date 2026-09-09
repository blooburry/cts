import { runBroker } from "./1/mqtt-broker.js";
import { LampService, runSubscriber } from "./1/lamp.js";

console.log("=== PRACTICUM 1 START ===");
// await runBroker();
let lamp1 = new LampService("woonkamer_lamp");
let lamp2 = new LampService("keuken_lamp");
runSubscriber('woonkamer', 'subscriber 1', lamp1);
runSubscriber('keuken', 'subscriber 2', lamp2);
