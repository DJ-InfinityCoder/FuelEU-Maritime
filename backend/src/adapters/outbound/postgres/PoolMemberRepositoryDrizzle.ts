// src/adapters/outbound/postgres/PoolMemberRepositoryDrizzle.ts
import { db } from "../../../infrastructure/db/connection";
import { poolMembers } from "../../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { PoolMemberRepository } from "../../../core/ports/outbound";
import { PoolMember } from "../../../core/domain/entities/PoolMember";

export class PoolMemberRepositoryDrizzle implements PoolMemberRepository {
    async addPoolMembers(members: PoolMember[]): Promise<void> {
        const formattedMembers = members.map((m) => ({
            pool_id: m.poolId,
            ship_id: m.shipId,
            cb_before: m.cbBefore.toString(),
            cb_after: m.cbAfter.toString(),
        }));

        await db.insert(poolMembers).values(formattedMembers).execute();
    }

    async getPoolMembers(poolId: number): Promise<PoolMember[]> {
        const members = await db
            .select()
            .from(poolMembers)
            .where(eq(poolMembers.pool_id, poolId));

        return members.map((m) => ({
            poolId: m.pool_id,
            shipId: m.ship_id,
            cbBefore: Number(m.cb_before),
            cbAfter: Number(m.cb_after),
        }));
    }
}
