import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Nama goal wajib diisi').max(100, 'Nama goal maksimal 100 karakter'),
  targetAmount: z.number().positive('Target harus lebih dari 0').max(999999999, 'Target terlalu besar'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal tidak valid' }).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const depositWithdrawSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
  note: z.string().max(255, 'Catatan maksimal 255 karakter').optional().nullable(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type DepositWithdrawInput = z.infer<typeof depositWithdrawSchema>;
