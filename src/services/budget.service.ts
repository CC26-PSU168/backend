import { prisma } from '../config/database';
import { CreateBudgetInput, UpdateBudgetInput } from '../validators/budget.validator';

export class BudgetService {
  /**
   * Get all budgets for a user in a given month/year, with spent amounts calculated from transactions.
   */
  static async getAll(userId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { userId, month: m, year: y },
      orderBy: { category: 'asc' },
    });

    // Calculate spent per category from EXPENSE transactions in the same period
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const spentByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const spentMap = new Map<string, number>();
    for (const item of spentByCategory) {
      spentMap.set(item.category, Number(item._sum.amount) || 0);
    }

    return budgets.map((b) => ({
      ...b,
      limitAmount: Number(b.limitAmount),
      spent: spentMap.get(b.category) || 0,
      remaining: Number(b.limitAmount) - (spentMap.get(b.category) || 0),
      percentage: Number(b.limitAmount) > 0
        ? Math.round(((spentMap.get(b.category) || 0) / Number(b.limitAmount)) * 100)
        : 0,
    }));
  }

  /**
   * Get budget overview: total budget, total spent, overall percentage.
   */
  static async getOverview(userId: string, month?: number, year?: number) {
    const budgets = await this.getAll(userId, month, year);

    const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      categories: budgets,
    };
  }

  /**
   * Create or update a budget entry (upsert).
   */
  static async create(userId: string, data: CreateBudgetInput) {
    return prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId,
          category: data.category,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        limitAmount: data.limitAmount,
      },
      create: {
        userId,
        category: data.category,
        limitAmount: data.limitAmount,
        month: data.month,
        year: data.year,
      },
    });
  }

  /**
   * Update a budget's limit amount.
   */
  static async update(userId: string, id: string, data: UpdateBudgetInput) {
    const budget = await prisma.budget.findUnique({ where: { id } });

    if (!budget) {
      throw { statusCode: 404, message: 'Budget tidak ditemukan' };
    }
    if (budget.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    return prisma.budget.update({
      where: { id },
      data: { limitAmount: data.limitAmount },
    });
  }

  /**
   * Delete a budget entry.
   */
  static async delete(userId: string, id: string) {
    const budget = await prisma.budget.findUnique({ where: { id } });

    if (!budget) {
      throw { statusCode: 404, message: 'Budget tidak ditemukan' };
    }
    if (budget.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    return prisma.budget.delete({ where: { id } });
  }

  /**
   * Check budget usage after a transaction and trigger notifications if needed.
   */
  static async checkBudgetUsage(userId: string, category: string, date: Date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const budget = await prisma.budget.findUnique({
      where: {
        userId_category_month_year: {
          userId,
          category,
          month,
          year,
        },
      },
      include: { user: true },
    });

    if (!budget || !budget.user.notifBudgetAlert) return;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const spentResult = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        category,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const spent = Number(spentResult._sum.amount) || 0;
    const limit = Number(budget.limitAmount);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    if (percentage >= 80) {
      const isCritical = percentage >= 100;
      
      // Check if we already notified for this severity this month
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'BUDGET_ALERT',
          createdAt: { gte: startDate, lte: endDate },
          message: { contains: category },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Avoid spamming. Only notify if we haven't notified yet, OR if we previously
      // notified for 80% but now it's 100% (critical).
      const alreadyNotifiedCritical = existingNotif?.message.includes('melebihi');
      const alreadyNotifiedWarning = existingNotif !== null;

      if (isCritical && !alreadyNotifiedCritical) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'BUDGET_ALERT',
            title: 'Budget Kritis 🚨',
            message: `Pengeluaran "${category}" kamu sudah melebihi batas budget bulan ini.`,
            metadata: { category, percentage, spent, limit },
          },
        });
      } else if (!isCritical && !alreadyNotifiedWarning) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'BUDGET_ALERT',
            title: 'Hati-hati ⚠️',
            message: `Pengeluaran "${category}" kamu sudah mencapai ${Math.round(percentage)}% dari budget.`,
            metadata: { category, percentage, spent, limit },
          },
        });
      }
    }
  }
}
