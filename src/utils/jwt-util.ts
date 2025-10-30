import { importSPKI, type JWTPayload, jwtVerify } from 'jose';

/**
 * Verify JWT token with signature validation
 * @param token - JWT token string to verify
 * @param env - Environment configuration object
 * @returns Promise resolving to verification result with payload or error
 */
export const verifyJWT = async (token: string, env: Env): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> => {
	// Input validation
	if (!token || typeof token !== 'string' || token.trim() === '') {
		return { valid: false, error: 'Invalid token format' };
	}

	if (!env || typeof env !== 'object') {
		return { valid: false, error: 'Invalid environment configuration' };
	}

	try {
		const expectedIssuer = env.JWT_ISSUER;
		if (!expectedIssuer) {
			return { valid: false, error: 'JWT issuer not configured' };
		}

		const publicKeyPem = env.PUBLIC_KEY;
		if (!publicKeyPem) {
			return { valid: false, error: 'Public key not found' };
		}

		const publicKey = await importSPKI(publicKeyPem, 'RS256');

		const { payload } = await jwtVerify(token, publicKey, {
			issuer: expectedIssuer,
			algorithms: ['RS256'],
		});

		console.log('JWT signature validation passed');
		return { valid: true, payload };
	} catch (error) {
		console.error('JWT verification error:', error);
		return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
};
