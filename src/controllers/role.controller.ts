import { Request, Response } from "express";
import { RoleService } from "../services/role.service";
import logger from "../utils/logger";
import { ApiResponseHandler } from "../utils/response";
import { CreateRoleDto, UpdateRoleDto } from "../dto/role.dto";
import { UnauthorizedException } from "../exceptions/app.exception";

export class RoleController {
    private roleService = new RoleService();

    /**
     * GET /api/v1/roles
     * Supports optional query params: page, limit, sortBy, sortOrder, name, permission, isSystem
     */
    async getAllRoles(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.user?.userId as string, 10);

            const pagination = {
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined
            };

            const filters: any = {};
            if (req.query.name) filters.name = req.query.name as string;
            if (req.query.permission) filters.permission = req.query.permission as string;
            if (req.query.isSystem !== undefined) {
                const v = (req.query.isSystem as string).toLowerCase();
                filters.isSystem = v === 'true' || v === '1';
            }

            const result = await this.roleService.getAllRoles(userId, filters, pagination as any);
            ApiResponseHandler.success(res, 'Roles retrieved successfully', result);
        } catch (error) {
            logger.error('Get all roles error:', error);
            throw error;
        }
    }

    async createRole(req: Request, res: Response): Promise<void> {
        try {
            const dto: CreateRoleDto = req.body;
            const createdBy = parseInt(req.user?.userId as string, 10);
            if (Number.isNaN(createdBy)) throw new UnauthorizedException('Invalid user ID');

            const result = await this.roleService.createRole(dto, createdBy);
            ApiResponseHandler.success(res, 'Role created successfully', result);
        } catch (error) {
            logger.error('Create role error:', error);
            throw error;
        }
    }

    async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const userId = parseInt(req.user?.userId as string, 10);
            const result = await this.roleService.getRoleById(id, userId);
            ApiResponseHandler.success(res, 'Role retrieved successfully', result);
        } catch (error) {
            logger.error('Get role by id error:', error);
            throw error;
        }
    }

    async getRoleUsers(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const userId = parseInt(req.user?.userId as string, 10);
            const users = await this.roleService.getRoleUsers(id, userId);
            ApiResponseHandler.success(res, 'Role users retrieved successfully', users);
        } catch (error) {
            logger.error('Get role users error:', error);
            throw error;
        }
    }

    async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const dto: UpdateRoleDto = req.body;
            const updatedBy = parseInt(req.user?.userId as string, 10);
            const result = await this.roleService.updateRole(id, dto, updatedBy);
            ApiResponseHandler.success(res, 'Role updated successfully', result);
        } catch (error) {
            logger.error('Update role error:', error);
            throw error;
        }
    }

    async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const deletedBy = parseInt(req.user?.userId as string, 10);
            await this.roleService.deleteRole(id, deletedBy);
            ApiResponseHandler.success(res, 'Role deleted successfully');
        } catch (error) {
            logger.error('Delete role error:', error);
            throw error;
        }
    }
}

export const roleController = new RoleController();
