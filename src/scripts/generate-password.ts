import { hashPassword } from "../utils/password";

async function generateSuperAdminPassword() {
    const plainPassword = 'Admin123!';
    const hashedPassword = await hashPassword(plainPassword);
    
    console.log('=================================');
    console.log('Super Admin Credentials:');
    console.log('=================================');
    console.log('Username: superadmin');
    console.log('Password:', plainPassword);
    console.log('Hashed Password:', hashedPassword);
    console.log('=================================');
    
    // SQL query để update
    console.log('\nSQL UPDATE query:');
    console.log(`UPDATE users SET password = '${hashedPassword}' WHERE username = 'superadmin';`);
    
    // Hoặc INSERT query mới
    console.log('\nSQL INSERT query:');
    console.log(`
INSERT INTO users (
    username, password, email, "firstName", "lastName", "displayName", 
    "isVerified", "isActive", "isLocked", "loginAttempts"
) VALUES (
    'superadmin',
    '${hashedPassword}',
    'superadmin@travelsystem.com',
    'Super',
    'Admin',
    'System Administrator',
    true,
    true,
    false,
    0
) ON CONFLICT (username) DO NOTHING;
    `);
}

generateSuperAdminPassword();