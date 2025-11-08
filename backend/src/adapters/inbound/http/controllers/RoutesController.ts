// src/adapters/inbound/http/controllers/RoutesController.ts
import { Request, Response } from "express";
import { RouteService } from "../../../../core/application/services/RouteService";

export class RoutesController {
    constructor(private routeService: RouteService) {}

    async getRoutes(req: Request, res: Response): Promise<void> {
        try {
            const routes = await this.routeService.listRoutes();
            res.status(200).json(routes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get routes" });
        }
    }

    async getRouteById(req: Request, res: Response): Promise<void> {
        try {
            const { routeId } = req.params;
            const route = await this.routeService.getRoute(routeId);
            if (!route) {
                res.status(404).json({ error: "Route not found" });
                return;
            }
            res.status(200).json(route);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get route" });
        }
    }

    async setBaseline(req: Request, res: Response): Promise<void> {
        try {
            const { routeId } = req.params;
            await this.routeService.setBaseline(routeId);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to set baseline" });
        }
    }

    async getComparison(req: Request, res: Response): Promise<void> {
        try {
            const comparison = await this.routeService.getComparison();
            res.status(200).json(comparison);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get comparison" });
        }
    }
}
