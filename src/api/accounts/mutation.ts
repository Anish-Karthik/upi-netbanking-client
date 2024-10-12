import type { CreateBankAccountFormValues } from "@/components/accounts/CreateBankAccountForm";
import type { EditBankAccountFormValues } from "@/components/accounts/EditBankAccountForm";
import { api } from "@/lib/axios";
import type { BankAccount } from "@/types/account";

export const createAccount = async (
  userId: number,
  data: CreateBankAccountFormValues
): Promise<BankAccount> => {
  const response = await api.post(`/users/${userId}/accounts`, data);
  return response.data.data;
};

export const updateAccount = async (
  userId: number,
  accNo: string,
  data: EditBankAccountFormValues
): Promise<BankAccount> => {
  const response = await api.put(`/users/${userId}/accounts/${accNo}`, data);
  return response.data.data;
};

export const closeAccount = async (
  userId: number,
  accNo: string
): Promise<void> => {
  await api.post(`/users/${userId}/accounts/${accNo}/close`);
};

export const reopenAccount = async (
  userId: number,
  accNo: string
): Promise<void> => {
  await api.post(`/users/${userId}/accounts/${accNo}/reopen`);
};
