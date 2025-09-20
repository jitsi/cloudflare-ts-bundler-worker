import { Router } from 'itty-router';
import { corsHeaders } from './constants/cors';
import { compileRouter } from './routes/compile';

const mainRouter = Router();

mainRouter.options('*', () => new Response(null, { headers: corsHeaders }));

// mount API routes
mainRouter.all('*', compileRouter.fetch);

// default handler
mainRouter.all('*', () => Response.json({ success: false, error: 'Invalid endpoint' }, { status: 404 }));

export default {
	fetch: mainRouter.fetch,
};
