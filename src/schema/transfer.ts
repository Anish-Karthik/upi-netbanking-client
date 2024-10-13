import { z } from "zod";

// Schemas
export const transferSchema = z.object({
  payerTransaction: z.object({
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
  }),
  payeeTransaction: z.object({
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
  }),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  beneficiaryId: z.coerce.number().optional(),
})