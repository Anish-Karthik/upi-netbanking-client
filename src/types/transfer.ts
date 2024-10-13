import type { Transaction } from "./transaction"


// export Enums
export enum TransferStatus {
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum TransferType {
  ACCOUNT = "ACCOUNT",
  UPI = "UPI",
  CARD = "CARD",
} 

export interface Transfer {
  referenceId: string
  payerTransactionId: number
  payeeTransactionId: number
  transferType: TransferType
  startedAt: number
  endedAt: number | null
  transferStatus: TransferStatus
  amount: number
  description: string
  payerTransaction: Transaction
  payeeTransaction: Transaction
}