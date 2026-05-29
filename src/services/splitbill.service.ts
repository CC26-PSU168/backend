/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../config/database';
import { CreateSplitBillInput } from '../validators/splitbill.validator';

interface ItemInput {
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

interface AssignmentInput {
  itemIndex: number;
  assignees: {
    participantIndex: number;
    qty: number;
  }[];
}

interface ParticipantInput {
  name: string;
}

export class SplitBillService {
  static async getAll(userId: string, status?: string) {
    const where: { userId: string; isSettled?: boolean } = { userId };
    if (status === 'settled') where.isSettled = true;
    if (status === 'pending') where.isSettled = false;

    const bills = await (prisma as any).splitBill.findMany({
      where,
      include: {
        participants: true,
        items: {
          include: {
            assignments: {
              include: { participant: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bills.map((b: any) => ({
      ...b,
      totalAmount: Number(b.totalAmount),
      participants: b.participants.map((p: any) => ({
        ...p,
        shareAmount: Number(p.shareAmount),
      })),
      items: b.items.map((item: any) => ({
        id: item.id,
        splitBillId: item.splitBillId,
        name: item.name,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt,
        assignments: item.assignments.map((a: any) => ({
          name: a.participant.name,
          qty: a.qty,
        })),
      })),
    }));
  }

  static async create(userId: string, data: CreateSplitBillInput) {
    const { title, date, splitMethod } = data;
    const items = data.items as ItemInput[];
    const participants = data.participants as ParticipantInput[];
    const assignments = (data.assignments ?? []) as AssignmentInput[];

    // Hitung totalAmount dari items — SINGLE SOURCE OF TRUTH
    const totalAmount = items.reduce((sum: number, item: ItemInput) => sum + item.subtotal, 0);

    // Hitung shareAmount per participant di BE
    const shareMap: Record<number, number> = {};

    if (splitMethod === 'equal') {
      const share = Math.round(totalAmount / participants.length);
      participants.forEach((_: ParticipantInput, i: number) => {
        shareMap[i] = share;
      });
    } else {
      participants.forEach((_: ParticipantInput, i: number) => {
        shareMap[i] = 0;
      });

      assignments.forEach(({ itemIndex, assignees }: AssignmentInput) => {
        const item = items[itemIndex];
        assignees.forEach(({ participantIndex: pIdx, qty }) => {
          const splitAmount = Math.round((item.unitPrice * qty));
          shareMap[pIdx] = (shareMap[pIdx] ?? 0) + splitAmount;
        });
      });
    }

    return (prisma as any).$transaction(async (tx: any) => {
      // 1. Buat SplitBill
      const bill = await tx.splitBill.create({
        data: {
          userId,
          title,
          totalAmount,
          date: new Date(date),
        },
      });

      // 2. Buat participants — simpan array untuk mapping index → id
      const createdParticipants = await Promise.all(
        participants.map((p: ParticipantInput, i: number) =>
          tx.splitBillParticipant.create({
            data: {
              splitBillId: bill.id,
              name: p.name,
              shareAmount: shareMap[i] ?? 0,
            },
          })
        )
      );

      // 3. Buat items — simpan array untuk mapping index → id
      const createdItems = await Promise.all(
        items.map((item: ItemInput) =>
          tx.splitBillItem.create({
            data: {
              splitBillId: bill.id,
              name: item.name,
              qty: item.qty,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            },
          })
        )
      );

      // 4. Buat assignments (item ↔ participant)
      if (splitMethod === 'item' && assignments.length > 0) {
        await Promise.all(
          assignments.flatMap(({ itemIndex, assignees }: AssignmentInput) =>
            assignees.map(({ participantIndex: pIdx, qty }) =>
              tx.splitBillItemAssignment.create({
                data: {
                  itemId: createdItems[itemIndex].id,
                  participantId: createdParticipants[pIdx].id,
                  qty: qty,
                },
              })
            )
          )
        );
      } else {
        // Equal split: semua item → semua participant
        await Promise.all(
          createdItems.flatMap((item: any) =>
            createdParticipants.map((p: any) =>
              tx.splitBillItemAssignment.create({
                data: {
                  itemId: item.id,
                  participantId: p.id,
                },
              })
            )
          )
        );
      }

      return tx.splitBill.findUnique({
        where: { id: bill.id },
        include: {
          participants: true,
          items: {
            include: {
              assignments: {
                include: { participant: true },
              },
            },
          },
        },
      });
    });
  }

  static async delete(userId: string, id: string) {
    const bill = await (prisma as any).splitBill.findUnique({ where: { id } });
    if (!bill) throw { statusCode: 404, message: 'Split bill tidak ditemukan' };
    if (bill.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };
    return (prisma as any).splitBill.delete({ where: { id } });
  }

  static async markParticipantPaid(
    userId: string,
    splitBillId: string,
    participantId: string
  ) {
    const bill = await (prisma as any).splitBill.findUnique({ where: { id: splitBillId } });
    if (!bill) throw { statusCode: 404, message: 'Split bill tidak ditemukan' };
    if (bill.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    const participant = await (prisma as any).splitBillParticipant.findUnique({
      where: { id: participantId },
    });
    if (!participant || participant.splitBillId !== splitBillId) {
      throw { statusCode: 404, message: 'Peserta tidak ditemukan' };
    }

    const updated = await (prisma as any).splitBillParticipant.update({
      where: { id: participantId },
      data: {
        isPaid: !participant.isPaid,
        paidAt: !participant.isPaid ? new Date() : null,
      },
    });

    // Auto-settle kalau semua sudah bayar
    const allParticipants = await (prisma as any).splitBillParticipant.findMany({
      where: { splitBillId },
    });
    const allPaid = allParticipants.every((p: any) =>
      p.id === participantId ? !participant.isPaid : p.isPaid
    );
    if (allPaid) {
      await (prisma as any).splitBill.update({
        where: { id: splitBillId },
        data: { isSettled: true },
      });
    }

    return updated;
  }

  static async settleBill(userId: string, id: string) {
    const bill = await (prisma as any).splitBill.findUnique({ where: { id } });
    if (!bill) throw { statusCode: 404, message: 'Split bill tidak ditemukan' };
    if (bill.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    await (prisma as any).$transaction([
      (prisma as any).splitBillParticipant.updateMany({
        where: { splitBillId: id },
        data: { isPaid: true, paidAt: new Date() },
      }),
      (prisma as any).splitBill.update({
        where: { id },
        data: { isSettled: true },
      }),
    ]);

    return (prisma as any).splitBill.findUnique({
      where: { id },
      include: {
        participants: true,
        items: true,
      },
    });
  }
}