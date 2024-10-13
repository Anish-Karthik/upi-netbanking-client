// Enums
export enum UpiStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CLOSED = "CLOSED",
}

// Interfaces
export interface UPI {
  upiId: string;
  accNo: string;
  userId: number;
  status: UpiStatus;
  isDefault: boolean;
}