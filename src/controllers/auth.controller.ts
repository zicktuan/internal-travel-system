import { Request, Response } from "express";
import { LoginDto } from "../dto/auth.dto";
import { AuthService } from "../services/auth.service";
import logger from "../utils/logger";
import { ApiResponseHandler } from "../utils/response";
import { verifyToken } from "../utils/jwt";
import { TokenType } from "../common/enums";

export class AuthController {
    private authService = new AuthService();

    async login(req: Request, res: Response): Promise<void> {
        try {
            const loginDto: LoginDto = req.body;
            const result = await this.authService.login(loginDto);

            ApiResponseHandler.success(res, 'Login successfully!', result);
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.user?.userId as string, 10);
            const user = await this.authService.getProfile(userId);

            ApiResponseHandler.success(res, 'Profile retrieved successfully!', user);
        } catch (error) {
            logger.error('Get profile error:', error);
            throw error;
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.user?.userId as string, 10);
            const { currentPassword, newPassword } = req.body;
            
            await this.authService.changePassword(userId, currentPassword, newPassword);

            ApiResponseHandler.success(res, 'Password changed successfully!');
        } catch (error) {
            logger.error('Change password error:', error);
            throw error;
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            // Verify refresh token
            const decoded = verifyToken(refreshToken, TokenType.REFRESH);
            const userId = parseInt(decoded.userId, 10);

            const tokens = await this.authService.refreshToken(userId);

            ApiResponseHandler.success(res, 'Token refreshed successfully!', {
                ...tokens,
                tokenType: 'Bearer',
                exporesIn: 900
            });
        } catch (error) {
            logger.error('Refresh token error:', error);
            throw error;
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        ApiResponseHandler.success(res, 'Logout successful!');
    }
}

export const authController = new AuthController();