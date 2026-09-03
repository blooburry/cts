import { runPublisher } from "./1/bewegingssensor.js";
import { runBroker } from "./1/mqtt-broker.js";
import { Lamp, runSubscriber } from "./1/lamp.js";

console.log("=== PRACTICUM 1 START ===");
await runBroker();
runPublisher('bewegingssensor 1');
let lamp1 = new Lamp("woonkamer_lamp");
let lamp2 = new Lamp("keuken_lamp");
runSubscriber('subscriber 1', lamp1);
runSubscriber('subscriber 2', lamp2);
