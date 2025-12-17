import { EntityManager, ObjectLiteral } from "typeorm";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import { UpdateUserDto } from "../dto/user.dto";
import { BadRequestException, ForbiddenException } from "../exceptions/app.exception";

export class AuthHelper {
    
    static async validateUserInput(username: string, email: string): Promise<void> {
        if (!username || !email) {
            throw new BadRequestException('Username and email are required');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new BadRequestException('Invalid email format');
        }

        if (username.length < 3 || username.length > 50) {
            throw new BadRequestException('Username must be between 3 and 50 characters');
        }
    }

    static validateUserModification(user: User, modifier: User): void {
        if (user.username === 'superadmin' && modifier.username !== 'superadmin') {
            throw new ForbiddenException('Cannot modify super admin user');
        }
    }

    static validateSortField(field: string): string {
        const allowedFields = ['id', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'lastLoginAt'];
        return allowedFields.includes(field) ? field : 'createdAt';
    }

    static applyUserUpdates(user: User, updates: Partial<UpdateUserDto>): void {
        const updateMap: Record<string, (value: any) => void> = {
            firstName: (val) => user.firstName = val?.trim(),
            lastName: (val) => user.lastName = val?.trim(),
            displayName: (val) => user.displayName = val?.trim(),
            email: (val) => user.email = val?.toLowerCase().trim(),
            phone: (val) => user.phone = val?.trim(),
            isActive: (val) => user.isActive = val,
            isVerified: (val) => user.isVerified = val
        };

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && updateMap[key]) {
                updateMap[key](value);
            }
        });
    }

    static applyQueryFilters(queryBuilder: any, filters?: any): void {
        if (!filters) return;

        const conditions: string[] = [];
        const parameters: any = {};

        if (filters.isActive !== undefined) {
            conditions.push('user.isActive = :isActive');
            parameters.isActive = filters.isActive;
        }

        if (filters.isVerified !== undefined) {
            conditions.push('user.isVerified = :isVerified');
            parameters.isVerified = filters.isVerified;
        }

        if (filters.isLocked !== undefined) {
            conditions.push('user.isLocked = :isLocked');
            parameters.isLocked = filters.isLocked;
        }

        if (filters.search) {
            conditions.push(
                `(user.username ILIKE :search OR 
                 user.email ILIKE :search OR 
                 user.displayName ILIKE :search OR
                 CONCAT(user.firstName, ' ', user.lastName) ILIKE :search)`
            );
            parameters.search = `%${filters.search}%`;
        }

        if (filters.roleIds?.length) {
            conditions.push('roles.id IN (:...roleIds)');
            parameters.roleIds = filters.roleIds;
        }

        if (filters.createdAfter) {
            conditions.push('user.createdAt >= :createdAfter');
            parameters.createdAfter = filters.createdAfter;
        }

        if (filters.createdBefore) {
            conditions.push('user.createdAt <= :createdBefore');
            parameters.createdBefore = filters.createdBefore;
        }

        if (conditions.length > 0) {
            queryBuilder.where(conditions.join(' AND '), parameters);
        }
    }

    static async getUserReference(userId: number, entityManager: EntityManager): Promise<User | null> {
        return await entityManager.findOne(User, {
            where: { id: userId },
            select: ['id', 'username', 'displayName']
        });
    }

    static shouldRetryTransaction(error: any): boolean {
        const retryableMessages = [
            'deadlock',
            'timeout', 
            'connection',
            'try again',
            'serialization'
        ];

        const errorMessage = error.message?.toLowerCase() || '';
        return retryableMessages.some(msg => errorMessage.includes(msg));
    }

    static generateQueryCacheKey(prefix: string, params: any): string {
        const paramString = JSON.stringify(params);
        let hash = 0;
        for (let i = 0; i < paramString.length; i++) {
            const char = paramString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; 
        }
        return `${prefix}_${hash}`;
    }

    static validatePagination(page: number, limit: number, maxLimit: number = 100): { page: number; limit: number; skip: number } {
        const validPage = Math.max(1, page);
        const validLimit = Math.min(Math.max(1, limit), maxLimit);
        const skip = (validPage - 1) * validLimit;

        return {
            page: validPage,
            limit: validLimit,
            skip
        };
    }

    static async processBatchOperations<T>(
        items: T[],
        processor: (item: T) => Promise<void>,
        batchSize: number = 10
    ): Promise<void> {
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.all(batch.map(item => processor(item)));
        }
    }

    static getUserCacheKey(userId: number): string {
        return `user_${userId}`;
    }

    static getRoleCacheKey(roleId: number): string {
        return `role_${roleId}`;
    }

    static getQueryCacheKey(operation: string, filters: any): string {
        return `query_${operation}_${AuthHelper.generateQueryCacheKey('filters', filters)}`;
    }
}

export const validateUserInput = AuthHelper.validateUserInput;
export const validateUserModification = AuthHelper.validateUserModification;
export const applyUserUpdates = AuthHelper.applyUserUpdates;
export const applyQueryFilters = AuthHelper.applyQueryFilters;