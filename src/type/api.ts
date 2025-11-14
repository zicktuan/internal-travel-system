export interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    statusCode: number;
    data?: T;
    timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}