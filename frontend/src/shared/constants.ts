// Shared constants for FuelEU Maritime compliance
export const FUEL_EU_CONSTANTS = {
  // Target intensity for 2025 (2% below 91.16)
  TARGET_INTENSITY_2025: 89.3368, // gCO₂e/MJ
  
  // Energy conversion factor
  ENERGY_CONVERSION_FACTOR: 41000, // MJ per ton of fuel
  
  // Base intensity (reference year)
  BASE_INTENSITY: 91.16, // gCO₂e/MJ
  
  // Reduction percentages by year
  REDUCTION_2025: 0.02, // 2%
} as const;

export const VESSEL_TYPES = [
  'Container',
  'BulkCarrier',
  'Tanker',
  'RoRo',
  'General Cargo',
  'LNG Carrier',
  'Chemical Tanker',
  'Cruise',
] as const;

export const FUEL_TYPES = [
  'HFO',
  'MGO',
  'LNG',
  'Methanol',
  'Ammonia',
  'Hydrogen',
  'Bio-LNG',
] as const;

export type VesselType = typeof VESSEL_TYPES[number];
export type FuelType = typeof FUEL_TYPES[number];
