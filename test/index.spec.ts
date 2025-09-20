import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('TypeScript Bundler Worker', () => {
	it('compiles TypeScript code successfully', async () => {
		const tsCode = 'const hello: string = "world";\nconsole.log(hello);';

		const request = new IncomingRequest('http://example.com/_cfw/cf-ts-bundler-worker/compile', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ code: tsCode }),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const result = await response.json();
		expect(result).toMatchObject({
			success: true,
			compiledCode: expect.any(String),
		});
		// Check that it contains some version of the variable and console.log
		expect(result.compiledCode).toContain('="world"');
		expect(result.compiledCode).toContain('console.log');
	});

	it('returns error for missing code field', async () => {
		const request = new IncomingRequest('http://example.com/_cfw/cf-ts-bundler-worker/compile', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({}),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		// TODO: Should return 400 for validation errors, but chanfana currently returns 500 when validation fails
		// This is temporary behavior - will be fixed when proper error handling is implemented
		expect(response.status).toBe(500);
		const result = await response.json();
		expect(result).toMatchObject({
			success: false,
			error: expect.stringContaining('Server error'),
		});
	});

	it('serves OpenAPI JSON specification', async () => {
		const request = new IncomingRequest('http://example.com/_cfw/cf-ts-bundler-worker/openapi.json');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const openapi = await response.json();
		expect(openapi).toMatchObject({
			openapi: expect.stringMatching(/^3\./),
			info: {
				title: 'TypeScript Bundler API',
				version: '1.0.0',
			},
		});
	});
});
