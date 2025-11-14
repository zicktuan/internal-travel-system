export class CreateUserDto {
  username!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  displayName?: string;
  phone?: string;
  roleIds!: number[];
  sendPasswordEmail?: boolean;
}

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  isVerified?: boolean;
  roleIds?: number[];
}

export class UserResponseDto {
  id!: number;
  username!: string;
  email!: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  fullName!: string;
  phone?: string;
  avatarUrl?: string;
  isActive!: boolean;
  isVerified!: boolean;
  isLocked!: boolean;
  lastLoginAt?: Date;
  loginAttempts!: number;
  createdAt!: Date;
  updatedAt!: Date;
  roles!: {
    id: number;
    name: string;
    description?: string;
  }[];
  permissions!: string[];
  createdBy?: {
    id: number;
    username: string;
    displayName?: string;
  };
  updatedBy?: {
    id: number;
    username: string;
    displayName?: string;
  };
}

export class ResetPasswordDto {
  newPassword!: string;
}