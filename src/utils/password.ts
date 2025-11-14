import { PASSWORD_CONFIG } from "../common/constants";
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
}

export const validatePasswordStrength = (password: string): {valid: boolean, message?: string} => {
    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long` };
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
}

export const generateRandomPassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special character
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<{valid: boolean, message?: string}> => {
    const isMatch = await comparePassword(password, hashedPassword);
    
    if (!isMatch) {
        return { valid: false, message: 'Invalid password' };
    }
    
    return { valid: true };
}