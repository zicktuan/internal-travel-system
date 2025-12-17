import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { UnauthorizedException } from "../exceptions/app.exception";
import { verifyToken } from "../utils/jwt";
import { AppDataSource } from "../config/database";
import { User } from "../models/user.model";

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Access token is required');
        }

        const token = authHeader.substring(7, authHeader.length);

        const decoded = verifyToken(token);

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: parseInt(decoded.userId) },
            relations: ['roles', 'roles.permissions']
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        if (user.isLocked) {
            throw new UnauthorizedException('Account is locked');
        }

        const permissions = user.roles.flatMap(role =>
            role.permissions?.map(p => p.name) || []
        );

        const roles = user.roles.map(role => role.name);

        (req as any).user = {
            id: user.id,
            userId: user.id,
            username: user.username,
            email: user.email,
            roles: roles,
            permissions: permissions,
            isActive: user.isActive,
            isVerified: user.isVerified
        };

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        next(new UnauthorizedException('Invalid or expired token'));
    }
}

export const authMiddleware = authenticate;