// src/shared/constants.ts
import 'dotenv/config';

// FuelEU Maritime Constants based on (EU) 2023/1805
export const TARGET_INTENSITY_2025 = Number(process.env.TARGET_INTENSITY_2025) || 89.3368; // gCO₂e/MJ
export const ENERGY_FACTOR_MJ_PER_TON = Number(process.env.ENERGY_FACTOR_MJ_PER_TON) || 41000; // MJ/t
export const BASELINE_INTENSITY = 91.16; // gCO₂e/MJ (2% reduction from baseline)

/**
 * Calculate energy in scope from fuel consumption
 * @param fuelConsumptionTons - Fuel consumption in tons
 * @returns Energy in MJ
 */
export function calculateEnergyInScope(fuelConsumptionTons: number): number {
    return fuelConsumptionTons * ENERGY_FACTOR_MJ_PER_TON;
}

/**
 * Calculate Compliance Balance (CB)
 * CB = (Target Intensity - Actual Intensity) × Energy in scope
 * Positive CB = Surplus, Negative CB = Deficit
 * 
 * @param targetIntensity - Target GHG intensity (gCO₂e/MJ)
 * @param actualIntensity - Actual GHG intensity (gCO₂e/MJ)
 * @param energyInScope - Energy in scope (MJ)
 * @returns Compliance Balance in gCO₂eq
 */
export function calculateComplianceBalance(
    targetIntensity: number,
    actualIntensity: number,
    energyInScope: number
): number {
    return (targetIntensity - actualIntensity) * energyInScope;
}

/**
 * Calculate percent difference between comparison and baseline
 * @param comparison - Comparison value
 * @param baseline - Baseline value
 * @returns Percentage difference
 */
export function calculatePercentDiff(comparison: number, baseline: number): number {
    if (baseline === 0) return 0;
    return ((comparison / baseline) - 1) * 100;
}
