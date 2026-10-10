import { Lamp } from "./1/lamp.js";
import { runSubscriber } from "./1/lamp-mqtt-subscriber.js";
import { LampIOTDevice } from "./3/lamp-iot-device.js";

console.log("=== PRACTICUM 3 START ===");
// await runBroker();
const lamp1 = new Lamp('woonkamer_lamp')
const lamp2 = new Lamp('keuken_lamp')
const lamp3 = new Lamp('badkamer_lamp')

runSubscriber('woonkamer', 'subscriber 1', lamp1);
runSubscriber('keuken', 'subscriber 2', lamp2);

const lampDevice = new LampIOTDevice(lamp3);

lamp1.display()
lamp2.display()
lamp3.display()
