import { useState } from 'react';
import { complianceAdapter } from '@/adapters/infrastructure/api/ComplianceAdapter';
import type { ComplianceBalance, ShipCompliance } from '@/core/domain/entities/ShipCompliance';

export const useCompliance = () => {
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplianceBalance = async (shipId: string, year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await complianceAdapter.getComplianceBalance(shipId, year);
      setCb(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch compliance balance';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustedCb = async (shipId: string, year: number): Promise<ShipCompliance> => {
    try {
      setLoading(true);
      setError(null);
      return await complianceAdapter.getAdjustedComplianceBalance(shipId, year);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch adjusted CB';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const computeCompliance = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await complianceAdapter.computeCompliance();
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to compute compliance';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cb,
    loading,
    error,
    fetchComplianceBalance,
    fetchAdjustedCb,
    computeCompliance,
  };
};
