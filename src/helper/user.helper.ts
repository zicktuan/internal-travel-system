import { EntityManager, In, Repository } from "typeorm";
import LRUCache from "../cache/LRUCache";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { BadRequestException } from "../exceptions/app.exception";
import { generateRandomPassword, hashPassword } from "../utils/password";
import { UserResponseDto } from "../dto/user.dto";

export class UserHelper {
    private roleCache?: LRUCache<number, Role>;

    constructor(roleCache?: LRUCache<number, Role>) {
        this.roleCache = roleCache;
    }

    async checkUserExistenceTransactional(
        username: string,
        email: string,
        entityManager: EntityManager
    ): Promise<void> {
        const rawUsername = username?.trim().toLowerCase();
        const rawEmail = email?.trim().toLowerCase();
        const existingUser = await entityManager.findOne(User, {
            where: [
                { username: rawUsername },
                { email: rawEmail }
            ],
            select: ['id', 'username', 'email']
        });

        if (existingUser) {
            if (existingUser.username === username.toLowerCase()) {
                throw new BadRequestException('Username already exists');
            }
            throw new BadRequestException('Email already exists');
        }
    }

    async getRolesByIdsOptimized(
        roleIds: number[],
        entityManager?: EntityManager,
        roleRepository?: Repository<Role>
    ): Promise<Role[]> {
        if (!roleIds.length) {
            throw new BadRequestException('At least one role is required');
        }

        const uncachedIds: number[] = [];
        const cachedRoles: Role[] = [];

        if (this.roleCache) {
            for (const id of roleIds) {
                const cached = this.roleCache.get(id);
                if (cached) {
                    cachedRoles.push(cached);
                } else {
                    uncachedIds.push(id);
                }
            }
        } else {
            uncachedIds.push(...roleIds);
        }
        

        let fetchedRoles: Role[] = [];
        if (uncachedIds.length > 0) {
            const repository = entityManager ? entityManager.getRepository(Role) : roleRepository;

            if (!repository) {
                throw new BadRequestException('Role reposiroty is required');
            }
            
            fetchedRoles = await repository.find({
                where: { id: In(uncachedIds) }
            });

            if (this.roleCache) {
                fetchedRoles.forEach(role => {
                    this.roleCache!.set(role.id, role);
                });
            }
            
        }

        const allRoles = [...cachedRoles, ...fetchedRoles];
        
        if (allRoles.length !== roleIds.length) {
            const foundIds = new Set(allRoles.map(role => role.id));
            const missingIds = roleIds.filter(id => !foundIds.has(id));
            throw new BadRequestException(`Roles not found: ${missingIds.join(', ')}`);
        }

        return allRoles;
    }

    async generatePasswordData(): Promise<{ plainPassword: string; hashedPassword: string }> {
        const plainPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(plainPassword);
        return { plainPassword, hashedPassword };
    }

    mapToUserResponse(user: User): UserResponseDto {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            fullName: user.fullName,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            isVerified: user.isVerified,
            isLocked: user.isLocked,
            lastLoginAt: user.lastLoginAt,
            loginAttempts: user.loginAttempts,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt || user.createdAt,
            roles: user.roles ? user.roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description
            })) : [],
            permissions: user.roles ? user.roles.flatMap(role => 
                role.permissions?.map(p => p.name) || []
            ) : [],
            createdBy: user.createdBy ? {
                id: user.createdBy.id,
                username: user.createdBy.username,
                displayName: user.createdBy.displayName
            } : undefined,
            updatedBy: user.updatedBy ? {
                id: user.updatedBy.id,
                username: user.updatedBy.username,
                displayName: user.updatedBy.displayName
            } : undefined
        };
    }

    async sendPasswordEmailAsync(user: User, password: string): Promise<void> {
        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            // logger.info(`Password email sent to ${user.email} for user ${user.username}`);
        } catch (error) {
            // logger.error(`Failed to send password email to ${user.username}:`, error);
            throw error;
        }
    }
}