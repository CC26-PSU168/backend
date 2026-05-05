import { z } from 'zod';

const participantSchema = z.object({
  name: z.string().min(1, 'Nama peserta wajib diisi'),
  shareAmount: z.number().positive('Jumlah harus lebih dari 0'),
});

export const createSplitBillSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(100, 'Judul maksimal 100 karakter'),
  totalAmount: z.number().positive('Total harus lebih dari 0'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal tidak valid' }),
  participants: z.array(participantSchema).min(1, 'Minimal 1 peserta'),
});

export const splitBillQuerySchema = z.object({
  status: z.enum(['settled', 'pending']).optional(),
});

export type CreateSplitBillInput = z.infer<typeof createSplitBillSchema>;
export type SplitBillQueryInput = z.infer<typeof splitBillQuerySchema>;
