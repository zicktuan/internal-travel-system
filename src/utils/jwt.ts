import jwt from 'jsonwebtoken';
import logger from './logger';
import { TokenType } from '../common/enums';
import { JWT_CONFIG } from '../common/constants';

export interface JwtPayload {
    userId: string;
    username: string;
    email: string;
    type: TokenType;
    // iat: number;
    // exp: number;
}

export const generateToken = (payload: Omit<JwtPayload, 'type'>, type: TokenType = TokenType.ACCESS): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const expiresIn = type === TokenType.ACCESS
      ? JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN
      : JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN;

    const tokenPayload: JwtPayload = {
      ...payload,
      type
    }

    return jwt.sign(tokenPayload, secret, {
      expiresIn,
      issuer: 'travel-system-internal',
      subject: payload.userId
    } as jwt.SignOptions);
}

export const verifyToken = (token: string, expectedType?: TokenType): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (expectedType && decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected: ${expectedType}, Got: ${decoded.type}`);
    }
    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error);

    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }

    throw error;
  }
};

// Optional: Generate refresh token
export const generateRefreshToken = (payload: JwtPayload): string => {
  return generateToken(payload, TokenType.REFRESH);
};

export const generateResetPasswordToken = (payload: Omit<TokenType, 'type'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { ...payload, type: TokenType.RESET_PASSWORD },
    secret,
    { expiresIn: JWT_CONFIG.RESET_PASSWORD_EXPIRES_IN }
  );
}
