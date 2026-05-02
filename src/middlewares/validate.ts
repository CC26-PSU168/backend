import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError } from '../helpers/response.helper';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const formattedErrors = (error as any).errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 400, 'Validasi gagal', formattedErrors);
        return;
      }
      next(error);
    }
  };
};
