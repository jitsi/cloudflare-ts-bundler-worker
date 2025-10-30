import { contentJson, extendZodWithOpenApi, fromIttyRouter, OpenAPIRoute } from 'chanfana';
import { Router } from 'itty-router';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
	CompiledJavaScriptResponseSchema,
	CompileErrorResponseSchema,
	CompileFileRequestSchema,
	CompileRequestSchema,
	CompileSuccessResponseSchema,
} from '@/dtos/compile';
import { authMiddleware } from '@/middleware/auth';
import { BundlerService } from '@/services/bundler-service';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// API base path constant
const API_BASE_PATH = '/_cfw/cf-ts-bundler-worker';

class CompileEndpoint extends OpenAPIRoute {
	schema = {
		security: [{ bearerAuth: [] }],
		tags: ['TypeScript Compilation'],
		summary: 'Compile TypeScript to JavaScript',
		description: 'Compiles TypeScript code to JavaScript using esbuild with CDN imports support',
		request: {
			body: contentJson(CompileRequestSchema),
		},
		responses: {
			'200': {
				description: 'Compilation successful',
				...contentJson(CompileSuccessResponseSchema),
			},
			'401': {
				description: 'Unauthorized - Invalid or missing JWT token',
				...contentJson(CompileErrorResponseSchema),
			},
			'500': {
				description: 'Internal server error',
				...contentJson(CompileErrorResponseSchema),
			},
		},
	};

	async handle(_request: Request, _env: Env, _ctx: ExecutionContext) {
		const requestId = nanoid(8);
		console.info(`[${requestId}] TypeScript compilation request started`);

		try {
			const data = await this.getValidatedData<typeof this.schema>();
			const { code } = data.body;
			console.info(`[${requestId}] Starting TypeScript compilation`, {
				codeLength: code.length,
			});

			console.debug(`[${requestId}] Using bundler service for compilation`);
			const bundler = await BundlerService.getInstance();
			const compiledCode = await bundler.compile(code);

			console.info(`[${requestId}] Compilation successful`, {
				originalLength: code.length,
				compiledLength: compiledCode.length,
			});

			return {
				success: true,
				compiledCode: compiledCode,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error(`[${requestId}] Request failed`, error);

			// TODO: Implement proper error handling with specific status codes
			// Currently returning 500 for all errors for simplicity
			return Response.json(
				{
					success: false,
					error: errorMessage,
				},
				{ status: 500 }
			);
		}
	}
}

class CompileFileEndpoint extends OpenAPIRoute {
	schema = {
		security: [{ bearerAuth: [] }],
		tags: ['TypeScript Compilation'],
		summary: 'Compile TypeScript file to JavaScript',
		description: 'Upload a TypeScript file via multipart/form-data and download the compiled JavaScript',
		request: {
			body: {
				content: {
					'multipart/form-data': {
						schema: CompileFileRequestSchema,
					},
				},
			},
		},
		responses: {
			'200': {
				description: 'Compiled JavaScript file',
				content: {
					'application/javascript': {
						schema: CompiledJavaScriptResponseSchema,
					},
				},
			},
			'400': {
				description: 'Bad request - invalid file or empty content',
				...contentJson(CompileErrorResponseSchema),
			},
			'401': {
				description: 'Unauthorized - Invalid or missing JWT token',
				...contentJson(CompileErrorResponseSchema),
			},
			'500': {
				description: 'Internal server error',
				...contentJson(CompileErrorResponseSchema),
			},
		},
	};

	async handle(request: Request, _env: Env, _ctx: ExecutionContext) {
		const requestId = nanoid(8);
		console.info(`[${requestId}] File upload compilation request started`);

		try {
			// Get validated data - chanfana does not support multipart/form-data validation
			// So we'll parse manually but use the schema for documentation
			const formData = await request.formData();
			const file = formData.get('file');

			if (!file || !(file instanceof File)) {
				return Response.json(
					{
						success: false,
						error: 'File is required',
					},
					{ status: 400 }
				);
			}

			const filename = file.name || 'unknown.ts';
			const code = await file.text();

			if (!code || code.trim().length === 0) {
				return Response.json(
					{
						success: false,
						error: 'File content cannot be empty',
					},
					{ status: 400 }
				);
			}

			console.info(`[${requestId}] Starting TypeScript compilation`, {
				codeLength: code.length,
				filename,
				fileSize: file.size,
			});

			console.debug(`[${requestId}] Using bundler service for compilation`);

			const bundler = await BundlerService.getInstance();
			const compiledCode = await bundler.compile(code);

			console.info(`[${requestId}] Compilation successful`, {
				originalLength: code.length,
				compiledLength: compiledCode.length,
			});

			const outputFilename = filename.replace(/\.ts$/, '.js');

			return new Response(compiledCode, {
				status: 200,
				headers: {
					'Content-Type': 'application/javascript',
					'Content-Disposition': `attachment; filename="${outputFilename}"`,
				},
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error(`[${requestId}] Request failed`, error);

			// TODO: Implement proper error handling with specific status codes
			// Currently returning 500 for all errors for simplicity
			return Response.json(
				{
					success: false,
					error: errorMessage,
				},
				{ status: 500 }
			);
		}
	}
}

const router = Router();

const openapi = fromIttyRouter(router, {
	docs_url: `${API_BASE_PATH}/docs`,
	redoc_url: `${API_BASE_PATH}/redoc`,
	openapi_url: `${API_BASE_PATH}/openapi.json`,
	schema: {
		info: {
			title: 'TypeScript Bundler API',
			description: 'Cloudflare Worker for compiling TypeScript to JavaScript using esbuild',
			version: '1.0.0',
		},
	},
});

// Register JWT Bearer authentication security scheme
openapi.registry.registerComponent('securitySchemes', 'bearerAuth', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
});

// Apply JWT authentication middleware to all API routes
openapi.all(`${API_BASE_PATH}/*`, authMiddleware);

// Register API endpoints
openapi.post(`${API_BASE_PATH}/compile`, CompileEndpoint);
openapi.post(`${API_BASE_PATH}/compile-file`, CompileFileEndpoint);

export const compileRouter = router;
