import { verifyJWT } from '../utils/jwt-util';

/**
 * JWT Authentication Middleware for itty-router
 *
 * Checks for valid Bearer token in Authorization header.
 * Returns 401 if token is missing or invalid.
 * Can be disabled by setting AUTH_ENABLED environment variable to false or omitting it.
 */
export const authMiddleware = async (request: Request, env: Env, _ctx: ExecutionContext) => {
	// Check if authentication is enabled via environment variable
	// Default is disabled (permissive) - must explicitly set to 'true' to enable
	const authEnabled = isAuthEnabled(env.AUTH_ENABLED);

	if (!authEnabled) {
		console.debug('Authentication disabled via AUTH_ENABLED flag');
		return; // Pass through without authentication
	}

	console.debug('Authentication enabled - validating JWT token');
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

/**
 * Parse AUTH_ENABLED environment variable as boolean
 * @param value - Environment variable value
 * @returns true only if value is exactly 'true', false otherwise
 */
const isAuthEnabled = (value: string | undefined): boolean => {
	const ENABLED_VALUE = 'true';
	return value === ENABLED_VALUE;
};
