// src/adapters/outbound/postgres/BankEntryRepositoryDrizzle.ts
import { db } from "../../../infrastructure/db/connection";
import { bankEntries } from "../../../infrastructure/db/schema";
import { eq, and } from "drizzle-orm";
import { BankEntryRepository } from "../../../core/ports/outbound";
import { BankEntry } from "../../../core/domain/entities/BankEntry";

export class BankEntryRepositoryDrizzle implements BankEntryRepository {
    async getBankEntries(shipId: string, year: number): Promise<BankEntry[]> {
        const entries = await db
            .select()
            .from(bankEntries)
            .where(
                and(eq(bankEntries.ship_id, shipId), eq(bankEntries.year, year))
            );

        return entries.map((e) => ({
            id: e.id,
            shipId: e.ship_id,
            year: e.year,
            amountGco2eq: Number(e.amount_gco2eq),
        }));
    }

    async addBankEntry(entry: BankEntry): Promise<void> {
        await db
            .insert(bankEntries)
            .values({
                ship_id: entry.shipId,
                year: entry.year,
                amount_gco2eq: entry.amountGco2eq.toString(),
            })
            .execute();
    }

    async getAllBankEntries(): Promise<BankEntry[]> {
        const entries = await db.select().from(bankEntries);

        return entries.map((e) => ({
            id: e.id,
            shipId: e.ship_id,
            year: e.year,
            amountGco2eq: Number(e.amount_gco2eq),
        }));
    }

    async getAvailableBanked(shipId: string): Promise<number> {
        const entries = await db
            .select()
            .from(bankEntries)
            .where(eq(bankEntries.ship_id, shipId));

        return entries.reduce((sum, e) => sum + Number(e.amount_gco2eq), 0);
    }
}
