import { Router } from 'itty-router';
import { corsHeaders } from './constants/cors';
import { BundlerService } from './service/bundler-service';
import {
  CompileRequestSchema,
  CompileSuccessResponse,
  CompileErrorResponse
} from './dto/compile';

const router = Router();

router.options('*', () => new Response(null, { headers: corsHeaders }));

router.post('/compile', async (request: any, env: any) => {
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

router.all('*', () =>
  Response.json(
    { success: false, error: 'Invalid endpoint' },
    { status: 404, headers: corsHeaders }
  )
);

export default { ...router };