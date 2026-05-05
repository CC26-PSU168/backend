import { prisma } from '../config/database';
import { CreateSplitBillInput } from '../validators/splitbill.validator';

export class SplitBillService {
  static async getAll(userId: string, status?: string) {
    const where: any = { userId };
    if (status === 'settled') where.isSettled = true;
    if (status === 'pending') where.isSettled = false;

    const bills = await prisma.splitBill.findMany({
      where,
      include: { participants: true },
      orderBy: { createdAt: 'desc' },
    });

    return bills.map((b) => ({
      ...b,
      totalAmount: Number(b.totalAmount),
      participants: b.participants.map((p) => ({
        ...p,
        shareAmount: Number(p.shareAmount),
      })),
    }));
  }

  static async create(userId: string, data: CreateSplitBillInput) {
    return prisma.splitBill.create({
      data: {
        userId,
        title: data.title,
        totalAmount: data.totalAmount,
        date: new Date(data.date),
        participants: {
          create: data.participants.map((p) => ({
            name: p.name,
            shareAmount: p.shareAmount,
          })),
        },
      },
      include: { participants: true },
    });
  }

  static async delete(userId: string, id: string) {
    const bill = await prisma.splitBill.findUnique({ where: { id } });
    if (!bill) throw { statusCode: 404, message: 'Split bill tidak ditemukan' };
    if (bill.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    return prisma.splitBill.delete({ where: { id } });
  }

  static async markParticipantPaid(userId: string, splitBillId: string, participantId: string) {
    const bill = await prisma.splitBill.findUnique({ where: { id: splitBillId } });
    if (!bill) throw { statusCode: 404, message: 'Split bill tidak ditemukan' };
    if (bill.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    const participant = await prisma.splitBillParticipant.findUnique({ where: { id: participantId } });
    if (!participant || participant.splitBillId !== splitBillId) {
      throw { statusCode: 404, message: 'Peserta tidak ditemukan' };
    }

    const updated = await prisma.splitBillParticipant.update({
      where: { id: participantId },
      data: {
        isPaid: !participant.isPaid,
        paidAt: !participant.isPaid ? new Date() : null,
      },
    });

    // Auto-settle if all participants are paid
    const allParticipants = await prisma.splitBillParticipant.findMany({
      where: { splitBillId },
    });
    const allPaid = allParticipants.every((p) =>
      p.id === participantId ? !participant.isPaid : p.isPaid
    );

    if (allPaid) {
      await prisma.splitBill.update({
        where: { id: splitBillId },
        data: { isSettled: true },
      });
    }

    return updated;
  }

  static async settleBill(userId: string, id: string) {
    const bill = await prisma.splitBill.findUnique({ where: { id } });
    if (!bill) throw { statusCode: 404, message: 'Split bill tidak ditemukan' };
    if (bill.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    await prisma.$transaction([
      prisma.splitBillParticipant.updateMany({
        where: { splitBillId: id },
        data: { isPaid: true, paidAt: new Date() },
      }),
      prisma.splitBill.update({
        where: { id },
        data: { isSettled: true },
      }),
    ]);

    return prisma.splitBill.findUnique({
      where: { id },
      include: { participants: true },
    });
  }
}
