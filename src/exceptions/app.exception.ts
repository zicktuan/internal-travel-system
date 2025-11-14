export class AppException extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public errors?: any[];

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true, errors?: any[]) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundException extends AppException {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}

export class BadRequestException extends AppException {
    constructor(message: string = 'Bad request') {
        super(message, 400);
    }
}

export class UnauthorizedException extends AppException {
    constructor(message: string = 'Unauthorized') {
        super(message, 401)
    }
}

export class ForbiddenException extends AppException {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

export class ValidationException extends AppException {
    constructor(message: string = 'Validation failed', errors?: any[]) {
        super(message, 422, true, errors);
    }
}

export class ConflictException extends AppException {
    constructor(message: string = 'Conflict occurred') {
        super(message, 409);
    }
}

