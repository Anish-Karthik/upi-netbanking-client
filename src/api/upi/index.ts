import { api } from "@/lib/axios"
import type { addUpiSchema, changePinSchema } from "@/schema/upi";
import type { BankAccount } from "@/types/account";
import type { UPI, UpiStatus } from "@/types/upi";
import type { z } from "zod";

// API functions
export const fetchUPIs = async (accNo: string): Promise<UPI[]> => {
  const response = await api.get(`/accounts/${accNo}/upi`);
  return response.data.data;
};

export const fetchAccounts = async (userId: number): Promise<BankAccount[]> => {
  const response = await api.get(`/users/${userId}/accounts`);
  return response.data.data;
};

export const addUPI = async (
  accNo: string,
  data: z.infer<typeof addUpiSchema> & { userId: number }
): Promise<UPI> => {
  const response = await api.post(`/accounts/${accNo}/upi`, data);
  return response.data.data;
};

export const updateUPIStatus = async (
  accNo: string,
  upiId: string,
  status: UpiStatus
): Promise<UPI> => {
  const response = await api.put(`/accounts/${accNo}/upi/${upiId}/status`, {
    status,
  });
  return response.data.data;
};

export const changeUPIPin = async (
  accNo: string,
  upiId: string,
  data: z.infer<typeof changePinSchema>
): Promise<UPI> => {
  const response = await api.put(`/accounts/${accNo}/upi/${upiId}/pin`, data);
  return response.data.data;
};

export const toggleDefaultUPI = async (accNo: string, upiId: string): Promise<UPI> => {
  const response = await api.put(`/accounts/${accNo}/upi/${upiId}/default`, {
    isDefault: true,
  });
  return response.data.data;
};

export const closeUPI = async (accNo: string, upiId: string): Promise<void> => {
  await api.delete(`/accounts/${accNo}/upi/${upiId}`);
};