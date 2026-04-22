import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../helpers/jwt.helper';
import { sendError } from '../helpers/response.helper';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'Token autentikasi tidak ditemukan');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    sendError(res, 401, 'Token tidak valid atau sudah kadaluarsa');
    return;
  }
};
