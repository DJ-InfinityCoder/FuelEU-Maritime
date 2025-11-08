import { BankEntryRepository, ShipComplianceRepository } from "../../ports/outbound";
import { BankEntry } from "../../domain/entities/BankEntry";

export class BankingService {
    constructor(
        private bankRepo: BankEntryRepository,
        private complianceRepo: ShipComplianceRepository
    ) {}

    /**
     * Retrieves all bank entries for a ship during a given year.
     */
    async getBankEntries(shipId: string, year: number): Promise<BankEntry[]> {
        return this.bankRepo.getBankEntries(shipId, year);
    }

    /**
     * Adds a bank entry for a ship.
     */
    async addBankEntry(entry: BankEntry): Promise<void> {
        await this.bankRepo.addBankEntry(entry);
    }

    /**
     * Gets all bank records across all ships and years.
     * Returns all banking transactions.
     */
    async getBankRecords(): Promise<BankEntry[]> {
        return this.bankRepo.getAllBankEntries();
    }

    /**
     * Gets complete banking history for a specific ship across all years.
     * Shows all BANK and APPLY transactions with CB before/after.
     * @param shipId - The ship identifier
     * @returns Array of bank entries ordered by most recent first
     */
    async getShipBankingHistory(shipId: string): Promise<BankEntry[]> {
        return this.bankRepo.getShipBankingHistory(shipId);
    }

    /**
     * Gets detailed banking status for a ship in a specific year.
     * For surplus ships: shows total banked, used by other years, available
     * For deficit ships: shows available CB to apply
     * @param shipId - The ship identifier
     * @param year - The year to check
     * @returns Banking status with breakdown
     */
    async getBankingStatus(shipId: string, year: number): Promise<any> {
        // Get current CB for this ship-year
        const compliance = await this.complianceRepo.getCompliance(shipId, year);
        
        if (!compliance) {
            return {
                exists: false,
                message: `No compliance record found for ship ${shipId} in year ${year}`,
            };
        }

        const currentCB = compliance.cbGco2eq;
        
        // Get all banking history for this ship (all years)
        const allEntries = await this.bankRepo.getShipBankingHistory(shipId);
        
        // Calculate total banked (positive entries)
        const totalBanked = allEntries
            .filter(e => e.amountGco2eq > 0)
            .reduce((sum, e) => sum + e.amountGco2eq, 0);
        
        // Calculate total applied (negative entries - abs value)
        const totalApplied = Math.abs(
            allEntries
                .filter(e => e.amountGco2eq < 0)
                .reduce((sum, e) => sum + e.amountGco2eq, 0)
        );
        
        // Available banked CB (can be used by any year of same ship)
        const availableBanked = await this.bankRepo.getAvailableBanked(shipId);
        
        // Get entries specific to this year
        const yearEntries = allEntries.filter(e => e.year === year);
        
        // Get entries from other years
        const otherYearEntries = allEntries.filter(e => e.year !== year);
        
        return {
            exists: true,
            shipId,
            year,
            currentCB: parseFloat(currentCB.toString()),
            status: currentCB > 0 ? 'SURPLUS' : currentCB < 0 ? 'DEFICIT' : 'NEUTRAL',
            banking: {
                totalBanked: parseFloat(totalBanked.toFixed(2)),
                totalApplied: parseFloat(totalApplied.toFixed(2)),
                availableBanked: parseFloat(availableBanked.toFixed(2)),
            },
            thisYear: {
                transactions: yearEntries.length,
                entries: yearEntries,
            },
            otherYears: {
                transactions: otherYearEntries.length,
                entries: otherYearEntries,
            },
            allHistory: allEntries,
        };
    }

    /**
     * Banks surplus emissions for future use.
     * Only positive CB (surplus) can be banked.
     * Validates that the ship actually has a positive CB before allowing banking.
     * Updates the ship's CB in the database after banking.
     * @param data - Contains shipId, year, and amount to bank
     * @returns Object with success status, message, cbBefore, applied amount, and cbAfter
     */
    async bankSurplus(data: {
        shipId: string;
        year: number;
        amount: number;
    }): Promise<any> {
        console.log(`[BankingService] Banking surplus for ship ${data.shipId}, year ${data.year}, amount ${data.amount}`);
        
        // Validate that amount is positive (surplus)
        if (data.amount <= 0) {
            throw new Error("Amount must be positive. Only positive CB (surplus) can be banked");
        }

        // Verify the ship actually has a positive CB for this year
        const compliance = await this.complianceRepo.getCompliance(
            data.shipId,
            data.year
        );

        if (!compliance) {
            throw new Error(
                `No compliance record found for ship ${data.shipId} in year ${data.year}. Please compute CB first by going to Compare Tab and clicking "Compute CB".`
            );
        }

        const cbBefore = compliance.cbGco2eq;
        console.log(`[BankingService] Current CB for ${data.shipId}: ${cbBefore}`);

        if (cbBefore <= 0) {
            throw new Error(
                `Cannot bank surplus. Ship ${data.shipId} has CB of ${cbBefore.toFixed(2)} gCO₂eq (≤ 0). Banking is only allowed when CB > 0.`
            );
        }

        // Validate that the amount to bank doesn't exceed actual CB
        if (data.amount > cbBefore) {
            throw new Error(
                `Cannot bank ${data.amount.toLocaleString()} gCO₂eq. Ship ${data.shipId} only has ${cbBefore.toFixed(2)} gCO₂eq surplus available.`
            );
        }

        // Calculate CB after banking (reduce CB by banked amount)
        const cbAfter = cbBefore - data.amount;

        // Create bank entry with CB tracking
        const entry: BankEntry = {
            shipId: data.shipId,
            year: data.year,
            amountGco2eq: data.amount,
            cbBefore: parseFloat(cbBefore.toString()),
            cbAfter: parseFloat(cbAfter.toString()),
            transactionType: 'BANK',
        };

        await this.bankRepo.addBankEntry(entry);
        console.log(`[BankingService] Bank entry created: ${data.amount} gCO₂eq`);

        // Update the ship's CB after banking
        await this.complianceRepo.saveCompliance({
            ...compliance,
            cbGco2eq: cbAfter,
        });
        
        console.log(`[BankingService] CB updated: ${cbBefore} → ${cbAfter}`);

        return {
            success: true,
            message: `Successfully banked ${data.amount.toLocaleString()} gCO₂eq surplus for ship ${data.shipId}`,
            cbBefore: parseFloat(cbBefore.toString()),
            applied: -data.amount,
            cbAfter: parseFloat(cbAfter.toString()),
            shipId: data.shipId,
            year: data.year,
        };
    }

    /**
     * Applies previously banked surplus to current compliance deficit.
     * Validates that sufficient banked amount is available and ship has a deficit.
     * Updates the ship's CB in the database after applying banked surplus.
     * @param data - Contains shipId, year, and amountToApply
     * @returns Object with success status, message, cbBefore, applied amount, and cbAfter
     */
    async applyBankedSurplus(data: {
        shipId: string;
        year: number;
        amount: number;
    }): Promise<any> {
        console.log(`[BankingService] Applying banked surplus for ship ${data.shipId}, year ${data.year}, amount ${data.amount}`);
        
        // Validate that amount is positive
        if (data.amount <= 0) {
            throw new Error("Amount to apply must be positive");
        }

        // Check if compliance record exists for the target year
        const compliance = await this.complianceRepo.getCompliance(
            data.shipId,
            data.year
        );

        if (!compliance) {
            throw new Error(
                `No compliance record found for ship ${data.shipId} in year ${data.year}. Please compute CB first by going to Compare Tab and clicking "Compute CB".`
            );
        }

        const cbBefore = compliance.cbGco2eq;
        console.log(`[BankingService] Current CB for ${data.shipId}: ${cbBefore}`);

        // Verify the ship actually has a deficit (CB < 0)
        if (cbBefore >= 0) {
            throw new Error(
                `Cannot apply banked surplus. Ship ${data.shipId} has CB of ${cbBefore.toFixed(2)} gCO₂eq (≥ 0). Banked surplus can only be applied when CB < 0 (deficit).`
            );
        }

        // Get available banked amount
        const availableBanked = await this.bankRepo.getAvailableBanked(
            data.shipId
        );
        console.log(`[BankingService] Available banked surplus for ${data.shipId}: ${availableBanked}`);

        // Validate ship has banked surplus available
        if (availableBanked <= 0) {
            throw new Error(
                `Ship ${data.shipId} has no banked surplus available. Current banked balance: ${availableBanked.toFixed(2)} gCO₂eq. You need to bank surplus first from a year with positive CB before you can apply it.`
            );
        }

        // Validate sufficient funds
        if (data.amount > availableBanked) {
            throw new Error(
                `Insufficient banked surplus. Available: ${availableBanked.toFixed(2)} gCO₂eq, Requested: ${data.amount.toLocaleString()} gCO₂eq. You can only apply up to ${availableBanked.toFixed(2)} gCO₂eq.`
            );
        }

        // Validate that application doesn't exceed the deficit amount
        const deficitAmount = Math.abs(cbBefore);
        if (data.amount > deficitAmount) {
            throw new Error(
                `Cannot apply ${data.amount.toLocaleString()} gCO₂eq. Ship ${data.shipId} only has a deficit of ${deficitAmount.toFixed(2)} gCO₂eq. You can only apply up to the deficit amount.`
            );
        }

        // Calculate CB after applying banked surplus
        // CB becomes less negative (improves) by the amount applied
        const cbAfter = cbBefore + data.amount;

        // Record the application as a negative bank entry (withdrawal) with CB tracking
        const entry: BankEntry = {
            shipId: data.shipId,
            year: data.year,
            amountGco2eq: -data.amount, // Negative because we're withdrawing from bank
            cbBefore: parseFloat(cbBefore.toString()),
            cbAfter: parseFloat(cbAfter.toString()),
            transactionType: 'APPLY',
        };

        await this.bankRepo.addBankEntry(entry);
        console.log(`[BankingService] Banked surplus applied: ${data.amount} gCO₂eq withdrawn from bank`);

        // Update the ship's CB after applying banked surplus
        await this.complianceRepo.saveCompliance({
            ...compliance,
            cbGco2eq: cbAfter,
        });
        
        console.log(`[BankingService] CB updated: ${cbBefore} → ${cbAfter}`);

        const remainingBanked = availableBanked - data.amount;

        return {
            success: true,
            message: `Successfully applied ${data.amount.toLocaleString()} gCO₂eq banked surplus to ship ${data.shipId}. Remaining banked: ${remainingBanked.toFixed(2)} gCO₂eq`,
            cbBefore: parseFloat(cbBefore.toString()),
            applied: data.amount,
            cbAfter: parseFloat(cbAfter.toString()),
            shipId: data.shipId,
            year: data.year,
            remainingBanked: parseFloat(remainingBanked.toFixed(2)),
        };
    }
}