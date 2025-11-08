// src/core/domain/entities/BankEntry.ts
export interface BankEntry {
    id?: number;
    shipId: string;
    year: number;
    amountGco2eq: number; // Banked surplus amount in gCO2 equivalent
    cbBefore?: number; // CB before this banking transaction
    cbAfter?: number; // CB after this banking transaction
    transactionType?: 'BANK' | 'APPLY'; // Type of transaction
    createdAt?: Date; // When the transaction occurred
}