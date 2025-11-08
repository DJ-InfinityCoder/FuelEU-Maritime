// src/adapters/inbound/http/controllers/PoolsController.ts
import { Request, Response } from "express";
import { PoolService } from "../../../../core/application/services/PoolService";

export class PoolsController {
    constructor(private poolService: PoolService) {}

    async createPool(req: Request, res: Response): Promise<void> {
        try {
            const { year, members } = req.body;
            
            // Validate request body
            if (!year) {
                res.status(400).json({ error: "Year is required" });
                return;
            }

            if (!members || !Array.isArray(members) || members.length === 0) {
                res.status(400).json({ 
                    error: "members array is required with at least 2 ships" 
                });
                return;
            }

            const result = await this.poolService.createPoolWithMembers({ year, members });
            res.status(201).json(result);
        } catch (error: any) {
            console.error(error);
            
            // Return validation errors as 400 Bad Request
            if (error.message && (
                error.message.includes("at least") ||
                error.message.includes("Duplicate") ||
                error.message.includes("No compliance record") ||
                error.message.includes("total CB must be") ||
                error.message.includes("cannot exit") ||
                error.message.includes("must have")
            )) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Failed to create pool" });
            }
        }
    }

    async getPoolsByQuery(req: Request, res: Response): Promise<void> {
        try {
            const { year } = req.query;
            
            if (year) {
                const yearNum = Number(year);
                const pools = await this.poolService.getPoolsByYear(yearNum);
                res.status(200).json(pools);
            } else {
                res.status(400).json({ error: "Year query parameter is required" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get pools" });
        }
    }

    async getPoolsByYear(req: Request, res: Response): Promise<void> {
        try {
            const year = Number(req.params.year);
            const pools = await this.poolService.getPoolsByYear(year);
            res.status(200).json(pools);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get pools" });
        }
    }

    async getPoolById(req: Request, res: Response): Promise<void> {
        try {
            const poolId = Number(req.params.poolId);
            const pool = await this.poolService.getPoolById(poolId);
            if (!pool) {
                res.status(404).json({ error: "Pool not found" });
                return;
            }
            res.status(200).json(pool);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get pool" });
        }
    }

    async addPoolMembers(req: Request, res: Response): Promise<void> {
        try {
            const members = req.body; // expect array of PoolMember DTOs
            await this.poolService.addPoolMembers(members);
            res.status(201).json({ message: "Pool members added" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to add pool members" });
        }
    }

    async getPoolMembers(req: Request, res: Response): Promise<void> {
        try {
            const poolId = Number(req.params.poolId);
            const members = await this.poolService.getPoolMembers(poolId);
            res.status(200).json(members);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get pool members" });
        }
    }
}
