import { In } from 'typeorm';
import { AppDataSource } from "../config/database";
import { CreateAndUpdatePermissionDto, PermissionResponseDto } from "../dto/permission.dto";
import { Permission } from "../models/permission.model";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { BadRequestException, ForbiddenException, NotFoundException } from "../exceptions/app.exception";
import { AuthHelper } from "../helper/auth.helper";
import logger from "../utils/logger";

export class PermissionService {
    private permissionRepository = AppDataSource.getRepository(Permission);
    private roleRepository = AppDataSource.getRepository(Role);
    private userRepository = AppDataSource.getRepository(User);

    async getAllPermissions(userId: number, filters?: { name?: string; module?: string; action?: string }, pagination?: any): Promise<{ permissions: PermissionResponseDto[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> {
        const user = await this.checkUserExist(userId, 'User not found');
        const isSuper = this.isSuperAdmin(user);
        if (!isSuper) {
            throw new ForbiddenException('Insufficient permissions to list permissions');
        }

        const qb = this.permissionRepository.createQueryBuilder('permission');

        if (filters) {
            if (filters.name) qb.andWhere('permission.name ILIKE :name', { name: `%${filters.name}%` });
            if (filters.module) qb.andWhere('permission.module = :module', { module: filters.module });
            if (filters.action) qb.andWhere('permission.action = :action', { action: filters.action });
        }

        const sortBy = pagination?.sortBy || 'createdAt';
        const sortOrder = pagination?.sortOrder || 'DESC';

        if (pagination && (pagination.page !== undefined || pagination.limit !== undefined)) {
            const { page, limit, skip } = AuthHelper.validatePagination(pagination.page, pagination.limit);

            const [perms, total] = await qb
                .orderBy(`permission.${AuthHelper.validateSortField(sortBy)}`, sortOrder as 'ASC' | 'DESC')
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            const totalPages = Math.ceil(total / limit);

            return {
                permissions: perms.map(p => this.mapToResponse(p)),
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };
        }

        const perms = await qb.orderBy(`permission.${AuthHelper.validateSortField(sortBy)}`, sortOrder as 'ASC' | 'DESC').getMany();
        const total = perms.length;
        const page = 1;
        const limit = total;
        const totalPages = total > 0 ? 1 : 0;

        return {
            permissions: perms.map(p => this.mapToResponse(p)),
            total,
            page,
            limit,
            totalPages,
            hasNext: false,
            hasPrev: false
        };
    }

    async getPermissionById(id: number, userId: number): Promise<PermissionResponseDto> {
        const user = await this.checkUserExist(userId, 'User not found');
        if (!this.isSuperAdmin(user)) throw new ForbiddenException('Insufficient permissions to view permission');

        const perm = await this.permissionRepository.findOne({ where: { id } });
        if (!perm) throw new NotFoundException('Permission not found');
        return this.mapToResponse(perm);
    }

    async createPermission(dto: CreateAndUpdatePermissionDto, createdBy: number): Promise<PermissionResponseDto> {
        const creator = await this.checkUserExist(createdBy, 'Creator not found');
        if (!this.isSuperAdmin(creator)) throw new ForbiddenException('Only superadmin can create permissions');

        const existing = await this.permissionRepository.findOne({ where: { name: dto.name } });
        if (existing) throw new BadRequestException('Permission already exists');

        const perm = new Permission(dto as any);
        const saved = await this.permissionRepository.save(perm);
        logger.info(`Permission created: ${saved.name} (ID: ${saved.id}) by user ${creator.username}`);
        return this.mapToResponse(saved);
    }

    async updatePermission(id: number, dto: CreateAndUpdatePermissionDto, updatedBy: number): Promise<PermissionResponseDto> {
        const updator = await this.checkUserExist(updatedBy, 'Updater not found');
        if (!this.isSuperAdmin(updator)) throw new ForbiddenException('Only superadmin can update permissions');

        const perm = await this.permissionRepository.findOne({ where: { id } });
        if (!perm) throw new NotFoundException('Permission not found');

        perm.name = dto.name !== undefined ? dto.name : perm.name;
        perm.module = dto.module !== undefined ? dto.module : perm.module;
        perm.action = dto.action !== undefined ? dto.action : perm.action;
        perm.description = dto.description !== undefined ? dto.description : perm.description;

        const saved = await this.permissionRepository.save(perm);
        logger.info(`Permission updated: ${saved.name} (ID: ${saved.id}) by user ${updator.username}`);
        return this.mapToResponse(saved);
    }

    async deletePermission(id: number, deletedBy: number): Promise<void> {
        const deletor = await this.checkUserExist(deletedBy, 'Deleter not found');
        if (!this.isSuperAdmin(deletor)) throw new ForbiddenException('Only superadmin can delete permissions');

        const perm = await this.permissionRepository.findOne({ where: { id } });
        if (!perm) throw new NotFoundException('Permission not found');

        const roles = await this.roleRepository.createQueryBuilder('role')
            .leftJoin('role.permissions', 'permission')
            .where('permission.id = :id', { id })
            .getMany();

        if (roles.length > 0) throw new BadRequestException('Cannot delete permission assigned to roles');

        await this.permissionRepository.remove(perm);
        logger.info(`Permission deleted: ${perm.name} (ID: ${perm.id}) by user ${deletor.username}`);
    }

    private mapToResponse(p: Permission): PermissionResponseDto {
        return {
            id: p.id,
            name: p.name,
            module: String(p.module),
            action: String(p.action),
            description: p.description,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        };
    }

    private async checkUserExist(userId: number, message: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['roles', 'roles.permissions'] });
        if (!user) throw new NotFoundException(message);
        return user;
    }

    private isSuperAdmin(user: User): boolean {
        return user.roles?.some(r => r.name === 'superadmin') || false;
    }
}

export const permissionService = new PermissionService();
