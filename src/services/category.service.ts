import { AppDataSource } from "../config/database";
import { Category } from "../models/category.entity";
import { CategoryDto } from "../dto/category.dto";
import { NotFoundException } from "../exceptions/app.exception";
import { ILike, In, IsNull, Repository } from "typeorm";
import { GeneralHelper } from "../helper/general.helper";
import { ServiceType } from "../common/enums";

export class CategoryService {
    private categoryRepository: Repository<Category>
    private generalHelper: GeneralHelper;

    constructor() {
        this.categoryRepository = AppDataSource.getRepository(Category);
        this.generalHelper = new GeneralHelper();
    }

    async create(data: CategoryDto): Promise<Category> {
        const slug = this.generalHelper.generateSlug(data.name);
        const category = this.categoryRepository.create({
            ...data,
            slug,
            serviceType: ServiceType.TOUR
        });
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
            await this.fetchDescendants(data);
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

    private async fetchDescendants(categories: Category[]): Promise<void> {
        if (categories.length === 0) return;

        const categoryIds = categories.map(cat => cat.id);
        const children = await this.categoryRepository.find({
            where: { parentId: In(categoryIds) },
            order: { createdAt: 'DESC' }
        });

        if (children.length > 0) {
            categories.forEach(parent => {
                parent.children = children.filter(child => child.parentId === parent.id);
            });

            await this.fetchDescendants(children);
        }
    }
}
