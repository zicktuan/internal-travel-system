import { AppDataSource } from "../config/database";
import { Location } from "../models/location.entity";
import { ILike, In, IsNull, Repository } from "typeorm";
// import logger from "../utils/logger";

export class LocationService {
    private locationRepository: Repository<Location>

    constructor() {
        this.locationRepository = AppDataSource.getRepository(Location);
    }

    async findAll(query: any): Promise<{ data: Location[], total: number, page: number, limit: number, totalPages: number }> {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.name) {
            where.name = ILike(`%${query.name}%`);
        }

        if (query.locationCode) {
            where.locationCode = query.locationCode;
        }

        if (query.locationType) {
            where.locationType = query.locationType;
        }

        if (!query.name && !query.locationCode && !query.locationType) {
            where.parentId = 0;
        }

        const [data, total] = await this.locationRepository.findAndCount({
            where: (!query.name && !query.locationCode && !query.locationType) ? [
                { parentId: 0, ...where },
                { parentId: IsNull(), ...where }
            ] : where,
            skip,
            take: limit,
            order: { name: 'ASC' }
        });

        if (data.length > 0) {
            await this.fetchDescendants(data);
        }

        const result = {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };

        return result;
    }

    private async fetchDescendants(locations: Location[]): Promise<void> {
        if (locations.length === 0) return;

        const locationIds = locations.map(loc => loc.id);
        const children = await this.locationRepository.find({
            where: { parentId: In(locationIds) },
            order: { name: 'ASC' }
        });

        if (children.length > 0) {
            locations.forEach(parent => {
                parent.children = children.filter(child => child.parentId === parent.id);
            });

            await this.fetchDescendants(children);
        }
    }
}
