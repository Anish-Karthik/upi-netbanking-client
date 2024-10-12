import { api } from "@/lib/axios";
import type { BankAccount, Bank } from "@/types/account";

// API functions
export const fetchAccounts = async (userId: number): Promise<BankAccount[]> => {
  const response = await api.get(`/users/${userId}/accounts`);
  return response.data.data;
};

export const fetchBanks = async (): Promise<Bank[]> => {
  const response = await api.get("/banks");
  return response.data.data;
};
