import { RouteRepository } from "../../ports/outbound";
import { Route } from "../../domain/entities/Route";
import {
    TARGET_INTENSITY_2025,
    calculatePercentDiff,
} from "../../../shared/constants.js";

export class RouteService {
    constructor(private routeRepo: RouteRepository) {}

    /**
     * Returns all routes.
     */
    async listRoutes(): Promise<Route[]> {
        return this.routeRepo.getAllRoutes();
    }

    /**
     * Marks the route with the given routeId as the baseline.
     * Only one baseline per set of routes is allowed.
     * @param routeId - the route identifier to set as baseline
     */
    async setBaseline(routeId: string): Promise<void> {
        await this.routeRepo.setBaseline(routeId);
    }

    /**
     * Retrieves a route by its routeId.
     * Returns null if route not found.
     * @param routeId - the route identifier
     */
    async getRoute(routeId: string): Promise<Route | null> {
        return this.routeRepo.getRouteById(routeId);
    }

    /**
     * Returns comparison data between baseline and other routes.
     * Calculates percentDiff and compliant flags based on target intensity.
     */
    async getComparison(): Promise<any> {
        const routes = await this.routeRepo.getAllRoutes();
        const baseline = routes.find((r) => r.isBaseline);

        if (!baseline) {
            return {
                error: "No baseline route set",
                routes: routes.map((r) => ({
                    ...r,
                    percentDiff: 0,
                    compliant: r.ghgIntensity <= TARGET_INTENSITY_2025,
                })),
            };
        }

        const comparisons = routes
            .filter((r) => !r.isBaseline)
            .map((r) => ({
                ...r,
                percentDiff: calculatePercentDiff(
                    r.ghgIntensity,
                    baseline.ghgIntensity
                ),
                compliant: r.ghgIntensity <= TARGET_INTENSITY_2025,
            }));

        return {
            baseline: {
                ...baseline,
                percentDiff: 0,
                compliant: baseline.ghgIntensity <= TARGET_INTENSITY_2025,
            },
            comparisons,
            targetIntensity: TARGET_INTENSITY_2025,
        };
    }
}
