import { PoolRepository, PoolMemberRepository, ShipComplianceRepository } from "../../ports/outbound";
import { Pool } from "../../domain/entities/Pool";
import { PoolMember } from "../../domain/entities/PoolMember";

export class PoolService {
    constructor(
        private poolRepo: PoolRepository,
        private poolMemberRepo: PoolMemberRepository,
        private complianceRepo: ShipComplianceRepository
    ) {}

    /**
     * Creates a new pool with members (with cbBefore provided).
     * Validates FuelEU Maritime pooling rules (Article 21):
     * 1. Sum of adjustedCB must be ≥ 0
     * 2. Deficit ships cannot exit worse
     * 3. Surplus ships cannot exit negative
     * 
     * @param poolData - Contains year and members with cbBefore values
     */
    async createPoolWithMembers(poolData: {
        year: number;
        members: Array<{ shipId: string; cbBefore: number }>;
    }): Promise<any> {
        const { year, members } = poolData;

        // Validate at least 2 members
        if (!members || members.length < 2) {
            throw new Error("Pool must have at least 2 members");
        }

        // Validate unique ship IDs
        const uniqueShips = new Set(members.map(m => m.shipId));
        if (uniqueShips.size !== members.length) {
            throw new Error("Duplicate ships detected. Each ship can only join a pool once.");
        }

        // Calculate total CB (sum of adjustedCB)
        const totalCB = members.reduce((sum, m) => sum + m.cbBefore, 0);

        // Rule 1: Total CB must be non-negative
        if (totalCB < 0) {
            throw new Error(
                `Pool total CB must be ≥ 0. Current total: ${totalCB.toFixed(2)} gCO₂eq. Cannot create pool with net deficit.`
            );
        }

        // Validate there's at least one surplus and one deficit ship
        const surplusShips = members.filter(m => m.cbBefore > 0);
        const deficitShips = members.filter(m => m.cbBefore < 0);

        if (surplusShips.length === 0) {
            throw new Error("Pool must have at least one ship with surplus (positive CB) to share.");
        }

        if (deficitShips.length === 0) {
            throw new Error("Pool must have at least one ship with deficit (negative CB) to assist.");
        }

        // Create the pool
        const pool = await this.poolRepo.createPool({ year });

        // Perform greedy allocation
        const allocatedMembers = this.greedyAllocation(members);

        // Validate allocation rules
        this.validateAllocation(members, allocatedMembers);

        // Save pool members
        const poolMembers: PoolMember[] = allocatedMembers.map((m) => ({
            poolId: pool.id!,
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
        }));

        await this.poolMemberRepo.addPoolMembers(poolMembers);

        // Update each ship's CB in the database
        for (const member of allocatedMembers) {
            const compliance = await this.complianceRepo.getCompliance(member.shipId, year);
            if (compliance) {
                await this.complianceRepo.saveCompliance({
                    ...compliance,
                    cbGco2eq: member.cbAfter,
                });
            }
        }

        return {
            pool,
            members: poolMembers,
            totalCbBefore: totalCB,
            totalCbAfter: allocatedMembers.reduce((sum, m) => sum + m.cbAfter, 0),
            valid: true,
        };
    }

    /**
     * Creates a new pool with members and performs greedy allocation.
     * Validates FuelEU Maritime pooling rules (Article 21):
     * 1. Sum of CB must be ≥ 0
     * 2. Deficit ships cannot exit worse
     * 3. Surplus ships cannot exit negative
     * 4. All ships must have valid compliance records
     * 5. Each ship can only join once per year
     * 
     * @param poolData - Contains year and members (shipIds only, CB fetched from DB)
     */
    async createPool(poolData: {
        year: number;
        shipIds: string[];
    }): Promise<any> {
        const { year, shipIds } = poolData;

        // Validate at least 2 members
        if (!shipIds || shipIds.length < 2) {
            throw new Error("Pool must have at least 2 members");
        }

        // Validate unique ship IDs
        const uniqueShips = new Set(shipIds);
        if (uniqueShips.size !== shipIds.length) {
            throw new Error("Duplicate ships detected. Each ship can only join a pool once.");
        }

        // Fetch actual CB from database for all ships
        const members: Array<{ shipId: string; cbBefore: number }> = [];
        const shipsWithoutCompliance: string[] = [];
        
        for (const shipId of shipIds) {
            const compliance = await this.complianceRepo.getCompliance(shipId, year);
            
            if (!compliance) {
                shipsWithoutCompliance.push(shipId);
                continue;
            }
            
            members.push({
                shipId,
                cbBefore: compliance.cbGco2eq,
            });
        }

        // Check if any ships are missing compliance for the pool year
        if (shipsWithoutCompliance.length > 0) {
            throw new Error(
                `The following ships do not have compliance records for year ${year}: ${shipsWithoutCompliance.join(", ")}. All ships in a pool must have CB computed for the same year. Please compute CB first using /api/compliance/cb`
            );
        }

        // Calculate total CB
        const totalCB = members.reduce((sum, m) => sum + m.cbBefore, 0);

        // Rule 1: Total CB must be non-negative
        if (totalCB < 0) {
            throw new Error(
                `Pool total CB must be ≥ 0. Current total: ${totalCB.toFixed(2)} gCO₂eq. Cannot create pool with net deficit.`
            );
        }

        // Validate there's at least one surplus and one deficit ship
        const surplusShips = members.filter(m => m.cbBefore > 0);
        const deficitShips = members.filter(m => m.cbBefore < 0);

        if (surplusShips.length === 0) {
            throw new Error("Pool must have at least one ship with surplus (positive CB) to share.");
        }

        if (deficitShips.length === 0) {
            throw new Error("Pool must have at least one ship with deficit (negative CB) to assist. If all ships have surplus, pooling is unnecessary.");
        }

        // Create the pool
        const pool = await this.poolRepo.createPool({ year });

        // Perform greedy allocation
        const allocatedMembers = this.greedyAllocation(members);

        // Validate allocation rules
        this.validateAllocation(members, allocatedMembers);

        // Save pool members
        const poolMembers: PoolMember[] = allocatedMembers.map((m) => ({
            poolId: pool.id!,
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
        }));

        await this.poolMemberRepo.addPoolMembers(poolMembers);

        // Update each ship's CB in the database
        for (const member of allocatedMembers) {
            const compliance = await this.complianceRepo.getCompliance(member.shipId, year);
            if (compliance) {
                await this.complianceRepo.saveCompliance({
                    ...compliance,
                    cbGco2eq: member.cbAfter,
                });
            }
        }

        return {
            pool,
            members: poolMembers,
            totalCBBefore: totalCB,
            totalCBAfter: allocatedMembers.reduce((sum, m) => sum + m.cbAfter, 0),
            surplusShipsCount: surplusShips.length,
            deficitShipsCount: deficitShips.length,
        };
    }

    /**
     * Greedy allocation algorithm for pooling.
     * Transfers surplus from ships with positive CB to ships with negative CB.
     */
    private greedyAllocation(
        members: Array<{ shipId: string; cbBefore: number }>
    ): Array<{ shipId: string; cbBefore: number; cbAfter: number }> {
        // Sort members by CB descending (surplus first)
        const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);

        // Initialize cbAfter with cbBefore
        const allocated = sorted.map((m) => ({
            ...m,
            cbAfter: m.cbBefore,
        }));

        // Transfer surplus to deficits
        for (let i = 0; i < allocated.length; i++) {
            if (allocated[i].cbAfter <= 0) break; // No more surplus

            for (let j = allocated.length - 1; j > i; j--) {
                if (allocated[j].cbAfter >= 0) break; // No more deficits

                // Calculate transfer amount (surplus available vs deficit needed)
                const transferAmount = Math.min(
                    allocated[i].cbAfter,
                    Math.abs(allocated[j].cbAfter)
                );

                // Perform transfer
                allocated[i].cbAfter -= transferAmount;
                allocated[j].cbAfter += transferAmount;

                if (allocated[i].cbAfter === 0) break; // No more surplus from this ship
            }
        }

        return allocated;
    }

    /**
     * Validates pooling allocation rules.
     */
    private validateAllocation(
        original: Array<{ shipId: string; cbBefore: number }>,
        allocated: Array<{
            shipId: string;
            cbBefore: number;
            cbAfter: number;
        }>
    ): void {
        for (const member of allocated) {
            const originalMember = original.find(
                (m) => m.shipId === member.shipId
            );
            if (!originalMember) continue;

            // Rule 2: Deficit ships cannot exit worse
            if (originalMember.cbBefore < 0 && member.cbAfter < originalMember.cbBefore) {
                throw new Error(
                    `Deficit ship ${member.shipId} cannot exit worse than entry`
                );
            }

            // Rule 3: Surplus ships cannot exit negative
            if (originalMember.cbBefore > 0 && member.cbAfter < 0) {
                throw new Error(
                    `Surplus ship ${member.shipId} cannot exit with negative CB`
                );
            }
        }
    }

    /**
     * Gets pools for a given year.
     */
    async getPoolsByYear(year: number): Promise<Pool[]> {
        return this.poolRepo.getPoolsByYear(year);
    }

    /**
     * Gets details of a pool by ID.
     */
    async getPoolById(poolId: number): Promise<Pool | null> {
        return this.poolRepo.getPoolById(poolId);
    }

    /**
     * Adds members to a pool, with compliance balance adjustments.
     */
    async addPoolMembers(members: PoolMember[]): Promise<void> {
        await this.poolMemberRepo.addPoolMembers(members);
    }

    /**
     * Retrieves members of a pool.
     */
    async getPoolMembers(poolId: number): Promise<PoolMember[]> {
        return this.poolMemberRepo.getPoolMembers(poolId);
    }
}
