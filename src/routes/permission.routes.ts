import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { permissionController } from '../controllers/permission.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const createSchema = Joi.object({
    name: Joi.string().max(100).required(),
    module: Joi.string().required(),
    action: Joi.string().required(),
    description: Joi.string().optional().allow('', null)
});

const updateSchema = Joi.object({
    name: Joi.string().max(100).optional(),
    module: Joi.string().optional(),
    action: Joi.string().optional(),
    description: Joi.string().optional().allow('', null)
});

/**
 * @swagger
 * tags:
 *   - name: Permissions
 *     description: Permission management endpoints
 */

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: Get permissions (supports filters & pagination)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authMiddleware, permissionController.getAllPermissions.bind(permissionController));

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authMiddleware, permissionController.getPermissionById.bind(permissionController));

/**
 * @swagger
 * /api/v1/permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authMiddleware, validateRequest(createSchema), permissionController.createPermission.bind(permissionController));

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   put:
 *     summary: Update a permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authMiddleware, validateRequest(updateSchema), permissionController.updatePermission.bind(permissionController));

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   delete:
 *     summary: Delete a permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authMiddleware, permissionController.deletePermission.bind(permissionController));

export default router;
