const { PrismaClient, TransactionType, SavingsTransactionType, PaymentFrequency } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv/config');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create demo user
  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@Budgetly.com' },
    update: {},
    create: {
      name: 'Adrian Wijaya',
      email: 'demo@Budgetly.com',
      passwordHash,
      university: 'Universitas Indonesia',
      monthlyAllowance: 4500000,
      avatarUrl: null,
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // 2. Create transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const transactions = await Promise.all([
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.INCOME, date: new Date(currentYear, currentMonth, 1), amount: 4500000, category: 'Uang Saku', paymentMethod: 'BANK', description: 'Kiriman bulanan dari orang tua' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.INCOME, date: new Date(currentYear, currentMonth, 10), amount: 750000, category: 'Freelance', paymentMethod: 'E-WALLET', description: 'Project design logo UMKM' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 2), amount: 25000, category: 'Makanan & Minuman', paymentMethod: 'E-WALLET', description: 'Warmindo Abadi', notes: 'Nasi goreng + es teh', isAutoCateg: true },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 3), amount: 45000, category: 'Makanan & Minuman', paymentMethod: 'CASH', description: 'Kopi Kenangan Sunset', notes: 'Americano + Croissant' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 4), amount: 15000, category: 'Transportasi', paymentMethod: 'E-WALLET', description: 'Grab ke kampus' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 5), amount: 350000, category: 'Pendidikan', paymentMethod: 'BANK', description: 'Beli buku Algoritma Cormen' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 6), amount: 100000, category: 'Hiburan & Lifestyle', paymentMethod: 'E-WALLET', description: 'Nonton Bioskop XXI', notes: 'Film Marvel baru' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 7), amount: 200000, category: 'Belanja', paymentMethod: 'E-WALLET', description: 'Shopee - Case HP + Charger' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 8), amount: 30000, category: 'Makanan & Minuman', paymentMethod: 'CASH', description: 'Makan siang kantin' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 9), amount: 75000, category: 'Transportasi', paymentMethod: 'E-WALLET', description: 'Top up KRL + Grab' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 10), amount: 55000, category: 'Langganan', paymentMethod: 'BANK', description: 'Spotify Premium Student' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 11), amount: 18000, category: 'Makanan & Minuman', paymentMethod: 'CASH', description: 'Indomie Goreng double + telur' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 12), amount: 500000, category: 'Kesehatan', paymentMethod: 'BANK', description: 'Konsultasi dokter gigi' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 13), amount: 120000, category: 'Makanan & Minuman', paymentMethod: 'E-WALLET', description: 'Dinner Yoshinoya', notes: 'Berdua bareng temen' },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: TransactionType.EXPENSE, date: new Date(currentYear, currentMonth, 14), amount: 35000, category: 'Transportasi', paymentMethod: 'E-WALLET', description: 'Gojek pulang malam' },
    }),
  ]);

  console.log(`✅ ${transactions.length} transactions created`);

  // 3. Create budgets
  const budgets = await Promise.all([
    prisma.budget.create({ data: { userId: user.id, category: 'Makanan & Minuman', limitAmount: 1200000, month: currentMonth + 1, year: currentYear } }),
    prisma.budget.create({ data: { userId: user.id, category: 'Transportasi', limitAmount: 500000, month: currentMonth + 1, year: currentYear } }),
    prisma.budget.create({ data: { userId: user.id, category: 'Hiburan & Lifestyle', limitAmount: 400000, month: currentMonth + 1, year: currentYear } }),
    prisma.budget.create({ data: { userId: user.id, category: 'Pendidikan', limitAmount: 600000, month: currentMonth + 1, year: currentYear } }),
  ]);

  console.log(`✅ ${budgets.length} budgets created`);

  // 4. Create savings goals
  const savingsGoals = await Promise.all([
    prisma.savingsGoal.create({ data: { userId: user.id, name: 'Beli Laptop', targetAmount: 12000000, currentAmount: 8040000, icon: 'laptop' } }),
    prisma.savingsGoal.create({ data: { userId: user.id, name: 'Liburan Jogja', targetAmount: 3000000, currentAmount: 1350000, deadline: new Date(currentYear, currentMonth + 3, 1), icon: 'flight' } }),
    prisma.savingsGoal.create({ data: { userId: user.id, name: 'Dana Darurat', targetAmount: 5000000, currentAmount: 4100000, icon: 'shield' } }),
  ]);

  for (const goal of savingsGoals) {
    await prisma.savingsTransaction.create({
      data: { goalId: goal.id, userId: user.id, amount: goal.currentAmount, type: SavingsTransactionType.DEPOSIT, note: 'Setoran awal' },
    });
  }

  console.log(`✅ ${savingsGoals.length} savings goals created`);

  // 5. Create split bill
  const splitBill = await prisma.splitBill.create({
    data: {
      userId: user.id,
      title: 'Dinner at Kopi Kenangan',
      totalAmount: 450000,
      date: new Date(currentYear, currentMonth, 12),
      participants: {
        create: [
          { name: 'Rizky', shareAmount: 112500, isPaid: true, paidAt: new Date() },
          { name: 'Adit', shareAmount: 112500, isPaid: false },
          { name: 'Santi', shareAmount: 112500, isPaid: false },
          { name: 'Adrian (Kamu)', shareAmount: 112500, isPaid: true, paidAt: new Date() },
        ],
      },
    },
  });

  console.log(`✅ Split bill created: ${splitBill.title}`);

  // 6. Create scheduled payments
  const payments = await Promise.all([
    prisma.scheduledPayment.create({ data: { userId: user.id, name: 'Uang Kos', amount: 1500000, category: 'Tempat Tinggal', dueDay: 1, frequency: PaymentFrequency.MONTHLY, nextDueDate: new Date(currentYear, currentMonth + 1, 1) } }),
    prisma.scheduledPayment.create({ data: { userId: user.id, name: 'WiFi Indihome', amount: 350000, category: 'Langganan', dueDay: 15, frequency: PaymentFrequency.MONTHLY, nextDueDate: new Date(currentYear, currentMonth, 15) } }),
  ]);

  console.log(`✅ ${payments.length} scheduled payments created`);
  console.log('\n🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
