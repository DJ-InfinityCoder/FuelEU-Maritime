// src/adapters/outbound/postgres/RouteRepositoryDrizzle.ts
import { db } from "../../../infrastructure/db/connection";
import { routes } from "../../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { RouteRepository } from "../../../core/ports/outbound";
import { Route } from "../../../core/domain/entities/Route";

export class RouteRepositoryDrizzle implements RouteRepository {
    async getAllRoutes(): Promise<Route[]> {
        const dbRoutes = await db.select().from(routes);
        return dbRoutes.map((r) => ({
            id: r.id,
            routeId: r.route_id,
            vesselType: r.vessel_type,
            fuelType: r.fuel_type,
            year: r.year,
            ghgIntensity: Number(r.ghg_intensity),
            fuelConsumption: Number(r.fuel_consumption),
            distance: Number(r.distance),
            totalEmissions: Number(r.total_emissions),
            isBaseline: r.is_baseline,
        }));
    }

    async setBaseline(routeId: string): Promise<void> {
        await db.update(routes).set({ is_baseline: false }).execute();

        await db
            .update(routes)
            .set({ is_baseline: true })
            .where(eq(routes.route_id, routeId))
            .execute();
    }

    async getRouteById(routeId: string): Promise<Route | null> {
        const dbRoute = await db
            .select()
            .from(routes)
            .where(eq(routes.route_id, routeId))
            .limit(1);

        if (dbRoute.length === 0) return null;

        const r = dbRoute[0];
        return {
            id: r.id,
            routeId: r.route_id,
            vesselType: r.vessel_type,
            fuelType: r.fuel_type,
            year: r.year,
            ghgIntensity: Number(r.ghg_intensity),
            fuelConsumption: Number(r.fuel_consumption),
            distance: Number(r.distance),
            totalEmissions: Number(r.total_emissions),
            isBaseline: r.is_baseline,
        };
    }
}
