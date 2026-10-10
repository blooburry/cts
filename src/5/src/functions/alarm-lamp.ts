import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { MqttPublisher } from "../common/mqtt-publisher";
import { ConfigureLampMessageDTO, ControlLampMessage, ControlLampMessageDTO } from "../common/dto";

const publisher = MqttPublisher.shared('Az_REST_API');
const lampRegistry = ['woonkamer_lamp', 'keuken_lamp']

function safeParseJSON(o: unknown): {success: boolean, res: any} {
    let res: unknown
    try {
        res = o;
    } catch {
        return {success: false, res: { status: 400, body: 'Request body must be valid JSON.' }};
    }
    if (typeof res !== 'object' || res === null) {
        return {success: false, res: { status: 400, body: 'Request body must be a JSON object.' }};
    }

    return {success: true, res}
}

async function controlLamp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const lampId = request.query.get('lampId');
    if(lampId == undefined) return { status: 400, body: 'Please provide a lampId.' };
    if(!lampRegistry.includes(lampId)) return { status: 400, body: `Lamp with id ${lampId} not found.` };

    const {success, res} = safeParseJSON(await request.json());
    if(!success) return res
    const body = res

    const result = ControlLampMessageDTO.safeParse({ ...(body as object), date: new Date() });
    if (!result.success) {
        return { status: 400, jsonBody: { error: 'Invalid configuration', issues: result.error.issues } };
    }

    try {
        await publisher.publish(`admin/${lampId}/control`, JSON.stringify(result.data))
    } catch (err) {
        context.error('Publish failed', err);
        return { status: 502, body: 'Could not reach the message broker.' };
    }

    return { status: 200 };
};

async function configureLamp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const lampId = request.query.get('lampId');
    if(lampId == undefined) return { status: 400, body: 'Please provide a lampId.' };
    if(!lampRegistry.includes(lampId)) return { status: 400, body: `Lamp with id ${lampId} not found.` };

    const {success, res} = safeParseJSON(await request.json());
    if(!success) return res
    const body = res

    const result = ConfigureLampMessageDTO.safeParse({ ...(body as object), date: new Date() });
    if (!result.success) {
        return { status: 400, jsonBody: { error: 'Invalid configuration', issues: result.error.issues } };
    }

    try {
        await publisher.publish(`admin/${lampId}/configure`, JSON.stringify(result.data));
    } catch (err) {
        context.error('Publish failed', err);
        return { status: 502, body: 'Could not reach the message broker.' };
    }

    return { status: 200 };
}

app.http('controlLamp', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: controlLamp
});

app.http('configureLamp', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: configureLamp
});
