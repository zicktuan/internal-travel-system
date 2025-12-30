import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { ApiResponseHandler } from "../utils/response";
import { validateCreateCategory, validateUpdateCategory } from "../dto/category.dto";
import logger from "../utils/logger";
import { BadRequestException } from "../exceptions/app.exception";

export class CategoryController {
    private categoryService = new CategoryService();

    async create(req: Request, res: Response): Promise<void> {
        try {
            const error = validateCreateCategory(req.body || {});
            if (error) {
                throw new BadRequestException(error);
            }

            const category = await this.categoryService.create(req.body);
            ApiResponseHandler.success(res, 'Category created successfully', category, 201);
        } catch (error) {
            logger.error('Create category error:', error);
            throw error;
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id || '0', 10);
            if (isNaN(id) || id <= 0) {
                throw new BadRequestException('Invalid category ID');
            }

            const error = validateUpdateCategory(req.body || {});
            if (error) {
                throw new BadRequestException(error);
            }

            const category = await this.categoryService.update(id, req.body);
            ApiResponseHandler.success(res, 'Category updated successfully', category);
        } catch (error) {
            logger.error('Update category error:', error);
            throw error;
        }
    }

    async getOne(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id || '0', 10);
            if (isNaN(id) || id <= 0) {
                throw new BadRequestException('Invalid category ID');
            }
            const category = await this.categoryService.findOne(id);
            ApiResponseHandler.success(res, 'Category retrieved successfully', category);
        } catch (error) {
            logger.error('Get category error:', error);
            throw error;
        }
    }

    async getAll(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.categoryService.findAll(req.query);
            ApiResponseHandler.success(res, 'Categories retrieved successfully', result);
        } catch (error) {
            logger.error('Get all categories error:', error);
            throw error;
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id || '0', 10);
            if (isNaN(id) || id <= 0) {
                throw new BadRequestException('Invalid category ID');
            }

            await this.categoryService.delete(id);
            ApiResponseHandler.success(res, 'Category deleted successfully');
        } catch (error) {
            logger.error('Delete category error:', error);
            throw error;
        }
    }
}

export const categoryController = new CategoryController();
