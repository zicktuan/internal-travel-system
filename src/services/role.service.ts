import { In } from "typeorm";
import { PaginationOptions } from "../common/user";
import { AppDataSource } from "../config/database";
import { CreateRoleDto, RoleResponseDto, UpdateRoleDto } from "../dto/role.dto";
import { BadRequestException, ForbiddenException, NotFoundException } from "../exceptions/app.exception";
import { Permission } from "../models/permission.model";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { validateIdArray, validateString } from "../utils/validation";
import { PERMISSIONS } from "../common/permissions";
import logger from "../utils/logger";
import { AuthHelper } from "../helper/auth.helper";

export class RoleService {
    private roleRepository = AppDataSource.getRepository(Role);
    private permissionRepository = AppDataSource.getRepository(Permission);
    private userRepository = AppDataSource.getRepository(User);

    async createRole(createRoleDto: CreateRoleDto, createdBy: number): Promise<RoleResponseDto> {
      
        try {
            const {name, description, isSystem = false, permissionIds} = createRoleDto;

            const creator = await this.checkUserExist(createdBy, 'Invalid creater user');

            await this.checkRolePermission(creator, PERMISSIONS.CREATE);

            // Validation name & permissionIds
            const valdatedName = validateString(name, 'Name', {
                required: true,
                minLength: 2,
                maxLength: 50,
                regex: /^[a-zA-Z0-9_ ]+$/,
                regexMessage: 'Name can only contain letters, numbers, spaces and underscores',
            });

            await validateIdArray(
                permissionIds,
                'Permission IDs',
                (ids) => this.permissionRepository.find({
                    where: {id: In(ids)}
                }),
                {
                    required: false,
                    minItems: 1,
                    allowEmpty: false,
                },
            );

            // Check if role already exists
            const existingRole = await this.roleRepository.findOne({where: {name}});
            if (existingRole) {
                throw new BadRequestException('Role already exists');
            }

            if (isSystem) {
                if (!this.isSuperAdmin(creator)) {
                    throw new ForbiddenException('Only superadmin can create system roles');
                }
            }

            const permissions = await this.getPermissionsByIds(permissionIds);

            const role = new Role({
                name: valdatedName, description, isSystem, permissions
            });

            const savedRole = await this.roleRepository.save(role);

            logger.info(`Role created: ${savedRole.name} (ID: ${savedRole.id}) by user ${creator?.fullName}`);

            return this.mapToRoleResponse(savedRole);
        } catch (error) {
            if (error instanceof BadRequestException || 
                error instanceof ForbiddenException || 
                error instanceof NotFoundException) {
                throw error;
            }
            
            // Unexpected errors
            logger.error('Unexpected error in createRole:', error);
            throw new BadRequestException('Failed to create role');
        }
    }

    /**
     * Get roles with optional filters and pagination.
     * If pagination is undefined, returns all matching roles with metadata (page=1, limit=total).
     */
    async getAllRoles(
        userId: number,
        filters?: { name?: string; permission?: string; isSystem?: boolean },
        pagination?: PaginationOptions
    ): Promise<{ roles: RoleResponseDto[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> {
        const user = await this.checkUserExist(userId, 'User not found');

        await this.checkRolePermission(user, PERMISSIONS.READ);

        const qb = this.roleRepository.createQueryBuilder('role')
            .leftJoinAndSelect('role.permissions', 'permissions')
            // loadRelationCountAndMap adds a `userCount` numeric property to each returned role
            .loadRelationCountAndMap('role.userCount', 'role.users');

        if (filters) {
            if (filters.name) {
                qb.andWhere('role.name ILIKE :name', { name: `%${filters.name}%` });
            }
            if (typeof filters.isSystem === 'boolean') {
                qb.andWhere('role.isSystem = :isSystem', { isSystem: filters.isSystem });
            }
            if (filters.permission) {
                qb.andWhere('permissions.name = :perm', { perm: filters.permission });
            }
        }

        const sortBy = pagination?.sortBy || 'createdAt';
        const sortOrder = pagination?.sortOrder || 'DESC';

        if (pagination && (pagination.page !== undefined || pagination.limit !== undefined)) {
            const { page, limit, skip } = AuthHelper.validatePagination(pagination.page, pagination.limit);

            const [roles, total] = await qb
                .orderBy(`role.${AuthHelper.validateSortField(sortBy)}`, sortOrder as 'ASC' | 'DESC')
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            const totalPages = Math.ceil(total / limit);

            return {
                roles: roles.map(r => this.mapToRoleResponse(r)),
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };
        }

    const roles = await qb.orderBy(`role.${AuthHelper.validateSortField(sortBy)}`, sortOrder as 'ASC' | 'DESC').getMany();
        const total = roles.length;
        const page = 1;
        const limit = total;
        const totalPages = total > 0 ? 1 : 0;

        return {
            roles: roles.map(r => this.mapToRoleResponse(r)),
            total,
            page,
            limit,
            totalPages,
            hasNext: false,
            hasPrev: false
        };
    }

    async getRoleUsers(id: number, userId: number): Promise<User[]> {

        const user = await this.checkUserExist(userId, 'User not found');

        await this.checkRolePermission(user, PERMISSIONS.READ);

        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['users']
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return role.users || [];
    }

    async getRoleById(id: number, userId: number): Promise<RoleResponseDto> {

        const user = await this.checkUserExist(userId, 'User not found');

        await this.checkRolePermission(user, PERMISSIONS.READ);

        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['permissions']
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return this.mapToRoleResponse(role);
    }

    async updateRole(id: number, updateRoleDto: UpdateRoleDto, updatedBy: number): Promise<RoleResponseDto> {

        try {
            const updator = await this.checkUserExist(updatedBy, 'Invalid updater user');

            await this.checkRolePermission(updator, PERMISSIONS.UPDATE);

            const role = await this.roleRepository.findOne({
                where: { id },
                relations: ['permissions']
            });

            if (updateRoleDto.name) {
                validateString(updateRoleDto.name, 'Name', {
                    required: true,
                    minLength: 2,
                    maxLength: 50,
                    regex: /^[a-zA-Z0-9_ ]+$/,
                    regexMessage: 'Name can only contain letters, numbers, spaces and underscores',
                });
            }

            if (updateRoleDto.permissionIds) {
                await validateIdArray(
                    updateRoleDto.permissionIds,
                    'Permission IDs',
                    (ids) => this.permissionRepository.find({
                        where: {id: In(ids)}
                    }),
                    {
                        required: false,
                        minItems: 1,
                        allowEmpty: false,
                    },
                );
            }

            if (!role) {
                throw new NotFoundException('Role not found');
            }

            if (role.isSystem && !this.isSuperAdmin(updator)) {
                throw new ForbiddenException('Only superadmin can modify system roles');
            }

            if (updateRoleDto.name !== undefined) role.name = updateRoleDto.name;
            if (updateRoleDto.description !== undefined) role.description = updateRoleDto.description;

            if (updateRoleDto.permissionIds) {
                role.permissions = await this.getPermissionsByIds(updateRoleDto.permissionIds);
            }

            const updatedRole = await this.roleRepository.save(role);

            logger.info(`Role updated: ${updatedRole.name} (ID: ${updatedRole.id}) by user ${updator?.fullName}`);

            return this.mapToRoleResponse(updatedRole);
        } catch (error) {
           if (error instanceof BadRequestException || 
                error instanceof ForbiddenException || 
                error instanceof NotFoundException) {
                throw error;
            }
            
            logger.error('Unexpected error in updateRole:', error);
            throw new BadRequestException('Failed to update role');
        }
    }

    async deleteRole(id:number, deletedBy: number): Promise<void> {

        try {

            const deletor = await this.checkUserExist(deletedBy, 'Invalid deleter user');

            await this.checkRolePermission(deletor, PERMISSIONS.DELETE);

            const role = await this.roleRepository.findOne({
                where: { id },
                relations: ['users']
            });

            if (!role) {
                throw new NotFoundException('Role not found');
            }

            if (role.isSystem && !this.isSuperAdmin(deletor)) {
                throw new ForbiddenException('Cannot delete system roles');
            }

            if (role.users && role.users.length > 0) {
                throw new BadRequestException('Cannot delete role that has users assigned');
            }

            await this.roleRepository.remove(role);
        } catch (error) {
            if (error instanceof BadRequestException || 
                error instanceof ForbiddenException || 
                error instanceof NotFoundException) {
                throw error;
            }
            
            logger.error('Unexpected error in deleteRole:', error);
            throw new BadRequestException('Failed to delete role');
        }
    } 

    async getPermissionsByIds(permissionIds: number[]): Promise<Permission[]> {
        if (!permissionIds || permissionIds.length === 0) {
            return [];
        }

        const permissions = await this.permissionRepository.find({
            where: { id: In(permissionIds) }
        });

        if (permissions.length !== permissionIds.length) {
            throw new BadRequestException('One or more permissions not found');
        }

        return permissions;

    }

    private mapToRoleResponse(role: Role): RoleResponseDto {
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            userCount: role.users ? role.users.length : 0,
            permissions: role.permissions ? role.permissions.map(permission => ({
                id: permission.id,
                name: permission.name,
                module: permission.module,
                action: permission.action,
                description: permission.description,
                createdAt: permission.createdAt,
                updatedAt: permission.updatedAt
            })) : [],
            createdAt: role.createdAt,
            updatedAt: role.updatedAt
        }
    }

    private async checkRolePermission(user: User, permission: string): Promise<void> {
        // Ensure permissions are loaded on roles (checkUserExist should load roles.permissions)
        const userPermissions = user.roles.flatMap(role => role.permissions?.map(p => p.name) || []);

        const isSuperAdmin = user.roles.some(role => role.name === 'superadmin');
        const hasPermission = userPermissions.includes(permission) || isSuperAdmin;

        if (!hasPermission) {
            throw new ForbiddenException(`Insufficient permissions: ${permission} required`);
        }
    }

    private isSuperAdmin(user: User): boolean {
        return user.roles?.some(role => role.name === 'superadmin') || false;
    }

    private async checkUserExist(userId: number, message: string): Promise<User> {

        // Load role permissions as well so permission checks work correctly
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions']
        })

        if (!user) {
            throw new NotFoundException(`${message}`)
        }

        return user;
    }
}