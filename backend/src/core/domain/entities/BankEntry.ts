// src/core/domain/entities/BankEntry.ts
export interface BankEntry {
    id?: number;
    shipId: string;
    year: number;
    amountGco2eq: number; // Banked surplus amount in gCO2 equivalent
}
