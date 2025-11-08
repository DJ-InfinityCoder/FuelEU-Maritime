// src/adapters/outbound/postgres/BankEntryRepositoryDrizzle.ts
import { db } from "../../../infrastructure/db/connection";
import { bankEntries } from "../../../infrastructure/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { BankEntryRepository } from "../../../core/ports/outbound";
import { BankEntry } from "../../../core/domain/entities/BankEntry";

export class BankEntryRepositoryDrizzle implements BankEntryRepository {
    async getBankEntries(shipId: string, year: number): Promise<BankEntry[]> {
        const entries = await db
            .select()
            .from(bankEntries)
            .where(
                and(eq(bankEntries.ship_id, shipId), eq(bankEntries.year, year))
            )
            .orderBy(desc(bankEntries.created_at));

        return entries.map((e) => ({
            id: e.id,
            shipId: e.ship_id,
            year: e.year,
            amountGco2eq: Number(e.amount_gco2eq),
            cbBefore: e.cb_before ? Number(e.cb_before) : undefined,
            cbAfter: e.cb_after ? Number(e.cb_after) : undefined,
            transactionType: e.transaction_type as 'BANK' | 'APPLY' | undefined,
            createdAt: e.created_at || undefined,
        }));
    }

    async addBankEntry(entry: BankEntry): Promise<void> {
        await db
            .insert(bankEntries)
            .values({
                ship_id: entry.shipId,
                year: entry.year,
                amount_gco2eq: entry.amountGco2eq.toString(),
                cb_before: entry.cbBefore?.toString(),
                cb_after: entry.cbAfter?.toString(),
                transaction_type: entry.transactionType,
            })
            .execute();
    }

    async getAllBankEntries(): Promise<BankEntry[]> {
        const entries = await db
            .select()
            .from(bankEntries)
            .orderBy(desc(bankEntries.created_at));

        return entries.map((e) => ({
            id: e.id,
            shipId: e.ship_id,
            year: e.year,
            amountGco2eq: Number(e.amount_gco2eq),
            cbBefore: e.cb_before ? Number(e.cb_before) : undefined,
            cbAfter: e.cb_after ? Number(e.cb_after) : undefined,
            transactionType: e.transaction_type as 'BANK' | 'APPLY' | undefined,
            createdAt: e.created_at || undefined,
        }));
    }

    async getAvailableBanked(shipId: string): Promise<number> {
        const entries = await db
            .select()
            .from(bankEntries)
            .where(eq(bankEntries.ship_id, shipId));

        return entries.reduce((sum, e) => sum + Number(e.amount_gco2eq), 0);
    }

    async getShipBankingHistory(shipId: string): Promise<BankEntry[]> {
        const entries = await db
            .select()
            .from(bankEntries)
            .where(eq(bankEntries.ship_id, shipId))
            .orderBy(desc(bankEntries.created_at));

        return entries.map((e) => ({
            id: e.id,
            shipId: e.ship_id,
            year: e.year,
            amountGco2eq: Number(e.amount_gco2eq),
            cbBefore: e.cb_before ? Number(e.cb_before) : undefined,
            cbAfter: e.cb_after ? Number(e.cb_after) : undefined,
            transactionType: e.transaction_type as 'BANK' | 'APPLY' | undefined,
            createdAt: e.created_at || undefined,
        }));
    }
}