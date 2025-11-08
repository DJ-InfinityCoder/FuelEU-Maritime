import { BankEntryRepository, ShipComplianceRepository } from "../../ports/outbound";
import { BankEntry } from "../../domain/entities/BankEntry";

export class BankingService {
    constructor(
        private bankRepo: BankEntryRepository,
        private complianceRepo: ShipComplianceRepository
    ) { }

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
     * Banks surplus emissions for future use.
     * Only positive CB (surplus) can be banked.
     * Validates that the ship actually has a positive CB before allowing banking.
     * @param data - Contains shipId, year, and amount to bank
     */
    async bankSurplus(data: {
        shipId: string;
        year: number;
        amount: number;
    }): Promise<any> {
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
                `No compliance record found for ship ${data.shipId} in year ${data.year}. Please compute CB first.`
            );
        }

        const cbBefore = compliance.cbGco2eq;

        if (cbBefore <= 0) {
            throw new Error(
                `Cannot bank surplus. Ship ${data.shipId} has CB of ${cbBefore.toFixed(2)} gCO₂eq (≤ 0). Banking is only allowed when CB > 0.`
            );
        }

        // Validate that the amount to bank doesn't exceed actual CB
        if (data.amount > cbBefore) {
            throw new Error(
                `Cannot bank ${data.amount} gCO₂eq. Ship ${data.shipId} only has ${cbBefore.toFixed(2)} gCO₂eq surplus.`
            );
        }

        const entry: BankEntry = {
            shipId: data.shipId,
            year: data.year,
            amountGco2eq: data.amount,
        };

        await this.bankRepo.addBankEntry(entry);

        // Update the ship's CB after banking
        const cbAfter = cbBefore - data.amount;
        await this.complianceRepo.saveCompliance({
            ...compliance,
            cbGco2eq: cbAfter,
        });

        return {
            success: true,
            message: "Surplus banked successfully",
            cbBefore,
            applied: -data.amount,
            cbAfter,
        };
    }

    /**
     * Applies previously banked surplus to current compliance deficit.
     * Validates that sufficient banked amount is available and ship has a deficit.
     * @param data - Contains shipId, year, and amountToApply
     */
    async applyBankedSurplus(data: {
        shipId: string;
        year: number;
        amount: number;
    }): Promise<any> {
        if (data.amount <= 0) {
            throw new Error("Amount to apply must be positive");
        }

        // 1️⃣ Load compliance record
        const compliance = await this.complianceRepo.getCompliance(data.shipId, data.year);
        if (!compliance) {
            throw new Error(`No compliance record found for ship ${data.shipId} in year ${data.year}.`);
        }

        const cbBefore = compliance.cbGco2eq;

        // 2️⃣ Ensure this ship has a deficit
        if (cbBefore >= 0) {
            throw new Error(
                `Cannot apply banked surplus. Ship ${data.shipId} has CB ${cbBefore.toFixed(2)} (must be deficit ≤ 0).`
            );
        }

        // 3️⃣ Get available bank
        const availableBanked = await this.bankRepo.getAvailableBanked(data.shipId);
        if (availableBanked <= 0) {
            throw new Error(`Ship ${data.shipId} has no banked surplus to apply.`);
        }

        // 4️⃣ Ensure we don’t exceed available or deficit
        const deficit = Math.abs(cbBefore);
        const applyAmount = Math.min(data.amount, deficit, availableBanked);

        // 5️⃣ Compute post-application balances
        const cbAfter = cbBefore + applyAmount;
        const bankAfter = availableBanked - applyAmount;

        // 6️⃣ Record this as a negative entry (used portion)
        const entry: BankEntry = {
            shipId: data.shipId,
            year: data.year,
            amountGco2eq: -applyAmount, // reduces bank
        };
        await this.bankRepo.addBankEntry(entry);

        // 7️⃣ Update compliance balance
        await this.complianceRepo.saveCompliance({
            ...compliance,
            cbGco2eq: cbAfter,
        });

        return {
            success: true,
            message: "Banked surplus applied successfully",
            cb_before: cbBefore,
            applied: applyAmount,
            cb_after: cbAfter,
            bank_before: availableBanked,
            bank_after: bankAfter,
        };
    }

}
