export class LoginDto {
  username!: string;
  password!: string;

  constructor(data?: Partial<LoginDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  tokenType!: string;
  expiresIn!: number;
  user!: any;
  permissions!: string[];
  roles!: string[];

  constructor(data?: Partial<AuthResponseDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;

  constructor(data?: Partial<ChangePasswordDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class RefreshTokenDto {
  refreshToken!: string;

  constructor(data?: Partial<RefreshTokenDto>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}