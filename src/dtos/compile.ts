import { z } from 'zod';

export const CompileRequestSchema = z.object({
  code: z.string().min(1, 'Code field is required and cannot be empty')
});

export const CompileSuccessResponseSchema = z.object({
  success: z.boolean(),
  compiledCode: z.string()
});

export const CompileErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string()
});

// Schema for file upload using multipart/form-data
export const CompileFileRequestSchema = z.object({
  file: z.instanceof(File).describe('TypeScript file to compile (.ts)')
    .openapi({ type: 'string', format: 'binary' })
}).openapi({
  title: 'CompileFileRequest',
  description: 'File upload request for TypeScript compilation'
});

// Schema for compiled JavaScript file response (application/javascript)
export const CompiledJavaScriptResponseSchema = z.string()
  .describe('Compiled JavaScript code as file download')
  .openapi({
    type: 'string',
    description: 'Compiled JavaScript code',
    example: 'const hello = "world";\nconsole.log(hello);'
  });

export type CompileRequest = z.infer<typeof CompileRequestSchema>;
export type CompileSuccessResponse = z.infer<typeof CompileSuccessResponseSchema>;
export type CompileErrorResponse = z.infer<typeof CompileErrorResponseSchema>;
export type CompileFileRequest = z.infer<typeof CompileFileRequestSchema>;
export type CompiledJavaScriptResponse = z.infer<typeof CompiledJavaScriptResponseSchema>;