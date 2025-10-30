import { verifyJWT } from '../utils/jwt-util';

/**
 * JWT Authentication Middleware for itty-router
 *
 * Checks for valid Bearer token in Authorization header.
 * Returns 401 if token is missing or invalid.
 */
export const authMiddleware = async (request: Request, env: Env, _ctx: ExecutionContext) => {
	const authHeader = request.headers.get('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return Response.json({ error: 'Unauthorized - Bearer token required' }, { status: 401 });
	}

	const token = authHeader.substring(7); // Remove "Bearer " prefix
	const result = await verifyJWT(token, env);

	if (!result.valid) {
		return Response.json({ error: result.error || 'Unauthorized - Invalid token' }, { status: 401 });
	}

	// Attach JWT payload to request for use in route handlers
	// (request as any).jwtPayload = result.payload;

	// Don't return anything - middleware passes request to next handler
};
