// src/core/ports/outbound.ts

import { Route } from "../domain/entities/Route";
import { ShipCompliance } from "../domain/entities/ShipCompliance";
import { BankEntry } from "../domain/entities/BankEntry";
import { Pool } from "../domain/entities/Pool";
import { PoolMember } from "../domain/entities/PoolMember";

/**
 * Repository interface for managing Routes
 */
export interface RouteRepository {
    getAllRoutes(): Promise<Route[]>;
    setBaseline(routeId: string): Promise<void>;
    getRouteById(routeId: string): Promise<Route | null>;
}

/**
 * Repository interface for managing Ship Compliance records
 */
export interface ShipComplianceRepository {
    getCompliance(shipId: string, year: number): Promise<ShipCompliance | null>;
    saveCompliance(compliance: ShipCompliance): Promise<void>;
}

/**
 * Repository interface for managing Bank Entries
 */
export interface BankEntryRepository {
    getBankEntries(shipId: string, year: number): Promise<BankEntry[]>;
    addBankEntry(entry: BankEntry): Promise<void>;
    getAllBankEntries(): Promise<BankEntry[]>;
    getAvailableBanked(shipId: string): Promise<number>;
}

/**
 * Repository interface for managing Pools
 */
export interface PoolRepository {
    createPool(pool: Pool): Promise<Pool>;
    getPoolsByYear(year: number): Promise<Pool[]>;
    getPoolById(poolId: number): Promise<Pool | null>;
}

/**
 * Repository interface for managing Pool Members
 */
export interface PoolMemberRepository {
    addPoolMembers(members: PoolMember[]): Promise<void>;
    getPoolMembers(poolId: number): Promise<PoolMember[]>;
}
