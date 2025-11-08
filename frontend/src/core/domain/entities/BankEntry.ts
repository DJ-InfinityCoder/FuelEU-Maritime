// Core Domain Entity: BankEntry
export interface BankEntry {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
  cbBefore?: number;
  cbAfter?: number;
  transactionType?: 'BANK' | 'APPLY';
  createdAt?: Date | string;
}

export interface BankingOperation {
  shipId: string;
  year: number;
  amount: number;
}

export interface BankingResult {
  success: boolean;
  message: string;
  cbBefore?: number;
  applied?: number;
  cbAfter?: number;
  remainingBanked?: number;
}

export interface BankingStatus {
  exists: boolean;
  shipId?: string;
  year?: number;
  currentCB?: number;
  status?: 'SURPLUS' | 'DEFICIT' | 'NEUTRAL';
  banking?: {
    totalBanked: number;
    totalApplied: number;
    availableBanked: number;
  };
  thisYear?: {
    transactions: number;
    entries: BankEntry[];
  };
  otherYears?: {
    transactions: number;
    entries: BankEntry[];
  };
  allHistory?: BankEntry[];
  message?: string;
}