import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { roleController } from '../controllers/role.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const createRoleSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(255).optional().allow('', null),
    isSystem: Joi.boolean().optional().default(false),
    permissionIds: Joi.array().items(Joi.number()).optional()
});

const updateRoleSchema = Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(255).optional().allow('', null),
    permissionIds: Joi.array().items(Joi.number()).optional(),
    isSystem: Joi.boolean().optional()
});

/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: Role management endpoints
 */

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isSystem:
 *                 type: boolean
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: number
 */
router.post('/', authMiddleware, validateRequest(createRoleSchema), roleController.createRole.bind(roleController));

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get roles (supports filters & pagination)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: permission
 *         schema:
 *           type: string
 *       - in: query
 *         name: isSystem
 *         schema:
 *           type: boolean
 */
router.get('/', authMiddleware, roleController.getAllRoles.bind(roleController));

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', authMiddleware, roleController.getRoleById.bind(roleController));

/**
 * @swagger
 * /api/v1/roles/{id}/users:
 *   get:
 *     summary: Get users assigned to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id/users', authMiddleware, roleController.getRoleUsers.bind(roleController));

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put('/:id', authMiddleware, validateRequest(updateRoleSchema), roleController.updateRole.bind(roleController));

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/:id', authMiddleware, roleController.deleteRole.bind(roleController));

export default router;
