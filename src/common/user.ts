export interface UserQueryFilters {
    isActive?: boolean;
    isVerified?: boolean;
    isLocked?: boolean;
    search?: string;
    roleIds?: number[];
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface BulkOperationResult {
    success: number;
    failed: number;
    errors: Array<{ id: number; error: string }>;
}