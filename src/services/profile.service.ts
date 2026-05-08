import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

export class ProfileService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        monthlyAllowance: true,
        avatarUrl: true,
        provider: true,
        notifBudgetAlert: true,
        notifWeeklyReport: true,
      },
    });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    return user;
  }

  static async updateProfile(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        university: data.university,
        monthlyAllowance: data.monthlyAllowance,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        monthlyAllowance: true,
        avatarUrl: true,
        provider: true,
      },
    });
  }

  static async updatePassword(userId: string, currentPassword?: string, newPassword?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
    
    if (user.provider !== 'CREDENTIALS') {
      throw { statusCode: 400, message: 'Akun ini terhubung dengan Google. Password tidak dapat diubah dari sini.' };
    }
    if (!currentPassword || !newPassword) {
      throw { statusCode: 400, message: 'Password saat ini dan password baru harus diisi' };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!isValid) {
      throw { statusCode: 401, message: 'Password saat ini salah' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password berhasil diubah' };
  }

  static async updateNotifications(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        notifBudgetAlert: data.notifBudgetAlert,
        notifWeeklyReport: data.notifWeeklyReport,
      },
    });
  }

  static async deleteAccount(userId: string, password?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };

    // For credentials users, verify password before deletion
    if (user.provider === 'CREDENTIALS') {
      if (!password) {
        throw { statusCode: 400, message: 'Password harus diisi untuk menghapus akun' };
      }
      const isValid = await bcrypt.compare(password, user.passwordHash || '');
      if (!isValid) {
        throw { statusCode: 401, message: 'Password salah' };
      }
    }

    // Cascade delete is handled by Prisma schema (onDelete: Cascade)
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Akun berhasil dihapus' };
  }
}
