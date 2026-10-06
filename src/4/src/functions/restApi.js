const { app } = require('@azure/functions');

// In-memory store: lives only as long as this worker process does.
const people = new Map();
let nextId = 1;

const fail = (status, message) => ({ status, jsonBody: { error: message } });

function parseId(request) {
    const raw = request.params.id;
    return /^\d+$/.test(raw) ? Number(raw) : null;
}

async function readJson(request) {
    try {
        return { body: await request.json() };
    } catch {
        return { error: 'Request body must be valid JSON.' };
    }
}

// Returns { value } with the cleaned fields, or { error }.
// For partial (PATCH) updates, only the supplied fields are validated.
function validate(body, partial) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be a JSON object.' };
    }
    const value = {};

    if (!partial || 'name' in body) {
        if (typeof body.name !== 'string' || body.name.trim() === '') {
            return { error: '"name" must be a non-empty string.' };
        }
        value.name = body.name.trim();
    }
    if (!partial || 'age' in body) {
        if (!Number.isInteger(body.age) || body.age < 0 || body.age > 150) {
            return { error: '"age" must be an integer between 0 and 150.' };
        }
        value.age = body.age;
    }
    if (partial && Object.keys(value).length === 0) {
        return { error: 'Provide at least one of "name" or "age".' };
    }
    return { value };
}

// GET /api/people
app.http('listPeople', {
    methods: ['GET'],
    route: 'people',
    handler: async () => ({ status: 200, jsonBody: [...people.values()] })
});

// POST /api/people
app.http('createPerson', {
    methods: ['POST'],
    route: 'people',
    handler: async (request) => {
        const { body, error: parseError } = await readJson(request);
        if (parseError) return fail(400, parseError);

        const { value, error } = validate(body, false);
        if (error) return fail(400, error);

        const person = { id: nextId++, ...value };
        people.set(person.id, person);

        return {
            status: 201,
            headers: { Location: `/api/people/${person.id}` },
            jsonBody: person
        };
    }
});

// GET /api/people/{id}
app.http('getPerson', {
    methods: ['GET'],
    route: 'people/{id}',
    handler: async (request) => {
        const id = parseId(request);
        if (id === null) return fail(400, 'ID must be a non-negative integer.');

        const person = people.get(id);
        if (!person) return fail(404, `Person ${id} not found.`);

        return { status: 200, jsonBody: person };
    }
});

// PATCH /api/people/{id}
app.http('updatePerson', {
    methods: ['PATCH'],
    route: 'people/{id}',
    handler: async (request) => {
        const id = parseId(request);
        if (id === null) return fail(400, 'ID must be a non-negative integer.');

        const person = people.get(id);
        if (!person) return fail(404, `Person ${id} not found.`);

        const { body, error: parseError } = await readJson(request);
        if (parseError) return fail(400, parseError);

        const { value, error } = validate(body, true);
        if (error) return fail(400, error);

        const updated = { ...person, ...value, id }; // id can never be changed
        people.set(id, updated);

        return { status: 200, jsonBody: updated };
    }
});

// DELETE /api/people/{id}
app.http('deletePerson', {
    methods: ['DELETE'],
    route: 'people/{id}',
    handler: async (request) => {
        const id = parseId(request);
        if (id === null) return fail(400, 'ID must be a non-negative integer.');

        if (!people.delete(id)) return fail(404, `Person ${id} not found.`);

        return { status: 204 };
    }
});