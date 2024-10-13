import { PaymentMethod, TransactionType } from "@/types/transaction";
import { z } from "zod";

export const transactionSchema = z.object({
  accNo: z.string().min(1, "Account number is required"),
  amount: z.number().positive("Amount must be positive"),
  transactionType: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  upiId: z.string().optional(),
  byCardNo: z.string().optional(),
});