import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
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
			error: expect.any(String),
		});
	});

	it('compiles TypeScript with external modules (compile endpoint)', async () => {
		// Code that imports react - with external, it should NOT be bundled
		const tsCode = 'import React from "react";\nconsole.log(React.version);';

		const request = new IncomingRequest('http://example.com/_cfw/cf-ts-bundler-worker/compile', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ code: tsCode, external: ['react'] }),
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
		// react should remain as an external import, not bundled inline
		// esbuild minifies spacing, so the output is from"react" without a space
		expect(result.compiledCode).toMatch(/from\s*"react"/);
	});

	it('compiles TypeScript file with external modules (compile-file endpoint)', async () => {
		const tsCode = 'import React from "react";\nconsole.log(React.version);';
		const file = new File([tsCode], 'test.ts', { type: 'text/plain' });

		const formData = new FormData();
		formData.append('file', file);
		formData.append('external', 'react');

		const request = new IncomingRequest('http://example.com/_cfw/cf-ts-bundler-worker/compile-file', {
			method: 'POST',
			body: formData,
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('application/javascript');
		const compiledCode = await response.text();
		// react should remain as an external import, not bundled inline
		// esbuild minifies spacing, so the output is from"react" without a space
		expect(compiledCode).toMatch(/from\s*"react"/);
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
