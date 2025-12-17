import { Request, Response } from 'express';
import logger from '../utils/logger';
import { ApiResponseHandler } from '../utils/response';
import { permissionService } from '../services/permission.service';
import { CreateAndUpdatePermissionDto } from '../dto/permission.dto';
import { UnauthorizedException } from '../exceptions/app.exception';

export class PermissionController {
    async getAllPermissions(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.user?.userId as string, 10);
            if (Number.isNaN(userId)) throw new UnauthorizedException('Invalid user ID');

            const pagination = {
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined
            };

            const filters: any = {};
            if (req.query.name) filters.name = req.query.name as string;
            if (req.query.module) filters.module = req.query.module as string;
            if (req.query.action) filters.action = req.query.action as string;

            const result = await permissionService.getAllPermissions(userId, filters, pagination as any);
            ApiResponseHandler.success(res, 'Permissions retrieved successfully', result);
        } catch (error) {
            logger.error('Get all permissions error:', error);
            throw error;
        }
    }

    async getPermissionById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const userId = parseInt(req.user?.userId as string, 10);
            const result = await permissionService.getPermissionById(id, userId);
            ApiResponseHandler.success(res, 'Permission retrieved successfully', result);
        } catch (error) {
            logger.error('Get permission by id error:', error);
            throw error;
        }
    }

    async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const dto: CreateAndUpdatePermissionDto = req.body;
            const createdBy = parseInt(req.user?.userId as string, 10);
            const result = await permissionService.createPermission(dto, createdBy);
            ApiResponseHandler.success(res, 'Permission created successfully', result);
        } catch (error) {
            logger.error('Create permission error:', error);
            throw error;
        }
    }

    async updatePermission(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const dto: CreateAndUpdatePermissionDto = req.body;
            const updatedBy = parseInt(req.user?.userId as string, 10);
            const result = await permissionService.updatePermission(id, dto, updatedBy);
            ApiResponseHandler.success(res, 'Permission updated successfully', result);
        } catch (error) {
            logger.error('Update permission error:', error);
            throw error;
        }
    }

    async deletePermission(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const deletedBy = parseInt(req.user?.userId as string, 10);
            await permissionService.deletePermission(id, deletedBy);
            ApiResponseHandler.success(res, 'Permission deleted successfully');
        } catch (error) {
            logger.error('Delete permission error:', error);
            throw error;
        }
    }
}

export const permissionController = new PermissionController();
