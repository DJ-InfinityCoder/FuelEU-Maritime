// src/adapters/outbound/postgres/PoolRepositoryDrizzle.ts
import { db } from "../../../infrastructure/db/connection";
import { pools } from "../../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { PoolRepository } from "../../../core/ports/outbound";
import { Pool } from "../../../core/domain/entities/Pool";

export class PoolRepositoryDrizzle implements PoolRepository {
    async createPool(pool: Pool): Promise<Pool> {
        const [createdPool] = await db
            .insert(pools)
            .values({
                year: pool.year,
                created_at: pool.createdAt || new Date(),
            })
            .returning()
            .execute();

        return {
            id: createdPool.id,
            year: createdPool.year,
            createdAt: createdPool.created_at,
        };
    }

    async getPoolsByYear(year: number): Promise<Pool[]> {
        const rows = await db.select().from(pools).where(eq(pools.year, year));

        // Map DB result to domain entity
        return rows.map((row) => ({
            id: row.id,
            year: row.year,
            createdAt: row.created_at,
        }));
    }

    async getPoolById(poolId: number): Promise<Pool | null> {
        const rows = await db
            .select()
            .from(pools)
            .where(eq(pools.id, poolId))
            .limit(1);

        if (rows.length === 0) {
            return null;
        }

        const pool = rows[0];
        return {
            id: pool.id,
            year: pool.year,
            createdAt: pool.created_at,
        };
    }
}
