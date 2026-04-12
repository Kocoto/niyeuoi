import crypto from 'crypto';

export type AuthRole = 'boyfriend' | 'girlfriend';

export interface AuthUser {
    role: AuthRole;
    displayName: string;
}

interface SessionPayload extends AuthUser {
    exp: number;
}

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;
const TOKEN_SECRET = process.env['AUTH_TOKEN_SECRET'] || process.env['PIN'] || 'niyeuoi-dev-secret';

const ROLE_LABELS: Record<AuthRole, string> = {
    boyfriend: 'Duoc',
    girlfriend: 'Ni',
};

function encodeBase64Url(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string): string {
    return crypto.createHmac('sha256', TOKEN_SECRET).update(value).digest('base64url');
}

export function getDisplayName(role: AuthRole): string {
    return ROLE_LABELS[role];
}

export function getExpectedPin(role: AuthRole): string | null {
    if (role === 'boyfriend') {
        return process.env['BOYFRIEND_PIN'] || process.env['PIN'] || null;
    }

    return process.env['GIRLFRIEND_PIN'] || null;
}

export function createSessionToken(role: AuthRole): string {
    const payload: SessionPayload = {
        role,
        displayName: getDisplayName(role),
        exp: Date.now() + THIRTY_DAYS_IN_MS,
    };

    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
}

export function readSessionToken(token: string): AuthUser | null {
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
        const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
        if (!payload.exp || payload.exp < Date.now()) {
            return null;
        }

        if (payload.role !== 'boyfriend' && payload.role !== 'girlfriend') {
            return null;
        }

        return {
            role: payload.role,
            displayName: payload.displayName || getDisplayName(payload.role),
        };
    } catch {
        return null;
    }
}

export function getBearerToken(header?: string): string | null {
    if (!header) {
        return null;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
}
