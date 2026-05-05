import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../helpers/response.helper';

export class NotificationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getAll(req.user!.userId);
      const unreadCount = await NotificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, 200, 'Berhasil mengambil notifikasi', { notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await NotificationService.markAsRead(req.user!.userId, req.params.id as string);
      sendSuccess(res, 200, 'Notifikasi ditandai dibaca', notification);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, 200, 'Semua notifikasi ditandai dibaca');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.delete(req.user!.userId, req.params.id as string);
      sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}
