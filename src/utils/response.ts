import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../type/api';

export class ApiResponseHandler {
    static success<T>(
        res: Response,
        message: string,
        data?: T,
        statusCode: number = 200
    ) : Response {
        const response: ApiResponse<T> = {
            status: 'success',
            message,
            statusCode,
            data,
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(response);
    }

    static created<T> (
        res: Response,
        message: string,
        data?:T
    ) : Response {
        return this.success<T>(res, message, data, 201);
    }

    static paginated<T>(
        res: Response,
        message: string,
        data: T,
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        }
    ) : Response {
        const response: PaginatedResponse<T> = {
            status: 'success',
            message,
            statusCode: 200,
            data,
            pagination,
            timestamp: new Date().toISOString(),
        };

        return res.status(200).json(response);
    }

    static error(
        res: Response,
        message: string,
        statusCode: number = 500,
        errors?: any[]
    ) : Response {
        
        const response: ApiResponse<null> = {
            status: 'error',
            message,
            statusCode,
            timestamp: new Date().toISOString(),
        };

        if (errors && errors.length > 0) {
            (response as any).errors = errors;
        }

        return res.status(statusCode).json(response);
    }
}

