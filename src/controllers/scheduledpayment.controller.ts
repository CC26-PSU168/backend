import { Request, Response, NextFunction } from 'express';
import { ScheduledPaymentService } from '../services/scheduledpayment.service';
import { sendSuccess, sendError } from '../helpers/response.helper';

export class ScheduledPaymentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const payments = await ScheduledPaymentService.getAll(req.user.userId);
      sendSuccess(res, 200, 'Daftar tagihan rutin berhasil diambil', payments);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const payment = await ScheduledPaymentService.create(req.user.userId, req.body);
      sendSuccess(res, 201, 'Tagihan rutin berhasil dibuat', payment);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const payment = await ScheduledPaymentService.update(req.user.userId, req.params.id as string, req.body);
      sendSuccess(res, 200, 'Tagihan rutin berhasil diperbarui', payment);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const payment = await ScheduledPaymentService.toggleActive(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Status tagihan berhasil diubah', payment);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      await ScheduledPaymentService.delete(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Tagihan rutin berhasil dihapus');
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const payment = await ScheduledPaymentService.markPaid(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Tagihan berhasil ditandai lunas', payment);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }
}
