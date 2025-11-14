import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import { UnauthorizedException } from "../exceptions/app.exception";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Access token is required');
        }

        const token = authHeader.substring(7, authHeader.length);

        const decoded = verifyToken(token);

        (req as any).user = decoded;

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        next(new UnauthorizedException('Invalid or expired token'));
    }
}