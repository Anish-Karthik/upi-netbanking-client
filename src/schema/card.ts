import { CardType, CardCategory, CardStatus } from "@/types/card";
import { z } from "zod";

// Schemas
export const addCardSchema = z.object({
  accNo: z.string().min(1, "Account number is required"),
  cardType: z.nativeEnum(CardType),
  cardCategory: z.nativeEnum(CardCategory),
  atmPin: z.string().min(4, "ATM PIN must be at least 4 characters"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

export const editStatusSchema = z.object({
  status: z.nativeEnum(CardStatus),
});

export const changePinSchema = z.object({
  oldPin: z.string().min(4, "Old PIN must be at least 4 characters"),
  newPin: z.string().min(4, "New PIN must be at least 4 characters"),
});

export const updateCardSchema = z.object({
  cardType: z.nativeEnum(CardType),
  cardCategory: z.nativeEnum(CardCategory),
  status: z.nativeEnum(CardStatus),
});