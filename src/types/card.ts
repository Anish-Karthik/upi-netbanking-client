// Enums
export enum CardStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
  CLOSED = "CLOSED",
}

export enum CardType {
  VISA = "VISA",
  MASTERCARD = "MASTERCARD",
  RUPAY = "RUPAY",
}

export enum CardCategory {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

// Interfaces
export interface Card {
  cardNo: string;
  accNo: string;
  validFrom: string;
  validTill: string;
  status: CardStatus;
  cardType: CardType;
  cardCategory: CardCategory;
}