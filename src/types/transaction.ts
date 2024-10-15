// Enums
export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
}

export enum PaymentMethod {
  UPI = "UPI",
  CARD = "CARD",
  ACCOUNT = "ACCOUNT",
}

export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

// Interfaces
export interface Transaction {
  transactionId: number;
  accNo: string;
  userId: number;
  amount: number;
  transactionType: TransactionType;
  transactionStatus: TransactionStatus;
  byCardNo: string | null;
  upiId: string | null;
  startedAt: string;
  endedAt: string | null;
  referenceId: string | null;
  paymentMethod: PaymentMethod;
}
