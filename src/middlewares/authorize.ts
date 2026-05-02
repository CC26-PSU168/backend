import { Request, Response, NextFunction } from 'express';
import { sendError } from '../helpers/response.helper';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Autentikasi diperlukan');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 403, 'Anda tidak memiliki akses ke resource ini');
      return;
    }

    next();
  };
};
