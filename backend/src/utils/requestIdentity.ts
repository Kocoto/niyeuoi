import type { Request } from 'express';

import { getBearerToken, readSessionToken } from './authToken';
import type { AuthRole } from './authToken';

type EntityWithCreator = {
    createdBy?: AuthRole;
};

export function isAuthRole(value: unknown): value is AuthRole {
    return value === 'boyfriend' || value === 'girlfriend';
}

export function getRequestAuthRole(req: Request): AuthRole | undefined {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
        return undefined;
    }

    return readSessionToken(token)?.role;
}

export function resolveCreatePayload<T extends EntityWithCreator>(req: Request, body: Partial<T>): Partial<T> {
    const sessionRole = getRequestAuthRole(req);
    const createdBy = sessionRole ?? (isAuthRole(body.createdBy) ? body.createdBy : undefined);

    if (createdBy) {
        return {
            ...body,
            createdBy,
        };
    }

    const { createdBy: _ignored, ...rest } = body;
    return rest as Partial<T>;
}

export function resolveUpdatePayload<T extends EntityWithCreator>(body: Partial<T>): Partial<T> {
    if (isAuthRole(body.createdBy)) {
        return body;
    }

    const { createdBy: _ignored, ...rest } = body;
    return rest as Partial<T>;
}
