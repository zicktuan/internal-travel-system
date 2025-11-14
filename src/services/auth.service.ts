import { USER_CONFIG } from "../common/constants";
import { TokenType } from "../common/enums";
import { AppDataSource } from "../config/database";
import { AuthResponseDto, LoginDto } from "../dto/auth.dto";
import { NotFoundException, UnauthorizedException } from "../exceptions/app.exception";
import { User } from "../models/user.model";
import { generateRefreshToken, generateToken } from "../utils/jwt";
import logger from "../utils/logger";
import { comparePassword, hashPassword } from "../utils/password";

export class AuthService {
    private userRepository = AppDataSource.getRepository(User);

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const {username, password} = loginDto;

        logger.info(`Login attempt for user: ${username}`);

        const user = await this.userRepository.findOne({ where: {username}, relations: ['roles', 'roles.permissions'] });

        if (!user) {
            logger.warn(`Login failed: User ${username} not found`);
            throw new UnauthorizedException('Invalid username or password');
        }

        // Check account status
        this.validateAccountStatus(user);

        // Verify password
        await this.verifyPassword(user, password);

        // Update user login info
        await this.updateLoginSuccess(user);

        // Generate tokens
        const tokens = await this.generateUserTokens(user);

        logger.info(`Login successful for user: ${username}`);

        return {
            ...tokens,
            user: this.sanitizeUser(user),
            permissions: this.extractPermissions(user),
            roles: this.extractRoles(user),
            tokenType: 'Bearer',
            expiresIn: 7
        }
    }

    async getProfile(userId: number): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.sanitizeUser(user);
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        user.password = await hashPassword(newPassword);
        await this.userRepository.save(user);

        logger.info(`Password changed for user: ${user.username}`);
    }

    async refreshToken(userId: number): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        this.validateAccountStatus(user);

        return this.generateUserTokens(user);
    }

    private sanitizeUser(user: User): any {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Private helper methods
    private validateAccountStatus(user: User): void {
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated. Please contact administrator');
        }

        if (user.isLocked) {
            throw new UnauthorizedException('Account is locked. Please contact administrator');
        }
    }

    private async verifyPassword(user: User, password: string): Promise<void> {
        const isPasswordValid = await comparePassword(password, user.password);
        console.log(13131231231231);
        console.log(isPasswordValid);
        if (!isPasswordValid) {
            user.loginAttempts += 1;

            if (user.loginAttempts >= USER_CONFIG.MAX_LOGIN_ATTEMPTS) {
                user.isLocked = true;
                logger.warn(`Account locked due to too many failed attempts: ${user.username}`);
            }

            await this.userRepository.save(user);
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    private async updateLoginSuccess(user: User): Promise<void> {
        user.loginAttempts = 0;
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);
    }

    private async generateUserTokens(user: User): Promise<{ accessToken: string; refreshToken: string}> {
        const basePayload = {
            userId: user.id.toString(),
            username: user.username,
            email: user.email,
        };

        const accessPayload = {
            ...basePayload,
            type: TokenType.ACCESS
        }

        const refreshPayload = {
            ...basePayload,
            type: TokenType.REFRESH
        }
        
        
        return {
            accessToken: generateToken(accessPayload),
            refreshToken: generateRefreshToken(refreshPayload)
        }
    }

    private extractPermissions(user: User): string[] {
        return user.roles.flatMap(role => 
            role.permissions.map(permission => permission.name)
        );
    }

    private extractRoles(user: User): string[] {
        return user.roles.map(role => role.name);
    }
}