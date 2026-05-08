import { prisma } from '../config/database';
import { CreateScheduledPaymentInput, UpdateScheduledPaymentInput } from '../validators/scheduledpayment.validator';

export class ScheduledPaymentService {
  static async getAll(userId: string) {
    return prisma.scheduledPayment.findMany({
      where: { userId },
      orderBy: { dueDay: 'asc' },
    });
  }

  static async create(userId: string, data: CreateScheduledPaymentInput) {
    const now = new Date();
    let nextDueDate = new Date(now.getFullYear(), now.getMonth(), data.dueDay);

    // If due day has passed this month, set next due date to next month
    if (nextDueDate < now) {
      nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, data.dueDay);
    }

    return prisma.scheduledPayment.create({
      data: {
        userId,
        name: data.name,
        amount: data.amount,
        category: data.category,
        dueDay: data.dueDay,
        frequency: data.frequency || 'MONTHLY',
        nextDueDate,
        isActive: true,
      },
    });
  }

  static async update(userId: string, id: string, data: UpdateScheduledPaymentInput) {
    const payment = await prisma.scheduledPayment.findUnique({ where: { id } });
    if (!payment) throw { statusCode: 404, message: 'Tagihan tidak ditemukan' };
    if (payment.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    let nextDueDate = payment.nextDueDate;
    if (data.dueDay && data.dueDay !== payment.dueDay) {
      const now = new Date();
      nextDueDate = new Date(now.getFullYear(), now.getMonth(), data.dueDay);
      if (nextDueDate < now) {
        nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, data.dueDay);
      }
    }

    return prisma.scheduledPayment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        nextDueDate,
      },
    });
  }

  static async toggleActive(userId: string, id: string) {
    const payment = await prisma.scheduledPayment.findUnique({ where: { id } });
    if (!payment) throw { statusCode: 404, message: 'Tagihan tidak ditemukan' };
    if (payment.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    return prisma.scheduledPayment.update({
      where: { id },
      data: { isActive: !payment.isActive },
    });
  }

  static async delete(userId: string, id: string) {
    const payment = await prisma.scheduledPayment.findUnique({ where: { id } });
    if (!payment) throw { statusCode: 404, message: 'Tagihan tidak ditemukan' };
    if (payment.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    return prisma.scheduledPayment.delete({ where: { id } });
  }

  static async markPaid(userId: string, id: string) {
    const payment = await prisma.scheduledPayment.findUnique({ where: { id } });
    if (!payment) throw { statusCode: 404, message: 'Tagihan tidak ditemukan' };
    if (payment.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    // Advance nextDueDate to next period
    const current = payment.nextDueDate;
    let nextDue: Date;
    if (payment.frequency === 'WEEKLY') {
      nextDue = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (payment.frequency === 'MONTHLY') {
      nextDue = new Date(current.getFullYear(), current.getMonth() + 1, payment.dueDay);
    } else {
      // YEARLY: advance to next year
      nextDue = new Date(current.getFullYear() + 1, current.getMonth(), payment.dueDay);
    }

    const [updatedPayment, _tx] = await prisma.$transaction([
      prisma.scheduledPayment.update({
        where: { id },
        data: {
          nextDueDate: nextDue,
        },
      }),
      // Create EXPENSE transaction for this payment
      prisma.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: payment.amount,
          category: payment.category,
          paymentMethod: 'Other',
          description: `Bayar Tagihan: ${payment.name}`,
          date: new Date(),
        },
      }),
    ]);

    return updatedPayment;
  }
}
