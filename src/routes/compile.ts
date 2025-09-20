import { Router } from 'itty-router';
import { corsHeaders } from '@/constants/cors';
import { BundlerService } from '@/services/bundler-service';
import {
  CompileRequestSchema,
  CompileSuccessResponse,
  CompileErrorResponse
} from '@/dtos/compile';

export const compileRouter = Router({ base: '/_cfw/cf-ts-bundler-worker' });

compileRouter.post('/compile', async (request: any) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  console.info(`[${requestId}] TypeScript compilation request started`);

  try {
    console.debug(`[${requestId}] Parsing request body`);
    const rawBody = await request.json();

    const parseResult = CompileRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues.map((e: any) => e.message).join(', ');
      console.error(`[${requestId}] Request validation failed`, parseResult.error);

      const response: CompileErrorResponse = {
        success: false,
        error: `Invalid request: ${errorMessage}`
      };

      return Response.json(response, {
        status: 400,
        headers: corsHeaders
      });
    }

    const { code } = parseResult.data;
    console.info(`[${requestId}] Starting TypeScript compilation`, { codeLength: code.length });

    try {
      console.debug(`[${requestId}] Using bundler service for compilation`);

      const bundler = await BundlerService.getInstance();
      const compiledCode = await bundler.compile(code);

      console.info(`[${requestId}] Compilation successful`, {
        originalLength: code.length,
        compiledLength: compiledCode.length,
      });

      const response: CompileSuccessResponse = {
        success: true,
        compiledCode: compiledCode,
      };

      return Response.json(response, {
        status: 200,
        headers: corsHeaders
      });

    } catch (compileError) {
      const errorMessage = compileError instanceof Error ? compileError.message : 'Unknown compilation error';
      console.error(`[${requestId}] Compilation failed`, compileError);

      const response: CompileErrorResponse = {
        success: false,
        error: `Compilation failed: ${errorMessage}`
      };

      return Response.json(response, {
        status: 500,
        headers: corsHeaders
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[${requestId}] Unexpected server error`, error);

    const response: CompileErrorResponse = {
      success: false,
      error: `Server error: ${errorMessage}`
    };

    return Response.json(response, {
      status: 500,
      headers: corsHeaders
    });
  }
});

compileRouter.post('/compile-file', async (request: any) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  console.info(`[${requestId}] File upload compilation request started`);

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      const response: CompileErrorResponse = {
        success: false,
        error: 'File is required'
      };

      return Response.json(response, {
        status: 400,
        headers: corsHeaders
      });
    }

    const filename = file.name || 'unknown.ts';
    const code = await file.text();

    if (!code || code.trim().length === 0) {
      const response: CompileErrorResponse = {
        success: false,
        error: 'File content cannot be empty'
      };

      return Response.json(response, {
        status: 400,
        headers: corsHeaders
      });
    }

    console.info(`[${requestId}] Starting TypeScript compilation`, {
      codeLength: code.length,
      filename,
      fileSize: file.size
    });

    try {
      console.debug(`[${requestId}] Using bundler service for compilation`);

      const bundler = await BundlerService.getInstance();
      const compiledCode = await bundler.compile(code);

      console.info(`[${requestId}] Compilation successful`, {
        originalLength: code.length,
        compiledLength: compiledCode.length,
      });

      const outputFilename = filename.replace(/\.ts$/, '.js').replace(/\.tsx$/, '.js');

      return new Response(compiledCode, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript',
          'Content-Disposition': `attachment; filename="${outputFilename}"`,
        }
      });

    } catch (compileError) {
      const errorMessage = compileError instanceof Error ? compileError.message : 'Unknown compilation error';
      console.error(`[${requestId}] Compilation failed`, compileError);

      const response: CompileErrorResponse = {
        success: false,
        error: `Compilation failed: ${errorMessage}`
      };

      return Response.json(response, {
        status: 500,
        headers: corsHeaders
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[${requestId}] Unexpected server error`, error);

    const response: CompileErrorResponse = {
      success: false,
      error: `Server error: ${errorMessage}`
    };

    return Response.json(response, {
      status: 500,
      headers: corsHeaders
    });
  }
});
