import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../helpers/response.helper';
import { verifyRefreshToken, generateTokenPair } from '../helpers/jwt.helper';
import { AuthRequest } from '../middlewares/authenticate';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(res, 201, 'Registrasi berhasil', result);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.statusCode, error.message);
        return;
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, 200, 'Login berhasil', result);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.statusCode, error.message);
        return;
      }
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        sendError(res, 400, 'Refresh token diperlukan');
        return;
      }

      const decoded = verifyRefreshToken(refreshToken);
      const tokens = generateTokenPair({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      sendSuccess(res, 200, 'Token berhasil diperbarui', tokens);
    } catch (error: any) {
      sendError(res, 401, 'Refresh token tidak valid');
      return;
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        sendError(res, 401, 'Autentikasi diperlukan');
        return;
      }

      const user = await AuthService.getProfile(req.user.userId);
      sendSuccess(res, 200, 'Profil berhasil diambil', user);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.statusCode, error.message);
        return;
      }
      next(error);
    }
  }
  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const authData = req.user as any;
      if (!authData || !authData.accessToken) {
        res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
        return;
      }

      // Redirect to frontend callback page with tokens in query params
      const redirectUrl = new URL(`${process.env.CLIENT_URL}/auth/callback`);
      redirectUrl.searchParams.append('accessToken', authData.accessToken);
      redirectUrl.searchParams.append('refreshToken', authData.refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_error`);
    }
  }
}
