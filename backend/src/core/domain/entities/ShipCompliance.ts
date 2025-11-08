// src/core/domain/entities/ShipCompliance.ts
export interface ShipCompliance {
    id?: number;
    shipId: string;
    year: number;
    cbGco2eq: number; // Compliance Balance in gCO2 equivalent
}
