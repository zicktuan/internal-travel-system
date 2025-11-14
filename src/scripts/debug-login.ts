import { AppDataSource } from '../config/database';
import { User } from '../models/user.model';
import { hashPassword, verifyPassword } from '../utils/password';

async function debugLogin() {
    try {
        await AppDataSource.initialize();
        
        const userRepository = AppDataSource.getRepository(User);
        
        // 1. Tìm user
        const user = await userRepository.findOne({
            where: { username: 'superadmin' },
            relations: ['roles', 'roles.permissions']
        });

        console.log('🔍 DEBUG LOGIN PROCESS');
        console.log('=====================');
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found:');
        console.log('  - Username:', user.username);
        console.log('  - Email:', user.email);
        console.log('  - IsActive:', user.isActive);
        console.log('  - IsVerified:', user.isVerified);
        console.log('  - Password length:', user.password?.length);
        console.log('  - Password hash:', user.password?.substring(0, 20) + '...');
        console.log('  - Roles:', user.roles?.map(r => r.name));

        // 2. Test password
        const testPassword = 'Admin123!';
        console.log('\n🔐 PASSWORD TEST:');
        console.log('  - Input password:', testPassword);
        
        const isPasswordValid = await verifyPassword(testPassword, user.password);
        console.log('  - Password valid:', isPasswordValid);

        // 3. Generate new hash để so sánh
        console.log('\n🔄 HASH COMPARISON:');
        const newHash = await hashPassword(testPassword);
        console.log('  - New hash:', newHash.substring(0, 20) + '...');
        console.log('  - Stored hash:', user.password?.substring(0, 20) + '...');
        console.log('  - Hashes match:', newHash === user.password);

        // 4. Test với các password variations
        console.log('\n🎯 TEST PASSWORD VARIATIONS:');
        const variations = [
            'Admin123!',
            'Admin123',
            'admin123!',
            'Admin123! ',
            ' Admin123!',
            'Admin123!!'
        ];
        
        for (const pwd of variations) {
            const isValid = await verifyPassword(pwd, user.password);
            console.log(`  - "${pwd}": ${isValid ? 'VALID' : 'INVALID'}`);
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugLogin();