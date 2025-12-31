import { Request, Response } from "express";
import { LocationService } from "../services/location.service";
import { ApiResponseHandler } from "../utils/response";
import logger from "../utils/logger";

export class LocationController {
    private locationService: LocationService;

    constructor() {
        this.locationService = new LocationService();
    }

    async getAll(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.locationService.findAll(req.query);
            ApiResponseHandler.success(res, 'Locations retrieved successfully', result);
        } catch (error) {
            logger.error('Get all locations error:', error);
            throw error;
        }
    }
}

export const locationController = new LocationController();
