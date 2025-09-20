import { Router } from 'itty-router';
import { corsHeaders } from './constants/cors';
import { compileRouter } from './routes/compile';

const router = Router({ base: '/_cfw/cf-ts-bundler-worker' });

router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check
router.get('/health', () => new Response('OK'));

// Mount API routes
router.all('*', compileRouter.fetch);

router.all('*', () =>
  Response.json(
    { success: false, error: 'Invalid endpoint' },
    { status: 404, headers: corsHeaders }
  )
);

export default { ...router };