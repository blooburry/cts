import "dotenv/config";

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Client as IotHubClient } from "azure-iothub";
import type { ZodType } from "zod";
import { env } from "node:process";
import { MqttPublisher } from "../common/mqtt-publisher";
import {
    ConfigureLampMessage,
    ConfigureLampMessageDTO,
    ControlLampMessage,
    ControlLampMessageDTO,
} from "../common/dto";

const publisher = MqttPublisher.shared("Az_REST_API");

type LampTarget =
    | { protocol: "mqtt" }
    | { protocol: "direct_method"; deviceId: string };

const lampRegistry: Record<string, LampTarget> = {
    woonkamer_lamp: { protocol: "mqtt" },
    keuken_lamp: { protocol: "mqtt" },
    badkamer_lamp: { protocol: "direct_method", deviceId: env.IOTHUB_DEVICE_ID! },
};

let iotHubClient: IotHubClient | undefined;
function getIotHubClient(): IotHubClient {
    return (iotHubClient ??= IotHubClient.fromConnectionString(
        env.IOTHUB_SERVICE_CONNECTION_STRING!
    ));
}

async function invokeDirectMethod(deviceId: string, methodName: string, payload: unknown = null) {
    const { result } = await getIotHubClient().invokeDeviceMethod(deviceId, {
        methodName,
        payload,
        connectTimeoutInSeconds: 5,
        responseTimeoutInSeconds: 10,
    });
    if (result.status !== 200) {
        throw new Error(
            `Direct method ${methodName} on ${deviceId} returned ${result.status}: ${JSON.stringify(result.payload)}`
        );
    }
}

async function sendControl(lampId: string, target: LampTarget, msg: ControlLampMessage) {
    if (target.protocol === "mqtt") {
        await publisher.publish(`admin/${lampId}/control`, JSON.stringify(msg));
    } else {
        await invokeDirectMethod(target.deviceId, msg.status === "on" ? "turnOn" : "turnOff");
    }
}

async function sendConfigure(lampId: string, target: LampTarget, msg: ConfigureLampMessage) {
    if (target.protocol === "mqtt") {
        await publisher.publish(`admin/${lampId}/configure`, JSON.stringify(msg));
    } else {
        await invokeDirectMethod(target.deviceId, "configure", msg);
    }
}

async function handleLampCommand<T>(
    request: HttpRequest,
    context: InvocationContext,
    schema: ZodType<T>,
    send: (lampId: string, target: LampTarget, msg: T) => Promise<void>
): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const lampId = request.query.get("lampId");
    if (!lampId) return { status: 400, body: "Please provide a lampId." };
    if (!(lampId in lampRegistry)) return { status: 400, body: `Lamp with id ${lampId} not found.` };
    const target = lampRegistry[lampId];

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return { status: 400, body: "Request body must be valid JSON." };
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return { status: 400, body: "Request body must be a JSON object." };
    }

    const parsed = schema.safeParse({ ...body, date: new Date() });
    if (!parsed.success) {
        return { status: 400, jsonBody: { error: "Invalid message", issues: parsed.error.issues } };
    }

    try {
        await send(lampId, target, parsed.data);
    } catch (err) {
        context.error(`Sending command to ${lampId} via ${target.protocol} failed`, err);
        return { status: 502, body: "Could not reach the lamp." };
    }

    return { status: 200 };
}

const controlLamp = (req: HttpRequest, ctx: InvocationContext) =>
    handleLampCommand(req, ctx, ControlLampMessageDTO, sendControl);

const configureLamp = (req: HttpRequest, ctx: InvocationContext) =>
    handleLampCommand(req, ctx, ConfigureLampMessageDTO, sendConfigure);

app.http("controlLamp", { methods: ["POST"], authLevel: "anonymous", handler: controlLamp });
app.http("configureLamp", { methods: ["POST"], authLevel: "anonymous", handler: configureLamp });
