import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { sendSuccess } from '../helpers/response.helper';

export class ProfileController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.getProfile(req.user!.userId);
      sendSuccess(res, 200, 'Berhasil mengambil profil', profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, 200, 'Profil berhasil diperbarui', profile);
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await ProfileService.updatePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.updateNotifications(req.user!.userId, req.body);
      sendSuccess(res, 200, 'Preferensi notifikasi diperbarui', profile);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      const result = await ProfileService.deleteAccount(req.user!.userId, password);
      sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}
