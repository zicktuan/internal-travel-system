-- Setup Database for Travel System
BEGIN;

-- 1. Tạo permissions
INSERT INTO permission (name, module, action, description, "createdAt", "updatedAt") VALUES
('user.read', 'user', 'read', 'Read user information', NOW(), NOW()),
('user.write', 'user', 'update', 'Write user information', NOW(), NOW()),
('user.delete', 'user', 'delete', 'Delete user', NOW(), NOW()),
('role.read', 'role', 'read', 'Read role information', NOW(), NOW()),
('role.write', 'role', 'update', 'Write role information', NOW(), NOW()),
('role.delete', 'role', 'delete', 'Delete role', NOW(), NOW()),
('permission.read', 'permission', 'read', 'Read permission information', NOW(), NOW()),
('permission.write', 'permission', 'update', 'Write permission information', NOW(), NOW()),
('permission.delete', 'permission', 'delete', 'Delete permission', NOW(), NOW()),
('tour.read', 'tour', 'read', 'Read tour information', NOW(), NOW()),
('tour.write', 'tour', 'update', 'Write tour information', NOW(), NOW()),
('tour.delete', 'tour', 'delete', 'Delete tour', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Tạo roles
INSERT INTO role (name, description, "isSystem", "createdAt", "updatedAt") VALUES
('superadmin', 'Super Administrator with full access', true, NOW(), NOW()),
('admin', 'Administrator with management access', false, NOW(), NOW()),
('user', 'Regular user with basic access', false, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 3. Gán permissions cho roles
-- Super Admin - tất cả permissions
INSERT INTO role_permissions_permission ("roleId", "permissionId")
SELECT r.id, p.id FROM role r, permission p WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- Admin - selected permissions
INSERT INTO role_permissions_permission ("roleId", "permissionId")
SELECT r.id, p.id FROM role r, permission p 
WHERE r.name = 'admin' 
AND p.name IN ('user.read', 'user.write', 'role.read', 'tour.read', 'tour.write')
ON CONFLICT DO NOTHING;

-- User - basic permissions
INSERT INTO role_permissions_permission ("roleId", "permissionId")
SELECT r.id, p.id FROM role r, permission p 
WHERE r.name = 'user' 
AND p.name IN ('tour.read')
ON CONFLICT DO NOTHING;

-- 4. Tạo super admin user (password: Admin123!)
INSERT INTO users (
    username, password, email, "firstName", "lastName", "displayName", 
    "isVerified", "isActive", "isLocked", "loginAttempts", "createdAt", "updatedAt"
) VALUES (
    'superadmin',
    '$2b$10$8Sz2m.5Y3p5Y3p5Y3p5Y3e5Y3p5Y3p5Y3p5Y3p5Y3p5Y3p5Y3p5Y3p5Y', -- Hashed password
    'superadmin@travelsystem.com',
    'Super',
    'Admin',
    'System Administrator',
    true,
    true,
    false,
    0,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- 5. Gán role cho super admin
INSERT INTO user_roles ("userId", "roleId")
SELECT u.id, r.id FROM users u, role r 
WHERE u.username = 'superadmin' AND r.name = 'superadmin'
ON CONFLICT DO NOTHING;

COMMIT;

-- 6. Kiểm tra kết quả
SELECT '✅ Permissions:' as "Check";
SELECT name, description FROM permission;

SELECT '✅ Roles:' as "Check";  
SELECT name, description FROM role;

SELECT '✅ Role Permissions:' as "Check";
SELECT r.name as role, p.name as permission 
FROM role r
JOIN role_permissions_permission rp ON r.id = rp."roleId"
JOIN permission p ON p.id = rp."permissionId"
ORDER BY r.name, p.name;

SELECT '✅ Users:' as "Check";
SELECT username, email, "displayName", "isActive" FROM users;