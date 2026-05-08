import { prisma } from '../config/database';
import { CreateTransactionInput, UpdateTransactionInput, QueryTransactionInput } from '../validators/transaction.validator';

export class TransactionService {
  static async getAll(userId: string, query: QueryTransactionInput) {
    const { month, year, type, category, paymentMethod, search, sort, page = 1, limit = 20 } = query;

    const now = new Date();
    const filterMonth = month || now.getMonth() + 1;
    const filterYear = year || now.getFullYear();

    const startDate = new Date(filterYear, filterMonth - 1, 1);
    const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59);

    const where: any = {
      userId,
      date: { gte: startDate, lte: endDate },
    };

    if (type) where.type = type;
    if (category) where.category = category;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { date: 'desc' };
    if (sort) {
      const [field, direction] = sort.split('_');
      orderBy = { [field]: direction };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(userId: string, id: string) {
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      throw { statusCode: 404, message: 'Transaksi tidak ditemukan' };
    }
    if (transaction.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    return transaction;
  }

  static async create(userId: string, data: CreateTransactionInput) {
    // Combine the selected date with the current time
    // so the timestamp reflects when the transaction was created
    const now = new Date();
    const [year, month, day] = data.date.split('-').map(Number);
    const txDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: data.type,
        date: txDate,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        description: data.description,
        notes: data.notes || null,
      },
    });

    if (transaction.type === 'EXPENSE') {
      import('./budget.service').then(({ BudgetService }) => {
        BudgetService.checkBudgetUsage(userId, transaction.category, transaction.date).catch(console.error);
      });
    }

    return transaction;
  }

  static async update(userId: string, id: string, data: UpdateTransactionInput) {
    const existing = await prisma.transaction.findUnique({ where: { id } });

    if (!existing) {
      throw { statusCode: 404, message: 'Transaksi tidak ditemukan' };
    }
    if (existing.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    if (transaction.type === 'EXPENSE') {
      import('./budget.service').then(({ BudgetService }) => {
        BudgetService.checkBudgetUsage(userId, transaction.category, transaction.date).catch(console.error);
      });
    }

    return transaction;
  }

  static async delete(userId: string, id: string) {
    const existing = await prisma.transaction.findUnique({ where: { id } });

    if (!existing) {
      throw { statusCode: 404, message: 'Transaksi tidak ditemukan' };
    }
    if (existing.userId !== userId) {
      throw { statusCode: 403, message: 'Akses ditolak' };
    }

    await prisma.transaction.delete({ where: { id } });
    return { message: 'Transaksi berhasil dihapus' };
  }

  static async getSummary(userId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    // Previous month for comparison
    const prevStartDate = new Date(y, m - 2, 1);
    const prevEndDate = new Date(y, m - 1, 0, 23, 59, 59);

    // Fetch current month, previous month, AND all-time transactions in parallel
    const [currentTransactions, prevTransactions, allTimeTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        select: { type: true, amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: prevStartDate, lte: prevEndDate } },
        select: { type: true, amount: true },
      }),
      // All-time: fetch ALL transactions to calculate cumulative balance
      prisma.transaction.findMany({
        where: { userId },
        select: { type: true, amount: true },
      }),
    ]);

    const calcTotals = (txs: { type: string; amount: any }[]) => {
      let income = 0, expense = 0;
      txs.forEach((t) => {
        const amt = Number(t.amount);
        if (t.type === 'INCOME') income += amt;
        else expense += amt;
      });
      return { income, expense, balance: income - expense };
    };

    const current = calcTotals(currentTransactions);
    const prev = calcTotals(prevTransactions);
    const allTime = calcTotals(allTimeTransactions);

    const pctChange = (curr: number, previous: number) =>
      previous === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - previous) / previous) * 100);

    return {
      income: current.income,
      expense: current.expense,
      balance: allTime.balance, // ← Cumulative all-time balance (not just this month!)
      incomeChange: pctChange(current.income, prev.income),
      expenseChange: pctChange(current.expense, prev.expense),
      balanceChange: pctChange(current.balance, prev.balance),
      month: m,
      year: y,
    };
  }

  static async getMonthlyTrend(userId: string, months: number = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: startDate } },
      select: { type: true, amount: true, date: true },
      orderBy: { date: 'asc' },
    });

    const trendMap = new Map<string, { income: number; expense: number }>();

    // Pre-fill months
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(key, { income: 0, expense: 0 });
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = trendMap.get(key);
      if (entry) {
        const amt = Number(t.amount);
        if (t.type === 'INCOME') entry.income += amt;
        else entry.expense += amt;
      }
    });

    return Array.from(trendMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  static async getByCategory(userId: string, month?: number, year?: number, type?: string) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const where: any = {
      userId,
      date: { gte: startDate, lte: endDate },
      type: type || 'EXPENSE',
    };

    const transactions = await prisma.transaction.findMany({
      where,
      select: { category: true, amount: true },
    });

    const categoryMap = new Map<string, number>();
    transactions.forEach((t) => {
      const amt = Number(t.amount);
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + amt);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0);

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  static async exportCsv(userId: string): Promise<string> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const header = ['Date,Type,Category,Amount,Payment Method,Description,Notes\n'];
    const rows = transactions.map((t) => {
      const date = t.date.toISOString().split('T')[0];
      const type = t.type;
      const category = `"${t.category}"`;
      const amount = t.amount.toString();
      const paymentMethod = `"${t.paymentMethod}"`;
      const description = `"${t.description.replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;

      return `${date},${type},${category},${amount},${paymentMethod},${description},${notes}`;
    });

    return header.concat(rows).join('\n');
  }
}
