import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { sendSuccess, sendError } from '../helpers/response.helper';
import { queryTransactionSchema, summaryQuerySchema, trendQuerySchema } from '../validators/transaction.validator';

export class TransactionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const query = queryTransactionSchema.parse(req.query);
      const result = await TransactionService.getAll(req.user.userId, query);
      sendSuccess(res, 200, 'Daftar transaksi berhasil diambil', result);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const transaction = await TransactionService.getById(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Detail transaksi berhasil diambil', transaction);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const transaction = await TransactionService.create(req.user.userId, req.body);
      sendSuccess(res, 201, 'Transaksi berhasil ditambahkan', transaction);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const transaction = await TransactionService.update(req.user.userId, req.params.id as string, req.body);
      sendSuccess(res, 200, 'Transaksi berhasil diperbarui', transaction);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      await TransactionService.delete(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Transaksi berhasil dihapus');
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const query = summaryQuerySchema.parse(req.query);
      const summary = await TransactionService.getSummary(req.user.userId, query.month, query.year);
      sendSuccess(res, 200, 'Ringkasan transaksi berhasil diambil', summary);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async getMonthlyTrend(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const query = trendQuerySchema.parse(req.query);
      const trend = await TransactionService.getMonthlyTrend(req.user.userId, query.months);
      sendSuccess(res, 200, 'Tren bulanan berhasil diambil', trend);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }

      const query = summaryQuerySchema.parse(req.query);
      const data = await TransactionService.getByCategory(req.user.userId, query.month, query.year);
      sendSuccess(res, 200, 'Data per kategori berhasil diambil', data);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await TransactionService.exportCsv(req.user!.userId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
