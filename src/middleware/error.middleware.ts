import { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/app.exception";
import { ApiResponseHandler } from "../utils/response";
import logger from '../utils/logger';

export const errorMiddlewareHandler = (
    error: Error | AppException,
    req: Request,
    res: Response,
    next: NextFunction
) : void => {
    logger.error('Error caught by middleware:', error);

    if (error.name === 'ValidationError') {
        const errors = Object.values((error as any).errors).map((err: any) => ({
            field: err.path,
            message: err.message
        }));

        ApiResponseHandler.error(
            res,
            "Validation Error",
            422,
            errors
        );

        return;
    }

    if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        ApiResponseHandler.error(
            res,
            'Resource already exists',
            409
        );
        return;
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        ApiResponseHandler.error(
            res,
            'Invalid token',
            401
        );
        return;
    }

    if (error.name === 'TokenExpiredError') {
        ApiResponseHandler.error(
            res,
            'Token expired',
            401
        );
        return;
    }

    // Custom AppException
    if (error instanceof AppException) {
        ApiResponseHandler.error(
            res,
            error.message,
            error.statusCode
        );
        return;
    }

    // Default to 500 server error
    ApiResponseHandler.error(
        res,
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        500
    );
}

export const notFoundHandler = (req: Request, res: Response): void => {
    ApiResponseHandler.error(
        res,
        `Route ${req.originalUrl} not found`,
        404
    );
};