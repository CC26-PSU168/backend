import { Request, Response, NextFunction } from 'express';
import { SavingsService } from '../services/savings.service';
import { sendSuccess, sendError } from '../helpers/response.helper';

export class SavingsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const goals = await SavingsService.getAll(req.user.userId);
      sendSuccess(res, 200, 'Daftar savings goal berhasil diambil', goals);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const goal = await SavingsService.create(req.user.userId, req.body);
      sendSuccess(res, 201, 'Savings goal berhasil ditambahkan', goal);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const goal = await SavingsService.update(req.user.userId, req.params.id as string, req.body);
      sendSuccess(res, 200, 'Savings goal berhasil diperbarui', goal);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      await SavingsService.delete(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Savings goal berhasil dihapus');
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async deposit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const result = await SavingsService.deposit(req.user.userId, req.params.id as string, req.body);
      sendSuccess(res, 200, 'Dana berhasil ditambahkan', result);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const result = await SavingsService.withdraw(req.user.userId, req.params.id as string, req.body);
      sendSuccess(res, 200, 'Dana berhasil ditarik', result);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }
}
