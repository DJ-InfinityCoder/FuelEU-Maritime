// Port interfaces for outbound dependencies (Infrastructure layer)
import type { Route, RouteComparison } from '../domain/entities/Route';
import type { ShipCompliance, ComplianceBalance } from '../domain/entities/ShipCompliance';
import type { BankEntry, BankingOperation, BankingResult } from '../domain/entities/BankEntry';
import type { Pool, CreatePoolRequest, CreatePoolResponse } from '../domain/entities/Pool';

export interface IRoutesPort {
  getAllRoutes(): Promise<Route[]>;
  setBaseline(routeId: string): Promise<void>;
  getComparison(): Promise<RouteComparison[]>;
}

export interface ICompliancePort {
  getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedComplianceBalance(shipId: string, year: number): Promise<ShipCompliance>;
}

export interface IBankingPort {
  getBankingRecords(shipId: string, year: number): Promise<BankEntry[]>;
  bankSurplus(operation: BankingOperation): Promise<BankingResult>;
  applyBanked(operation: BankingOperation): Promise<BankingResult>;
}

export interface IPoolingPort {
  createPool(request: CreatePoolRequest): Promise<CreatePoolResponse>;
  getPools(year: number): Promise<Pool[]>;
}
