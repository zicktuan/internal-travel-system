import { AppDataSource } from '../config/database';
import { Permission } from '../models/permission.model';
import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password';
import { In } from 'typeorm';

async function seedWithEntities() {
    try {
        console.log('🚀 Starting database seeding with entities...');
        
        // 1. Kết nối và sync database
        await AppDataSource.initialize();
        await AppDataSource.synchronize();
        console.log('✅ Database synchronized');
        
        const permissionRepository = AppDataSource.getRepository(Permission);
        const roleRepository = AppDataSource.getRepository(Role);
        const userRepository = AppDataSource.getRepository(User);
        
        // 2. Tạo permissions
        console.log('📝 Creating permissions...');
        const permissionData = [
            { name: 'user.read', module: 'user', action: 'read', description: 'Read user information' },
            { name: 'user.write', module: 'user', action: 'update', description: 'Write user information' },
            { name: 'user.delete', module: 'user', action: 'delete', description: 'Delete user' },
            { name: 'role.read', module: 'role', action: 'read', description: 'Read role information' },
            { name: 'role.write', module: 'role', action: 'update', description: 'Write role information' },
            { name: 'role.delete', module: 'role', action: 'delete', description: 'Delete role' },
            { name: 'permission.read', module: 'permission', action: 'read', description: 'Read permission information' },
            { name: 'permission.write', module: 'permission', action: 'update', description: 'Write permission information' },
            { name: 'permission.delete', module: 'permission', action: 'delete', description: 'Delete permission' },
            { name: 'tour.read', module: 'tour', action: 'read', description: 'Read tour information' },
            { name: 'tour.write', module: 'tour', action: 'update', description: 'Write tour information' },
            { name: 'tour.delete', module: 'tour', action: 'delete', description: 'Delete tour' },
        ];

        // Tạo từng permission một
        const permissions: Permission[] = [];
        for (const data of permissionData) {
            let permission = await permissionRepository.findOne({ where: { name: data.name } });
            if (!permission) {
                permission = permissionRepository.create(data as Partial<Permission>);
                permission = await permissionRepository.save(permission);
                console.log(`✅ Created permission: ${data.name}`);
            } else {
                console.log(`⚠️ Permission already exists: ${data.name}`);
            }
            permissions.push(permission);
        }
        console.log(`✅ Total permissions: ${permissions.length}`);
        
        // 3. Tạo roles
        console.log('👥 Creating roles...');
        
        // Super Admin Role - tất cả permissions
        let superAdminRole = await roleRepository.findOne({ where: { name: 'superadmin' } });
        if (!superAdminRole) {
            superAdminRole = roleRepository.create({
                name: 'superadmin',
                description: 'Super Administrator with full access',
                isSystem: true,
                permissions: permissions
            } as Partial<Role>);
            superAdminRole = await roleRepository.save(superAdminRole);
            console.log('✅ Created superadmin role');
        } else {
            console.log('⚠️ superadmin role already exists');
        }
        
        // Admin Role - selected permissions
        let adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            const adminPermissions = permissions.filter(p => 
                ['user.read', 'user.write', 'role.read', 'tour.read', 'tour.write'].includes(p.name)
            );
            adminRole = roleRepository.create({
                name: 'admin',
                description: 'Administrator with management access',
                isSystem: false,
                permissions: adminPermissions
            } as Partial<Role>);
            adminRole = await roleRepository.save(adminRole);
            console.log('✅ Created admin role');
        } else {
            console.log('⚠️ admin role already exists');
        }
        
        // User Role - basic permissions
        let userRole = await roleRepository.findOne({ where: { name: 'user' } });
        if (!userRole) {
            const userPermissions = permissions.filter(p => p.name === 'tour.read');
            userRole = roleRepository.create({
                name: 'user',
                description: 'Regular user with basic access',
                isSystem: false,
                permissions: userPermissions
            } as Partial<Role>);
            userRole = await roleRepository.save(userRole);
            console.log('✅ Created user role');
        } else {
            console.log('⚠️ user role already exists');
        }
        
        // 4. Tạo super admin user
        console.log('👑 Creating super admin user...');
        let superAdminUser = await userRepository.findOne({ 
            where: { username: 'superadmin' },
            relations: ['roles']
        });
        
        if (!superAdminUser) {
            const hashedPassword = await hashPassword('Admin123!');
            superAdminUser = userRepository.create({
                username: 'superadmin',
                email: 'superadmin@travelsystem.com',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                displayName: 'System Administrator',
                isVerified: true,
                isActive: true,
                isLocked: false,
                roles: [superAdminRole!]
            } as Partial<User>);
            
            await userRepository.save(superAdminUser);
            console.log('✅ Created super admin user');
            console.log('   Username: superadmin');
            console.log('   Password: Admin123!');
            console.log('   Email: superadmin@travelsystem.com');
        } else {
            console.log('⚠️ superadmin user already exists');
        }
        
        console.log('🎉 Database seeding completed successfully');
        await AppDataSource.destroy();
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedWithEntities();