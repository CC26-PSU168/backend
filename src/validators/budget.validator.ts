import { z } from 'zod';

export const createBudgetSchema = z.object({
  category: z.string().min(1, 'Kategori wajib diisi'),
  limitAmount: z.number().positive('Limit harus lebih dari 0').max(99999999, 'Limit terlalu besar'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = z.object({
  limitAmount: z.number().positive('Limit harus lebih dari 0').max(99999999, 'Limit terlalu besar'),
});

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>;
