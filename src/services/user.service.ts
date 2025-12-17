import { In, Repository, EntityManager } from "typeorm";
import { AppDataSource } from "../config/database";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "../dto/user.dto";
import { BadRequestException, ForbiddenException, NotFoundException } from "../exceptions/app.exception";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import logger from "../utils/logger";
import { validatePasswordStrength, hashPassword } from "../utils/password";
import { AuthHelper } from "../helper/auth.helper";
import { UserHelper } from "../helper/user.helper";
import { CacheHelper } from "../helper/cache.helper";
import { PaginationOptions, UserQueryFilters, BulkOperationResult } from "../common/user";

export class UserService {
    private userRepository: Repository<User>;
    private roleRepository: Repository<Role>;
    private userHelper: UserHelper;
    private cacheHelper: CacheHelper;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.roleRepository = AppDataSource.getRepository(Role);

        const cacheHelper = new CacheHelper();
        this.cacheHelper = cacheHelper;
        this.userHelper = new UserHelper(cacheHelper['roleCache']);
    }

    /**
     * Helper to run a callback inside a transaction and properly commit/rollback/release.
     * Reduces repetition of queryRunner boilerplate.
     */
    private async withTransaction<T>(action: (manager: EntityManager) => Promise<T>): Promise<T> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const result = await action(queryRunner.manager);
            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createUser(createUserDto: CreateUserDto, createdById: number): Promise<UserResponseDto> {
        const { username, email, firstName, lastName, displayName, roleIds, sendPasswordEmail = false } = createUserDto;

        await AuthHelper.validateUserInput(username, email);

        try {
            const rawUsername = username?.trim().toLowerCase();
            const rawEmail = email?.trim().toLowerCase();

            const savedUser = await this.withTransaction(async (manager) => {
                await this.userHelper.checkUserExistenceTransactional(rawUsername, rawEmail, manager);

                const [roles, createdBy, passwordData] = await Promise.all([
                    this.userHelper.getRolesByIdsOptimized(roleIds, manager),
                    AuthHelper.getUserReference(createdById, manager),
                    this.userHelper.generatePasswordData()
                ]);

                if (!createdBy) {
                    throw new NotFoundException('Creator user not found');
                }

                const user = new User({
                    username: rawUsername,
                    email: rawEmail,
                    password: passwordData.hashedPassword,
                    firstName: firstName?.trim(),
                    lastName: lastName?.trim(),
                    displayName: displayName?.trim() || `${firstName} ${lastName}`.trim(),
                    roles,
                    isActive: true,
                    isVerified: false,
                    createdBy,
                    updatedBy: createdBy
                });

                return await manager.save(User, user);
            });

            this.cacheHelper.invalidateUserCache();

            logger.info(`User created: ${username} (ID: ${savedUser.id})`);

            return this.userHelper.mapToUserResponse(savedUser);
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
                throw error;
            }
            logger.error('Unexpected error in createUser:', error);
            throw new BadRequestException('Failed to create user');
        }
    }

    /**
     * Unified fetch for users. If `pagination` is provided the result is paginated,
     * otherwise returns all matching users but still returns pagination metadata
     * (page = 1, limit = total).
     */
    async getAllUser(
        pagination?: PaginationOptions,
        filters?: UserQueryFilters
    ): Promise<{ 
        users: UserResponseDto[]; 
        total: number; 
        page: number; 
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }> {
        const sortBy = AuthHelper.validateSortField(pagination?.sortBy || 'createdAt');
        const sortOrder = pagination?.sortOrder || 'DESC';

        const queryBuilder = this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'roles')
            .leftJoinAndSelect('user.createdBy', 'createdBy')
            .leftJoinAndSelect('user.updatedBy', 'updatedBy');

        AuthHelper.applyQueryFilters(queryBuilder, filters);

        if (pagination && (pagination.page !== undefined || pagination.limit !== undefined)) {
            const { page, limit, skip } = AuthHelper.validatePagination(pagination.page, pagination.limit);

            const [users, total] = await queryBuilder
                .orderBy(`user.${sortBy}`, sortOrder)
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            users.forEach(user => this.cacheHelper.setUserInCache(user));

            const totalPages = Math.ceil(total / limit);

            return {
                users: users.map(user => this.userHelper.mapToUserResponse(user)),
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };
        }

        // No pagination requested: return all matching users with metadata
        const users = await queryBuilder
            .orderBy(`user.${sortBy}`, sortOrder)
            .getMany();

        users.forEach(user => this.cacheHelper.setUserInCache(user));

        const total = users.length;
        const page = 1;
        const limit = total;
        const totalPages = total > 0 ? 1 : 0;

        return {
            users: users.map(user => this.userHelper.mapToUserResponse(user)),
            total,
            page,
            limit,
            totalPages,
            hasNext: false,
            hasPrev: false
        };
    }

    async getUserById(id: number): Promise<UserResponseDto> {
        const cachedUser = this.cacheHelper.getUserFromCache(id);
        if (cachedUser) {
            return this.userHelper.mapToUserResponse(cachedUser);
        }

        const user = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'roles')
            .leftJoinAndSelect('user.createdBy', 'createdBy')
            .leftJoinAndSelect('user.updatedBy', 'updatedBy')
            .where('user.id = :id', { id })
            .select([
                'user',
                'roles',
                'createdBy.id', 'createdBy.username', 'createdBy.displayName',
                'updatedBy.id', 'updatedBy.username', 'updatedBy.displayName'
            ])
            .getOne();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        this.cacheHelper.setUserInCache(user);
        return this.userHelper.mapToUserResponse(user)
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto, updatedById: number): Promise<UserResponseDto> {
        try {
            const updatedUser = await this.withTransaction(async (manager) => {
                const user = await manager.findOne(User, {
                    where: { id },
                    relations: ['roles'],
                    lock: { mode: "pessimistic_write" }
                });

                if (!user) {
                    throw new NotFoundException('User not found');
                }

                const updatedBy = await AuthHelper.getUserReference(updatedById, manager);
                if (!updatedBy) {
                    throw new NotFoundException('Updater user not found');
                }

                AuthHelper.validateUserModification(user, updatedBy);
                AuthHelper.applyUserUpdates(user, updateUserDto);

                if (updateUserDto.roleIds) {
                    user.roles = await this.userHelper.getRolesByIdsOptimized(
                        updateUserDto.roleIds,
                        manager,
                        this.roleRepository
                    );
                }

                user.updatedBy = updatedBy;

                return await manager.save(User, user);
            });

            // Invalidate only the affected user cache
            this.cacheHelper.invalidateUserCache(updatedUser.id);

            logger.info(`User updated (ID: ${id})`);

            return this.userHelper.mapToUserResponse(updatedUser);
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(id: number, deletedById: number): Promise<void> {
        await this.withTransaction(async (manager) => {
            const user = await manager.findOne(User, {
                where: { id },
                select: ['id', 'username']
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const deletedBy = await AuthHelper.getUserReference(deletedById, manager);
            if (!deletedBy) {
                throw new NotFoundException('Deleter user not found');
            }

            if (user.username === 'superadmin') {
                throw new ForbiddenException('Cannot delete super admin user');
            }

            if (user.id === deletedBy.id) {
                throw new ForbiddenException('Cannot delete your own account');
            }

            await manager.remove(User, user);

            // Invalidate the single user cache
            this.cacheHelper.invalidateUserCache(id);
            logger.info(`User deleted by ${deletedBy.username}: ${user.username} (ID: ${id})`);
        });
    }

    async resetPassword(id: number, newPassword: string, updatedById: number): Promise<void> {
        await this.withTransaction(async (manager) => {
            const user = await manager.findOne(User, {
                where: { id },
                select: ['id', 'username', 'password', 'loginAttempts', 'isLocked']
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const updatedBy = await AuthHelper.getUserReference(updatedById, manager);
            if (!updatedBy) {
                throw new NotFoundException('Updater user not found');
            }

            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.valid) {
                throw new BadRequestException(passwordValidation.message);
            }

            user.password = await hashPassword(newPassword);
            user.loginAttempts = 0;
            user.isLocked = false;
            user.updatedBy = updatedBy;

            await manager.save(User, user);

            // Invalidate cache only for this user
            this.cacheHelper.invalidateUserCache(id);
            logger.info(`Password reset by ${updatedBy.username} for user: ${user.username} (ID: ${id})`);
        });
    }

    async unlockUser(id: number, updatedById: number): Promise<void> {
        await this.withTransaction(async (manager) => {
            const user = await manager.findOne(User, {
                where: { id },
                select: ['id', 'username', 'loginAttempts', 'isLocked']
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const updatedBy = await AuthHelper.getUserReference(updatedById, manager);
            if (!updatedBy) {
                throw new NotFoundException('Updater user not found');
            }

            user.isLocked = false;
            user.loginAttempts = 0;
            user.updatedBy = updatedBy;

            await manager.save(User, user);

            this.cacheHelper.invalidateUserCache(id);
            logger.info(`User unlocked by ${updatedBy.username}: ${user.username} (ID: ${id})`);
        });
    }

    async bulkUpdateUsers(
        userIds: number[], 
        updates: Partial<UpdateUserDto>, 
        updatedById: number
    ): Promise<BulkOperationResult> {
        if (userIds.length > 100) {
            throw new BadRequestException('Maximum batch size exceeded: 100');
        }

        const result: BulkOperationResult = {
            success: 0,
            failed: 0,
            errors: []
        };

        await this.withTransaction(async (manager) => {
            const updatedBy = await AuthHelper.getUserReference(updatedById, manager);
            if (!updatedBy) {
                throw new NotFoundException('Updater user not found');
            }

            const users = await manager.find(User, {
                where: { id: In(userIds) },
                relations: ['roles'],
                lock: { mode: "pessimistic_write" }
            });

            const userMap = new Map(users.map(user => [user.id, user]));

            await AuthHelper.processBatchOperations(
                userIds,
                async (userId) => {
                    try {
                        const user = userMap.get(userId);
                        if (!user) {
                            throw new NotFoundException(`User with ID ${userId} not found`);
                        }

                        AuthHelper.validateUserModification(user, updatedBy);
                        AuthHelper.applyUserUpdates(user, updates);
                        user.updatedBy = updatedBy;

                        await manager.save(User, user);
                        result.success++;
                    } catch (error) {
                        result.failed++;
                        result.errors.push({
                            id: userId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                },
                10
            );

            // Invalidate only affected users
            this.cacheHelper.invalidateUserCache();
            logger.info(`Bulk update completed: ${result.success} successful, ${result.failed} failed`);
            return result;
        });

        return result;
    }

    clearUserCache(userId?: number): void {
        this.cacheHelper.clearUserCache(userId);
    }

    getCacheStats() {
        return this.cacheHelper.getCacheStats();
    }

    async destroy(): Promise<void> {
        this.cacheHelper.destroy();
    }
}