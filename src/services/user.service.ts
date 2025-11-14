import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "../dto/user.dto";
import { BadRequestException, ForbiddenException, NotFoundException } from "../exceptions/app.exception";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import logger from "../utils/logger";
import { generateRandomPassword, validatePasswordStrength } from "../utils/password";
import { hashPassword } from "../utils/password";

export class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private roleRepository = AppDataSource.getRepository(Role);

    async createUser(createUserDto: CreateUserDto, createdById: number): Promise<UserResponseDto> {
        const { username, email, firstName, lastName, displayName, roleIds, sendPasswordEmail = false } = createUserDto;

        // Check if user already exists
        await this.checkExistingUser(username, email);

        // Get roles
        const roles = await this.getRolesByIds(roleIds);

        // Fetch the user who is creating this new user
        const createdBy = await this.userRepository.findOne({ where: { id: createdById } });
        if (!createdBy) {
            throw new NotFoundException('Creator user not found');
        }

        // Generate random password
        const password = generateRandomPassword();
        const hasdedPassword = await hashPassword(password);

        // Create user
        const user = new User({
            username,
            email,
            password: hasdedPassword,
            firstName,
            lastName,
            displayName: displayName || `${firstName} ${lastName}`.trim(),
            roles,
            isActive: true,
            isVerified: false,
            createdBy,
            updatedBy: createdBy
        });

        const savedUser = await this.userRepository.save(user);

        logger.info(`User created by ${createdBy.username}: ${username}`);

        // TODO: Send password email if requested
        if (sendPasswordEmail) {
            await this.sendPasswordEmail(user, password);
        }

        return this.mapToUserResponse(savedUser);
    }

    async getAllUsers(): Promise<UserResponseDto[]> {
        const users = await this.userRepository.find({
            relations: ['roles', 'roles.permissions', 'createdBy', 'updatedBy'],
            order: { createdAt: 'DESC' }
        });

        return users.map(user => this.mapToUserResponse(user));
    }

    async getUserById(id: number): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({
            where: {id},
            relations: ['roles', 'roles.permissions', 'createdBy', 'updatedBy']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.mapToUserResponse(user);
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto, updatedById: number): Promise<UserResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['roles']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Fetch the user who is updating this user
        const updatedBy = await this.userRepository.findOne({ where: { id: updatedById } });
        if (!updatedBy) {
            throw new NotFoundException('Updater user not found');
        }

        if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName;
        if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName;
        if (updateUserDto.displayName !== undefined) user.displayName = updateUserDto.displayName;
        if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
        if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
        if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;
        if (updateUserDto.isVerified !== undefined) user.isVerified = updateUserDto.isVerified;

        // Update roles if provided
        if (updateUserDto.roleIds) {
            user.roles = await this.getRolesByIds(updateUserDto.roleIds);
        }

        user.updatedBy = updatedBy;

        const updatedUser = await this.userRepository.save(user);

        logger.info(`User updated by ${updatedBy.username}: ${user.username}`);

        return this.mapToUserResponse(updatedUser);
    }

    async deleteUser(id: number, deletedById: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Fetch the user who is deleting
        const deletedBy = await this.userRepository.findOne({ where: { id: deletedById } });
        if (!deletedBy) {
            throw new NotFoundException('Deleter user not found');
        }

        // Prevent deleting super admin
        if (user.username === 'superadmin') {
            throw new ForbiddenException('Cannot delete super admin user');
        }

        // Prevent user from deleting thmselves
        if (user.id === deletedBy.id) {
            throw new ForbiddenException('Cannot delete your own account');
        }

        await this.userRepository.remove(user);

        logger.info(`User deleted by ${deletedBy.username}: ${user.username}`);
    }

    async resetPassword(id: number, newPassword: string, updatedById: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Fetch the user who is resetting the password
        const updatedBy = await this.userRepository.findOne({ where: { id: updatedById } });
        if (!updatedBy) {
            throw new NotFoundException('Updater user not found');
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            throw new BadRequestException(passwordValidation.message);
        }

        user.password = await hashPassword(newPassword);
        user.updatedBy = updatedBy;
        user.loginAttempts = 0; // Reset login attempts
        user.isLocked = false; // Unlock account

        await this.userRepository.save(user);

        logger.info(`Password reset by ${updatedBy.username} for user: ${user.username}`);
    }

    async unlockUser(id: number, updatedById: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Fetch the user who is unlocking
        const updatedBy = await this.userRepository.findOne({ where: { id: updatedById } });
        if (!updatedBy) {
            throw new NotFoundException('Updater user not found');
        }

        user.isLocked = false;
        user.loginAttempts = 0;
        user.updatedBy = updatedBy;

        await this.userRepository.save(user);

        logger.info(`User unlocked by ${updatedBy.username}: ${user.username}`);
    }

    private async checkExistingUser(username: string, email: string): Promise<void> {
        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }]
        })

        if (existingUser) {
            if (existingUser.username === username) {
                throw new BadRequestException('Username already exists');
            }

            if (existingUser.email === email) {
                throw new BadRequestException('Email already exists');
            }
        }
    }

    async getRolesByIds(roleIds: number[]): Promise<Role[]> {
        if (!roleIds || roleIds.length === 0) {
            throw new BadRequestException('At least one role is required');
        }

        const roles = await this.roleRepository.find({
            where: {
                id: In(roleIds)
            }
        });
        
        if (roles.length !== roleIds.length) {
            throw new BadRequestException('One or more roles not found');
        }

        return roles;
    }

    private async sendPasswordEmail(user: User, password: string): Promise<void> {
        // TODO: Implement email service
        logger.info(`Password for ${user.username}: ${password}`);
        // In production, this would send an actual email
    }

    private mapToUserResponse(user: User): UserResponseDto {
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
            roles: user.roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description
            })),
            permissions: user.roles.flatMap(role => 
                role.permissions?.map(p => p.name) || []
            ),
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


}