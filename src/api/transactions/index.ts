import { api } from "@/lib/axios";
import type { transactionSchema } from "@/schema/transaction";
import type { Transaction } from "@/types/transaction";
import type { z } from "zod";

// API functions
export const fetchTransactions = async (accNo: string): Promise<Transaction[]> => {
  const response = await api.get(`/accounts/${accNo}/transactions`);
  return response.data.data;
};

export const createTransaction = async (
  data: z.infer<typeof transactionSchema> & { userId: number }
): Promise<Transaction> => {
  const response = await api.post(`/accounts/${data.accNo}/transactions`, data);
  return response.data.data;
};