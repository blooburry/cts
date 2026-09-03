import { createServer } from "node:net";
import { Aedes } from "aedes";

const PORT = 1883;

const aedes = await Aedes.createBroker();
const server = createServer(aedes.handle);

export async function runBroker() {
  aedes.on("client", (client) => {
    console.log(`Client connected: ${client.id}`);
  });
  aedes.on("clientDisconnect", (client) => {
    console.log(`Client disconnected: ${client.id}`);
  });

  server.listen(PORT, () => {
    console.log(`MQTT broker listening on port ${PORT}`);
  });
}
