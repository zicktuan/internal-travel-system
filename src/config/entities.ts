import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Category } from '../models/category.entity';
import { Location } from '../models/location.entity';

/**
 * Load all entities (excluding base.entity.ts as it's a base class)
 */
export const loadEntities = (): any[] => {
    return [
        User,
        Role,
        Permission,
        Category,
        Location
    ];
}