import { z } from 'zod';

export const CompileRequestSchema = z.object({
  code: z.string().min(1, 'Code field is required and cannot be empty')
});

export const CompileSuccessResponseSchema = z.object({
  success: z.literal(true),
  compiledCode: z.string()
});

export const CompileErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string()
});

export type CompileRequest = z.infer<typeof CompileRequestSchema>;
export type CompileSuccessResponse = z.infer<typeof CompileSuccessResponseSchema>;
export type CompileErrorResponse = z.infer<typeof CompileErrorResponseSchema>;