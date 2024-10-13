import { z } from "zod";

export const beneficiarySchema = z.object({
  name: z.string().min(1, "Name is required"),
  accNo: z.string().min(1, "Account number is required"),
  description: z.string().optional(),
  upiId: z.string().optional().nullable(),
})