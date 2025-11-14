import { AppDataSource } from '../config/database';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { hashPassword } from '../utils/password';
import logger from '../utils/logger';

async function createSuperAdmin() {
    try {
        await AppDataSource.initialize();
        
        const roleRepository = AppDataSource.getRepository(Role);
        const userRepository = AppDataSource.getRepository(User);

        // Tạo Super Admin role
        let superAdminRole = await roleRepository.findOne({ where: { name: 'superadmin' } });
        if (!superAdminRole) {
            superAdminRole = roleRepository.create({
                name: 'superadmin',
                description: 'Super Administrator with full access',
                isSystem: true,
            });
            await roleRepository.save(superAdminRole);
            logger.info('✅ Super Admin role created');
        }

        // Tạo Super Admin user
        const existingAdmin = await userRepository.findOne({ 
            where: { username: 'superadmin' },
            relations: ['roles']
        });

        if (!existingAdmin) {
            const hashedPassword = await hashPassword('Admin123!');
            const superAdmin = userRepository.create({
                username: 'superadmin',
                email: 'superadmin@travelsystem.com',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                displayName: 'Super Admin',
                isActive: true,
                isVerified: true,
                isLocked: false,
                roles: [superAdminRole]
            });
            
            await userRepository.save(superAdmin);
            logger.info('✅ Super Admin user created');
            logger.info('   Username: superadmin');
            logger.info('   Password: Admin123!');
            logger.info('   Email: superadmin@travelsystem.com');
        } else {
            logger.info('ℹ️ Super Admin already exists');
        }

        await AppDataSource.destroy();
    } catch (error) {
        logger.error('❌ Error creating super admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();