import { AppDataSource } from "../config/database";
import { Category } from "../models/category.entity";
import { CategoryDto } from "../dto/category.dto";
import { NotFoundException } from "../exceptions/app.exception";
import { ILike, In, IsNull } from "typeorm";

export class CategoryService {
    private categoryRepository = AppDataSource.getRepository(Category);

    async create(data: CategoryDto): Promise<Category> {
        const category = this.categoryRepository.create(data);
        return await this.categoryRepository.save(category);
    }

    async findAll(query: any): Promise<{ data: Category[], total: number, page: number, limit: number, totalPages: number }> {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.name) {
            where.name = ILike(`%${query.name}%`);
        }

        if (query.serviceType) {
            where.serviceType = query.serviceType;
        }

        if (!query.name && !query.serviceType) {
            where.parentId = 0;
        }

        const [data, total] = await this.categoryRepository.findAndCount({
            where: (!query.name && !query.serviceType) ? [
                { parentId: 0, ...where },
                { parentId: IsNull(), ...where }
            ] : where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' }
        });

        if (data.length > 0) {
            const parentIds = data.map(cat => cat.id);
            const children = await this.categoryRepository.find({
                where: { parentId: In(parentIds) },
                order: { createdAt: 'DESC' }
            });

            data.forEach(parent => {
                parent.children = children.filter(child => child.parentId === parent.id);
            });
        }

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: number): Promise<Category> {
        return await this.checkCategoryExist(id);
    }

    async update(id: number, data: Partial<CategoryDto>): Promise<Category> {
        const category = await this.checkCategoryExist(id);
        Object.assign(category, data);
        return await this.categoryRepository.save(category);
    }

    async delete(id: number): Promise<void> {
        const category = await this.checkCategoryExist(id);
        await this.categoryRepository.remove(category);
    }

    private async checkCategoryExist(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category || category == null) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
}
