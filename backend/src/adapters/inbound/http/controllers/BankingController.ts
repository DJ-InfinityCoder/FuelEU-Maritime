// src/adapters/inbound/http/controllers/BankingController.ts
import { Request, Response } from "express";
import { BankingService } from "../../../../core/application/services/BankingService";

export class BankingController {
    constructor(private bankingService: BankingService) {}

    async getBankEntries(req: Request, res: Response): Promise<void> {
        try {
            const { shipId, year } = req.params;
            const yearNum = Number(year);
            const entries = await this.bankingService.getBankEntries(
                shipId,
                yearNum
            );
            res.status(200).json(entries);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get bank entries" });
        }
    }

    async addBankEntry(req: Request, res: Response): Promise<void> {
        try {
            const entry = req.body;
            await this.bankingService.addBankEntry(entry);
            res.status(201).json({ message: "Bank entry added" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to add bank entry" });
        }
    }

    async getBankRecords(req: Request, res: Response): Promise<void> {
        try {
            // Support query parameters: ?shipId=R001&year=2024
            const { shipId, year } = req.query;

            if (shipId && year) {
                const yearNum = Number(year);
                const entries = await this.bankingService.getBankEntries(
                    shipId as string,
                    yearNum
                );
                res.status(200).json(entries);
            } else if (shipId) {
                // Get all entries for a specific ship
                const allEntries = await this.bankingService.getBankRecords();
                const filtered = allEntries.filter(e => e.shipId === shipId);
                res.status(200).json(filtered);
            } else {
                // Get all bank records
                const records = await this.bankingService.getBankRecords();
                res.status(200).json(records);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get bank records" });
        }
    }

    async bankSurplus(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.bankingService.bankSurplus(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            console.error(error);
            // Return validation errors as 400 Bad Request
            if (error.message && (
                error.message.includes("Only positive") ||
                error.message.includes("No compliance record") ||
                error.message.includes("deficit CB") ||
                error.message.includes("only has")
            )) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Failed to bank surplus" });
            }
        }
    }

    async applyBankedSurplus(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.bankingService.applyBankedSurplus(req.body);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            // Return validation errors as 400 Bad Request
            if (error.message && (
                error.message.includes("must be positive") ||
                error.message.includes("No compliance record") ||
                error.message.includes("surplus CB") ||
                error.message.includes("no banked surplus") ||
                error.message.includes("Insufficient banked") ||
                error.message.includes("only has a deficit")
            )) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Failed to apply banked surplus" });
            }
        }
    }

    async getShipBankingHistory(req: Request, res: Response): Promise<void> {
        try {
            const { shipId } = req.params;
            const history = await this.bankingService.getShipBankingHistory(shipId);
            res.status(200).json(history);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get banking history" });
        }
    }

    async getBankingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { shipId, year } = req.params;
            const yearNum = Number(year);
            const status = await this.bankingService.getBankingStatus(shipId, yearNum);
            res.status(200).json(status);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get banking status" });
        }
    }
}