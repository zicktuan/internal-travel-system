// Custom validation logic replaced Joi

export class CategoryDto {
    name!: string;
    parentId?: number;

    constructor(data?: Partial<CategoryDto>) {
        if (data) {
            Object.assign(this, data);
        }
    }
}

export const validateCreateCategory = (data: any): string | null => {
    if (!data.name || typeof data.name !== 'string' || data.name.length > 255) {
        return 'Name is required and must be a string';
    }

    if (data.parentId !== undefined && data.parentId !== null) {
        if (typeof data.parentId !== 'number' || data.parentId < 0) {
            return 'Parent ID must be a non-negative integer';
        }
    }

    return null;
};

export const validateUpdateCategory = (data: any): string | null => {
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.length > 255) {
            return 'Name must be a string';
        }
    }

    if (data.parentId !== undefined && data.parentId !== null) {
        if (typeof data.parentId !== 'number' || data.parentId < 0) {
            return 'Parent ID must be a non-negative integer';
        }
    }
    return null;
};
