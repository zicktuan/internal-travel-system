import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../exceptions/app.exception.js';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new ValidationException('Validation failed', errors);
    }

    req.body = value;
    next();
  };
};