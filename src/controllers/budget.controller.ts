import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { sendSuccess, sendError } from '../helpers/response.helper';
import { budgetQuerySchema } from '../validators/budget.validator';

export class BudgetController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const query = budgetQuerySchema.parse(req.query);
      const budgets = await BudgetService.getAll(req.user.userId, query.month, query.year);
      sendSuccess(res, 200, 'Daftar budget berhasil diambil', budgets);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const query = budgetQuerySchema.parse(req.query);
      const overview = await BudgetService.getOverview(req.user.userId, query.month, query.year);
      sendSuccess(res, 200, 'Overview budget berhasil diambil', overview);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const budget = await BudgetService.create(req.user.userId, req.body);
      sendSuccess(res, 201, 'Budget berhasil ditambahkan', budget);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const budget = await BudgetService.update(req.user.userId, req.params.id as string, req.body);
      sendSuccess(res, 200, 'Budget berhasil diperbarui', budget);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      await BudgetService.delete(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Budget berhasil dihapus');
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }
}
