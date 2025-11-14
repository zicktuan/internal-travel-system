import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import logger from "../utils/logger";
import { ApiResponseHandler } from "../utils/response";

export class UserController {
    private userService = new UserService();

    /**
     * @swagger
     * /api/v1/users:
     *   post:
     *     summary: Create a new user
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - firstName
     *               - lastName
     *               - roleIds
     *             properties:
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               displayName:
     *                 type: string
     *               roleIds:
     *                 type: array
     *                 items:
     *                   type: number
     *               sendPasswordEmail:
     *                 type: boolean
     *                 default: false
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       403:
     *         description: Forbidden - Insufficient permissions
     *       409:
     *         description: Conflict - Username or email already exists
     */
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const createUserDto: CreateUserDto = req.body;
            const createdById = parseInt(req.user?.userId as string, 10);
            const result = await this.userService.createUser(createUserDto, createdById);

            ApiResponseHandler.success(res, 'User created successfully!', result); 
        } catch (error) {
            logger.error('Create user error:', error);
            throw error
        }
    }

    /**
     * @swagger
     * /api/v1/users:
     *   get:
     *     summary: Get all users
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of users retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/UserResponse'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       403:
     *         description: Forbidden - Insufficient permissions
     */
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();
            ApiResponseHandler.success(res, 'User retrieved successfully', users);
        } catch (error) {
            logger.error('Get all users error:', error);
            throw error;
        }
    }

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   get:
     *     summary: Get user by ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     responses:
     *       200:
     *         description: User retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/UserResponse'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
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

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   put:
     *     summary: Update user
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               displayName:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *               phone:
     *                 type: string
     *               isActive:
     *                 type: boolean
     *               isVerified:
     *                 type: boolean
     *               roleIds:
     *                 type: array
     *                 items:
     *                   type: number
     *     responses:
     *       200:
     *         description: User updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
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

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   delete:
     *     summary: Delete user
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     responses:
     *       200:
     *         description: User deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       403:
     *         description: Forbidden - Cannot delete super admin or own account
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
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

    /**
     * @swagger
     * /api//v1/users/{id}/reset-password:
     *   post:
     *     summary: Reset user password
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - newPassword
     *             properties:
     *               newPassword:
     *                 type: string
     *                 minLength: 6
     *     responses:
     *       200:
     *         description: Password reset successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         $ref: '#/components/responses/ValidationError'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
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

    /**
     * @swagger
     * /api/v1/users/{id}/unlock:
     *   post:
     *     summary: Unlock user account
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     responses:
     *       200:
     *         description: User unlocked successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       404:
     *         $ref: '#/components/responses/NotFoundError'
     */
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