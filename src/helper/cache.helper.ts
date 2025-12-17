import LRUCache from "../cache/LRUCache";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import logger from "../utils/logger";

export class CacheHelper {
    private userCache: LRUCache<number, User>;
    private roleCache: LRUCache<number, Role>;
    private cacheCleanupInterval?: NodeJS.Timeout;
    private isDestroyed = false;

    constructor(
        userCache?: LRUCache<number, User>,
        roleCache?: LRUCache<number, Role>
    ) {
        this.userCache = userCache || new LRUCache<number, User>(500);
        this.roleCache = roleCache || new LRUCache<number, Role>(100);
    }

    invalidateUserCache(userId?: number): void {
        if (userId) {
            this.userCache.delete(userId);
        } else {
            this.userCache.clear();
        }
    }

    invalidateRoleCache(roleId?: number): void {
        if (roleId) {
            this.roleCache.delete(roleId);
        } else {
            this.roleCache.clear();
        }
    }

    invalidateAllCaches(): void {
        this.userCache.clear();
        this.roleCache.clear();
    }

    getUserFromCache(userId: number): User | undefined {
        return this.userCache.get(userId);
    }

    setUserInCache(user: User): void {
        this.userCache.set(user.id, user);
    }

    getRoleFromCache(roleId: number): Role | undefined {
        return this.roleCache.get(roleId);
    }

    setRoleInCache(role: Role): void {
        this.roleCache.set(role.id, role);
    }

    getCacheStats(): { users: number; roles: number } {
        return {
            users: this.userCache.size(),
            roles: this.roleCache.size()
        };
    }

    private startCacheCleanup(): void {
        this.cacheCleanupInterval = setInterval(() => {
            if (this.isDestroyed) {
                this.clearCacheCleanup();
                return;
            }

            if (this.userCache.size() > 400) {
                const newCache = new LRUCache<number, User>(300);
                this.userCache = newCache;
                logger.info('User cache cleaned up due to size limit');
            }
        }, 10 * 60 * 1000);
    }

    private clearCacheCleanup(): void {
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = undefined;
        }
    }

    clearUserCache(userId?: number): void {
        if (userId) {
            this.userCache.delete(userId);
        } else {
            this.userCache.clear();
        }
    }

    clearRoleCache(roleId?: number): void {
        if (roleId) {
            this.roleCache.delete(roleId);
        } else {
            this.roleCache.clear();
        }
    }

    destroy(): void {
        this.isDestroyed = true;
        this.clearCacheCleanup();
        this.userCache.clear();
        this.roleCache.clear();
    }

    updateCacheAfterOperation(affectedUserIds?: number[], affectedRoleIds?: number[]): void {
        if (affectedUserIds) {
            affectedUserIds.forEach(id => this.userCache.delete(id));
        }

        if (affectedRoleIds) {
            affectedRoleIds.forEach(id => this.roleCache.delete(id));
        }
    }
}