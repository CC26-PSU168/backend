import { Request, Response, NextFunction } from 'express';
import { InvestmentService } from '../services/investment.service';
import { sendSuccess } from '../helpers/response.helper';

export class InvestmentController {
  static async getPrices(_req: Request, res: Response, next: NextFunction) {
    try {
      const prices = await InvestmentService.getPrices();
      sendSuccess(res, 200, 'Berhasil mengambil data investasi', prices);
    } catch (error) {
      next(error);
    }
  }
}
