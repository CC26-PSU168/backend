import { z } from 'zod';

export const createScheduledPaymentSchema = z.object({
  name: z.string().min(1, 'Nama tagihan wajib diisi').max(100, 'Maksimal 100 karakter'),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  dueDay: z.number().int().min(1).max(31),
  frequency: z.enum(['MONTHLY', 'WEEKLY', 'YEARLY']).default('MONTHLY'),
});

export const updateScheduledPaymentSchema = createScheduledPaymentSchema.partial();

export type CreateScheduledPaymentInput = z.infer<typeof createScheduledPaymentSchema>;
export type UpdateScheduledPaymentInput = z.infer<typeof updateScheduledPaymentSchema>;
