import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  static async getAll(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async markAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw { statusCode: 404, message: 'Notifikasi tidak ditemukan' };
    }
    if (notification.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async delete(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw { statusCode: 404, message: 'Notifikasi tidak ditemukan' };
    }
    if (notification.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    await prisma.notification.delete({ where: { id } });
    return { message: 'Notifikasi berhasil dihapus' };
  }

  static async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || null,
      },
    });
  }
}
