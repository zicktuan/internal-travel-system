import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const createUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required().messages({
        'string.empty': 'Username is required',
        'any.required': 'Username is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email must be valid',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    firstName: Joi.string().max(50).required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().max(50).required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required'
    }),
    displayName: Joi.string().max(100).optional(),
    roleIds: Joi.array().items(Joi.number()).min(1).required().messages({
        'array.min': 'At least one role is required',
        'any.required': 'Role IDs are required'
    }),
    sendPasswordEmail: Joi.boolean().optional().default(false)
});

const updateUserSchema = Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    displayName: Joi.string().max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(20).optional(),
    isActive: Joi.boolean().optional(),
    isVerified: Joi.boolean().optional(),
    roleIds: Joi.array().items(Joi.number()).min(1).optional()
});

const resetPasswordSchema = Joi.object({
    newPassword: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    })
});

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management endpoints
 */

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
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [1, 2]
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
 *       409:
 *         description: Conflict - Username or email already exists
 */
router.post('/', authMiddleware, validateRequest(createUserSchema), userController.createUser.bind(userController));

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
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authMiddleware, userController.getAllUsers.bind(userController));

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
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', authMiddleware, userController.getUserById.bind(userController));

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
router.put('/:id', authMiddleware, validateRequest(updateUserSchema), userController.updateUser.bind(userController));

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
router.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

/**
 * @swagger
 * /api/v1/users/{id}/reset-password:
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
 *                 minLength: 8
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
router.post('/:id/reset-password', authMiddleware, validateRequest(resetPasswordSchema), userController.resetPassword.bind(userController));

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
router.post('/:id/unlock', authMiddleware, userController.unlockUser.bind(userController));

export default router;
