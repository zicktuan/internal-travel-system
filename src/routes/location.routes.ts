import { Router } from "express";
import { locationController } from "../controllers/location.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Locations
 *     description: Location management endpoints
 */

/**
 * @swagger
 * /api/v1/locations:
 *   get:
 *     summary: Get all locations
 *     description: Retrieve a list of locations with hierarchical structure (Vietnam -> Province -> District).
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by location name
 *       - in: query
 *         name: locationCode
 *         schema:
 *           type: string
 *         description: Filter by location code
 *       - in: query
 *         name: locationType
 *         schema:
 *           type: string
 *         description: Filter by location type
 *     responses:
 *       200:
 *         description: List of locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', locationController.getAll.bind(locationController));

export default router;
