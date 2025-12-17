import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { ForbiddenException } from "../exceptions/app.exception";

/**
 * Middleware check access permission
 * @param permissions List permissions required
 * @param roles List role required
 */
export const authorize = (options?: {
    permissions?: string[];
    roles?: string[];
    requireAllPermissions?: boolean;
}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const user = (req as any).user;

            if (!user) {
                throw new ForbiddenException('User not authenticated');
            }

            if (user.role?.includes('superadmin')) {
                return next();
            }

            const userPermissions = user.permissions || [];
            const userRoles = user.roles || [];

            if (options?.roles && options.roles.length > 0) {
                const hasRequiredRole = options.roles.some(role => 
                    userRoles.includes(role)
                );

                if (!hasRequiredRole) {
                    throw new ForbiddenException('Insufficient role privileges');
                }
            }

            // Check permissions
            if (options?.permissions && options.permissions.length > 0) {
                if (options.requireAllPermissions) {
                    const hasAllPermissions = options.permissions.every(permission =>
                        userPermissions.includes(permission)
                    );

                    if (!hasAllPermissions) {
                        throw new ForbiddenException('Missing required permissions');
                    }
                } else {
                    const hasAnyPermission = options.permissions.some(permission => 
                        userPermissions.includes(permission)
                    );

                    if (!hasAnyPermission) {
                        throw new ForbiddenException('Insufficient permissions');
                    }
                }
            }

            next();

        } catch (err) {
            logger.error('Authorization error:', err);
            next(err);
        }
    }
}

export const requireRole = (...roles: string[]) => {
    return authorize({roles});
}

export const requirePermission = (...permissions: string[]) => {
    return authorize({permissions});
}

export const requireAllPermissions = (...permissions: string[]) => {
    return authorize({
        permissions,
        requireAllPermissions: true
    })
}