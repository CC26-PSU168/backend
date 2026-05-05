import { Request, Response, NextFunction } from 'express';
import { SplitBillService } from '../services/splitbill.service';
import { sendSuccess, sendError } from '../helpers/response.helper';
import { splitBillQuerySchema } from '../validators/splitbill.validator';

export class SplitBillController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const query = splitBillQuerySchema.parse(req.query);
      const bills = await SplitBillService.getAll(req.user.userId, query.status);
      sendSuccess(res, 200, 'Daftar split bill berhasil diambil', bills);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const bill = await SplitBillService.create(req.user.userId, req.body);
      sendSuccess(res, 201, 'Split bill berhasil dibuat', bill);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      await SplitBillService.delete(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Split bill berhasil dihapus');
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async markParticipantPaid(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const result = await SplitBillService.markParticipantPaid(
        req.user.userId,
        req.params.id as string,
        req.params.participantId as string,
      );
      sendSuccess(res, 200, 'Status pembayaran berhasil diperbarui', result);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }

  static async settleBill(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) { sendError(res, 401, 'Autentikasi diperlukan'); return; }
      const result = await SplitBillService.settleBill(req.user.userId, req.params.id as string);
      sendSuccess(res, 200, 'Split bill berhasil diselesaikan', result);
    } catch (error: any) {
      if (error.statusCode) { sendError(res, error.statusCode, error.message); return; }
      next(error);
    }
  }
}
