import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import logger from "../utils/logger";
import { ApiResponseHandler } from "../utils/response";
import { UnauthorizedException } from "../exceptions/app.exception";

export class UserController {
    private userService = new UserService();

    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const createUserDto: CreateUserDto = req.body;
            const createdById = parseInt(req.user?.userId as string, 10);
            if (Number.isNaN(createdById)) throw new UnauthorizedException('Invalid user ID');
            const result = await this.userService.createUser(createUserDto, createdById);

            ApiResponseHandler.success(res, 'User created successfully!', result); 
        } catch (error) {
            logger.error('Create user error:', error);
            throw error
        }
    }

    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const pagination = {
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
                sortBy: req.query.sortBy as string | undefined,
                sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined
            };

            const filters: any = {};
            if (req.query.username) filters.username = req.query.username as string;
            if (req.query.email) filters.email = req.query.email as string;
            if (req.query.role) filters.role = req.query.role as string;

            const result = await this.userService.getAllUser(pagination as any, filters);
            ApiResponseHandler.success(res, 'User retrieved successfully', result);
        } catch (error) {
            logger.error('Get all users error:', error);
            throw error;
        }
    }

    
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const user = await this.userService.getUserById(id);

            ApiResponseHandler.success(res, 'User retrieved successfully!', user);
        } catch (error) {
            logger.error('Get user by ID error:', error);
            throw error;
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const updateUserDto: UpdateUserDto = req.body;
            const updatedById = parseInt(req.user?.userId as string, 10);
            const result = await this.userService.updateUser(id, updateUserDto, updatedById);

            ApiResponseHandler.success(res, 'User updated successfully!', result);
        } catch (error) {
            logger.error('Update user error:', error);
            throw error;
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const deletedById = parseInt(req.user?.userId as string, 10);
            await this.userService.deleteUser(id, deletedById);

            ApiResponseHandler.success(res, 'User deleted successfully!');
        } catch (error) {
            logger.error('Delete user error:', error);
            throw error;
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const { newPassword } = req.body;
            const updatedById = parseInt(req.user?.userId as string, 10);
            await this.userService.resetPassword(id, newPassword, updatedById);

            ApiResponseHandler.success(res, 'Password reset successfully!');
        } catch (error) {
            logger.error('Reset password error:', error);
            throw error;
        }
    }

    async unlockUser(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string, 10);
            const updatedById = parseInt(req.user?.userId as string, 10);
            await this.userService.unlockUser(id, updatedById);

            ApiResponseHandler.success(res, 'User unlocked successfully!');
        } catch (error) {
            logger.error('Unlock user error:', error);
            throw error;
        }
    }

}

export const userController = new UserController();