import { z } from "zod";

export const beneficiarySchema = z.object({
  name: z.string().min(1, "Name is required"),
  accNo: z.string().optional().nullable(),
  description: z.string().optional(),
  upiId: z.string().optional().nullable(),
}).refine((data) => {
  if (!data.accNo && !data.upiId) {
    return {
      message: "Either UPI ID or Account Number is required",
    }
  }
  return true;
});