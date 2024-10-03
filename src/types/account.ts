
// Enums
export enum AccountType {
  SAVINGS = "SAVINGS",
  CURRENT = "CURRENT",
  SALARY = "SALARY",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  BLOCKED = "BLOCKED",
}

// Interface for bank account
export interface BankAccount {
  accNo: string;
  ifsc: string;
  bankId: number;
  userId: number;
  balance: number;
  createdAt: number;
  accountType: AccountType;
  status: AccountStatus;
  bank: {
    name: string;
    code: string;
    id: number;
  };
}

// Interface for bank
export interface Bank {
  name: string;
  code: string;
  id: number;
}