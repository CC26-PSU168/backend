import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal tidak valid' }),
  amount: z.number().positive('Nominal harus lebih dari 0').max(99999999, 'Nominal terlalu besar'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  paymentMethod: z.string().min(1, 'Metode pembayaran wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(100, 'Deskripsi maksimal 100 karakter'),
  notes: z.string().max(255, 'Catatan maksimal 255 karakter').optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const queryTransactionSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  paymentMethod: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['date_asc', 'date_desc', 'amount_asc', 'amount_desc']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional().default(6),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionInput = z.infer<typeof queryTransactionSchema>;
