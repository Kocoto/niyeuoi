import crypto from 'crypto';
import type { AuthRole } from './authToken';

export type PrivateAccessScope = 'location-private';

interface PrivateAccessPayload {
    role: AuthRole;
    scope: PrivateAccessScope;
    exp: number;
}

export const PRIVATE_ACCESS_TTL_MS = 1000 * 60 * 2;

const TOKEN_SECRET = process.env['AUTH_TOKEN_SECRET'] || process.env['PIN'] || 'niyeuoi-dev-secret';

function encodeBase64Url(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string): string {
    return crypto.createHmac('sha256', TOKEN_SECRET).update(value).digest('base64url');
}

export function createPrivateAccessToken(role: AuthRole, scope: PrivateAccessScope, ttlMs = PRIVATE_ACCESS_TTL_MS) {
    const payload: PrivateAccessPayload = {
        role,
        scope,
        exp: Date.now() + ttlMs,
    };

    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload);

    return {
        token: `${encodedPayload}.${signature}`,
        expiresAt: payload.exp,
    };
}

export function readPrivateAccessToken(token: string, expectedScope: PrivateAccessScope): PrivateAccessPayload | null {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
        return null;
    }

    const expectedSignature = sign(encodedPayload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (actualBuffer.length !== expectedBuffer.length) {
        return null;
    }

    if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(decodeBase64Url(encodedPayload)) as PrivateAccessPayload;

        if (payload.exp < Date.now()) {
            return null;
        }

        if (payload.scope !== expectedScope) {
            return null;
        }

        if (payload.role !== 'boyfriend') {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}
