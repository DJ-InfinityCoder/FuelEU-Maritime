// Core Domain Entity: ShipCompliance
export interface ShipCompliance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number; // Compliance Balance in gCO2eq
  adjustedCbGco2eq?: number; // After banking applications
}

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbBefore: number;
  cbAfter: number;
  applied?: number;
}
