const { app } = require('@azure/functions');

app.http('helloWorld', {
    methods: ['GET', 'POST'],
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text() || 'world';

        return { body: `Hello, ${name}!` };
    }
});

app.http('helloAge', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const age = request.query.get('age');
        if(!age) {
            console.error('Bad request 500, no age parameter was provided.')
            return { status: 500, body: 'No age parameter was provided in the request.' };
        }

        return { body: `You are ${age} years old.` };
    }
});
