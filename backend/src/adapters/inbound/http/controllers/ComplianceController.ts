// src/adapters/inbound/http/controllers/ComplianceController.ts
import { Request, Response } from "express";
import { ShipComplianceService } from "../../../../core/application/services/ShipComplianceService";

export class ComplianceController {
    constructor(private complianceService: ShipComplianceService) {}

    async getCompliance(req: Request, res: Response): Promise<void> {
        try {
            const { shipId, year } = req.params;
            const yearNum = Number(year);
            const compliance = await this.complianceService.getCompliance(
                shipId,
                yearNum
            );
            if (!compliance) {
                res.status(404).json({ error: "Compliance record not found" });
                return;
            }
            res.status(200).json(compliance);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get compliance" });
        }
    }

    async saveCompliance(req: Request, res: Response): Promise<void> {
        try {
            const compliance = req.body;
            await this.complianceService.saveCompliance(compliance);
            res.status(201).json({ message: "Compliance saved" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to save compliance" });
        }
    }

    async computeAndStoreCB(req: Request, res: Response): Promise<void> {
        try {
            // Support query parameters: ?shipId=R001&year=2024
            const { shipId, year } = req.query;

            if (shipId && year) {
                // Get CB for specific ship and year
                const yearNum = Number(year);
                const compliance = await this.complianceService.getCompliance(
                    shipId as string,
                    yearNum
                );

                if (!compliance) {
                    // Compute if not found
                    const result = await this.complianceService.computeAndStoreCB();
                    res.status(200).json(result);
                } else {
                    // Return in ComplianceBalance format for frontend
                    res.status(200).json({
                        shipId: compliance.shipId,
                        year: compliance.year,
                        cbBefore: compliance.cbGco2eq,
                        applied: 0,
                        cbAfter: compliance.cbGco2eq,
                    });
                }
            } else {
                // Compute CB for all routes
                const result = await this.complianceService.computeAndStoreCB();
                res.status(200).json(result);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to compute and store CB" });
        }
    }

    async getAdjustedCB(req: Request, res: Response): Promise<void> {
        try {
            // Support query parameters: ?shipId=R001&year=2024
            const { shipId, year } = req.query;

            console.log('[getAdjustedCB] Query params:', { shipId, year });

            if (shipId && year) {
                const yearNum = Number(year);
                const compliance = await this.complianceService.getCompliance(
                    shipId as string,
                    yearNum
                );
                
                console.log('[getAdjustedCB] Compliance record:', compliance);
                
                if (!compliance) {
                    res.status(404).json({ 
                        error: `No compliance record found for ship ${shipId} in year ${year}. Please compute CB first by going to Compare Tab and clicking "Compute CB".` 
                    });
                    return;
                }
                
                const response = {
                    shipId,
                    year: yearNum,
                    cbGco2eq: compliance.cbGco2eq,
                    adjustedCbGco2eq: compliance.cbGco2eq, // Same value for compatibility
                };
                
                console.log('[getAdjustedCB] Sending response:', response);
                
                res.status(200).json(response);
            } else {
                const adjustedCB = await this.complianceService.getAdjustedCB();
                res.status(200).json(adjustedCB);
            }
        } catch (error) {
            console.error('[getAdjustedCB] Error:', error);
            res.status(500).json({ error: "Failed to get adjusted CB" });
        }
    }
}
