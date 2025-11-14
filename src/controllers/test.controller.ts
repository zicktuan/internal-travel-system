// src/controllers/test.controller.ts
import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/response.js';
import { 
  NotFoundException, 
  BadRequestException, 
  ValidationException 
} from '../exceptions/app.exception.js';

export const testSuccess = (req: Request, res: Response): void => {
  ApiResponseHandler.success(
    res,
    'Operation completed successfully',
    { id: 1, name: 'Test Data' }
  );
};

export const testCreated = (req: Request, res: Response): void => {
  ApiResponseHandler.created(
    res,
    'Resource created successfully',
    { id: 1, name: 'New Resource' }
  );
};

export const testError = (req: Request, res: Response): void => {
  throw new NotFoundException('User not found');
};

export const testValidationError = (req: Request, res: Response): void => {
  throw new ValidationException('Validation failed', [
    { field: 'email', message: 'Email is required' },
    { field: 'password', message: 'Password must be at least 6 characters' }
  ]);
};

export const testServerError = (req: Request, res: Response): void => {
  throw new Error('Unexpected server error');
};