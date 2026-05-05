import { prisma } from '../config/database';
import { CreateGoalInput, UpdateGoalInput, DepositWithdrawInput } from '../validators/savings.validator';

export class SavingsService {
  static async getAll(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      percentage: Number(g.targetAmount) > 0
        ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
        : 0,
    }));
  }

  static async create(userId: string, data: CreateGoalInput) {
    return prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        icon: data.icon || null,
      },
    });
  }

  static async update(userId: string, id: string, data: UpdateGoalInput) {
    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw { statusCode: 404, message: 'Goal tidak ditemukan' };
    if (goal.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    return prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
    });
  }

  static async delete(userId: string, id: string) {
    const goal = await prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw { statusCode: 404, message: 'Goal tidak ditemukan' };
    if (goal.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    return prisma.savingsGoal.delete({ where: { id } });
  }

  static async deposit(userId: string, goalId: string, data: DepositWithdrawInput) {
    const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw { statusCode: 404, message: 'Goal tidak ditemukan' };
    if (goal.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    const newAmount = Number(goal.currentAmount) + data.amount;
    const isCompleted = newAmount >= Number(goal.targetAmount);

    // Use a transaction to ensure atomicity
    const [savingsTx, updatedGoal, _generalTx] = await prisma.$transaction([
      prisma.savingsTransaction.create({
        data: {
          goalId,
          userId,
          amount: data.amount,
          type: 'DEPOSIT',
          note: data.note || null,
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          isCompleted,
        },
      }),
      // Create an EXPENSE transaction in the main ledger
      prisma.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount: data.amount,
          category: 'Goals',
          paymentMethod: 'Other',
          description: data.note || `Top Up Tabungan: ${goal.name}`,
          date: new Date(),
        },
      }),
    ]);

    return { transaction: savingsTx, goal: updatedGoal };
  }

  static async withdraw(userId: string, goalId: string, data: DepositWithdrawInput) {
    const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw { statusCode: 404, message: 'Goal tidak ditemukan' };
    if (goal.userId !== userId) throw { statusCode: 403, message: 'Akses ditolak' };

    if (data.amount > Number(goal.currentAmount)) {
      throw { statusCode: 400, message: 'Saldo tidak mencukupi untuk penarikan' };
    }

    const newAmount = Number(goal.currentAmount) - data.amount;

    const [savingsTx, updatedGoal, _generalTx] = await prisma.$transaction([
      prisma.savingsTransaction.create({
        data: {
          goalId,
          userId,
          amount: data.amount,
          type: 'WITHDRAWAL',
          note: data.note || null,
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          isCompleted: false,
        },
      }),
      // Create an INCOME transaction in the main ledger
      prisma.transaction.create({
        data: {
          userId,
          type: 'INCOME',
          amount: data.amount,
          category: 'Goals',
          paymentMethod: 'Other',
          description: data.note || `Tarik Tabungan: ${goal.name}`,
          date: new Date(),
        },
      }),
    ]);

    return { transaction: savingsTx, goal: updatedGoal };
  }
}
