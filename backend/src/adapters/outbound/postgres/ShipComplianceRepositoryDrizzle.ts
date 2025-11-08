// src/adapters/outbound/postgres/ShipComplianceRepositoryDrizzle.ts
import { db } from "../../../infrastructure/db/connection";
import { shipCompliance } from "../../../infrastructure/db/schema";
import { eq, and } from "drizzle-orm";
import { ShipComplianceRepository } from "../../../core/ports/outbound";
import { ShipCompliance } from "../../../core/domain/entities/ShipCompliance";

export class ShipComplianceRepositoryDrizzle
    implements ShipComplianceRepository
{
    async getCompliance(
        shipId: string,
        year: number
    ): Promise<ShipCompliance | null> {
        const compliance = await db
            .select()
            .from(shipCompliance)
            .where(
                and(
                    eq(shipCompliance.ship_id, shipId),
                    eq(shipCompliance.year, year)
                )
            )
            .limit(1);

        if (compliance.length === 0) return null;

        const c = compliance[0];
        return {
            id: c.id,
            shipId: c.ship_id,
            year: c.year,
            cbGco2eq: Number(c.cb_gco2eq),
        };
    }

    async saveCompliance(compliance: ShipCompliance): Promise<void> {
        await db
            .delete(shipCompliance)
            .where(
                and(
                    eq(shipCompliance.ship_id, compliance.shipId),
                    eq(shipCompliance.year, compliance.year)
                )
            )
            .execute();

        await db
            .insert(shipCompliance)
            .values({
                ship_id: compliance.shipId,
                year: compliance.year,
                cb_gco2eq: compliance.cbGco2eq.toString(), // convert decimal to string
            })
            .execute();
    }
}
