import { Request, Response, NextFunction } from 'express';
import { sendError } from '../helpers/response.helper';
import { env } from '../config/env';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error(`[ERROR] ${err.message}`, env.NODE_ENV === 'development' ? err.stack : '');

  sendError(
    res,
    500,
    env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan internal server'
      : err.message
  );
};
