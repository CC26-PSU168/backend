import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi'),
  qty: z.number().int().positive('Qty harus lebih dari 0'),
  unitPrice: z.number().positive('Harga satuan harus lebih dari 0'),
  subtotal: z.number().positive('Subtotal harus lebih dari 0'),
});

const participantSchema = z.object({
  name: z.string().min(1, 'Nama peserta wajib diisi'),
});

const assignmentSchema = z.object({
  itemIndex: z.number().int().min(0),
  assignees: z
    .array(
      z.object({
        participantIndex: z.number().int().min(0),
        qty: z.number().int().positive('Qty harus lebih dari 0'),
      })
    )
    .min(1, 'Minimal 1 peserta per item'),
});

export const createSplitBillSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Judul wajib diisi')
      .max(100, 'Judul maksimal 100 karakter'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Tanggal tidak valid',
    }),
    splitMethod: z.enum(['equal', 'item']),
    items: z.array(itemSchema).min(1, 'Minimal 1 item'),
    participants: z.array(participantSchema).min(1, 'Minimal 1 peserta'),
    assignments: z.array(assignmentSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.splitMethod === 'item') {
        if (!data.assignments || data.assignments.length === 0) return false;
        // Semua item harus punya minimal 1 assignment
        return data.items.every((_, i) =>
          data.assignments!.some((a) => a.itemIndex === i)
        );
      }
      return true;
    },
    {
      message: 'Semua item harus di-assign ke minimal 1 peserta',
      path: ['assignments'],
    }
  );

export const splitBillQuerySchema = z.object({
  status: z.enum(['settled', 'pending']).optional(),
});

export type CreateSplitBillInput = z.infer<typeof createSplitBillSchema>;
export type SplitBillQueryInput = z.infer<typeof splitBillQuerySchema>;