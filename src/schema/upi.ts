import { UpiStatus } from "@/types/upi";
import { z } from "zod";


// Schemas
export const addUpiSchema = z.object({
  accNo: z.string().min(1, "Account number is required"),
  upiPin: z.string().min(4, "UPI PIN must be at least 4 characters"),
});

export const editStatusSchema = z.object({
  status: z.nativeEnum(UpiStatus),
});

export const changePinSchema = z.object({
  oldPin: z.string().min(4, "Old PIN must be at least 4 characters"),
  newPin: z.string().min(4, "New PIN must be at least 4 characters"),
});
