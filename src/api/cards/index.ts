import { api } from "@/lib/axios";
import type { addCardSchema, changePinSchema, updateCardSchema } from "@/schema/card";
import type { BankAccount } from "@/types/account";
import type { Card, CardStatus } from "@/types/card";
import type { z } from "zod";



// API functions
export const fetchCards = async (accNo: string): Promise<Card[]> => {
  const response = await api.get(`/accounts/${accNo}/card`);
  return response.data.data;
};

export const fetchAccounts = async (userId: number): Promise<BankAccount[]> => {
  const response = await api.get(`/users/${userId}/accounts`);
  return response.data.data;
};

export const addCard = async (
  accNo: string,
  data: z.infer<typeof addCardSchema> & { userId: number }
): Promise<Card> => {
  const response = await api.post(`/accounts/${accNo}/card`, data);
  return response.data.data;
};

export const updateCard = async (
  accNo: string,
  cardNo: string,
  data: z.infer<typeof updateCardSchema>
): Promise<Card> => {
  const response = await api.put(`/accounts/${accNo}/card/${cardNo}`, data);
  return response.data.data;
};

export const updateCardStatus = async (
  accNo: string,
  cardNo: string,
  status: CardStatus
): Promise<Card> => {
  const response = await api.put(`/accounts/${accNo}/card/${cardNo}/status`, {
    status,
  });
  return response.data.data;
};

export const changeCardPin = async (
  accNo: string,
  cardNo: string,
  data: z.infer<typeof changePinSchema>
): Promise<Card> => {
  const response = await api.put(`/accounts/${accNo}/card/${cardNo}/pin`, {
    atmPin: data.newPin,
    oldPin: data.oldPin,
  });
  return response.data.data;
};

export const blockCard = async (accNo: string, cardNo: string): Promise<void> => {
  await api.put(`/accounts/${accNo}/card/${cardNo}/block`);
};