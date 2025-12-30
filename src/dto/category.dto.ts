// Custom validation logic replaced Joi

export class CategoryDto {
    name!: string;
    parentId?: number;
    slug!: string;
    serviceType?: string;

    constructor(data?: Partial<CategoryDto>) {
        if (data) {
            Object.assign(this, data);
        }
    }
}

export const validateCreateCategory = (data: any): string | null => {
    if (!data.name || typeof data.name !== 'string' || data.name.length > 255) {
        return 'Name is required and must be a string (max 255 chars)';
    }
    if (!data.slug || typeof data.slug !== 'string' || data.slug.length > 255) {
        return 'Slug is required and must be a string (max 255 chars)';
    }
    if (data.parentId !== undefined && data.parentId !== null) {
        if (typeof data.parentId !== 'number' || data.parentId < 0) {
            return 'Parent ID must be a non-negative integer';
        }
    }
    if (data.serviceType !== undefined && data.serviceType !== null && data.serviceType !== '') {
        if (typeof data.serviceType !== 'string' || data.serviceType.length > 50) {
            return 'Service Type must be a string (max 50 chars)';
        }
    }
    return null;
};

export const validateUpdateCategory = (data: any): string | null => {
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.length > 255) {
            return 'Name must be a string (max 255 chars)';
        }
    }
    if (data.slug !== undefined) {
        if (typeof data.slug !== 'string' || data.slug.length > 255) {
            return 'Slug must be a string (max 255 chars)';
        }
    }
    if (data.parentId !== undefined && data.parentId !== null) {
        if (typeof data.parentId !== 'number' || data.parentId < 0) {
            return 'Parent ID must be a non-negative integer';
        }
    }
    if (data.serviceType !== undefined && data.serviceType !== null && data.serviceType !== '') {
        if (typeof data.serviceType !== 'string' || data.serviceType.length > 50) {
            return 'Service Type must be a string (max 50 chars)';
        }
    }
    return null;
};
