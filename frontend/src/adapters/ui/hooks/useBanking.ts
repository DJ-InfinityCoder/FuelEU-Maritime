import { useState } from 'react';
import { bankingAdapter } from '@/adapters/infrastructure/api/BankingAdapter';
import type { BankEntry, BankingOperation, BankingResult, BankingStatus } from '@/core/domain/entities/BankEntry';

export const useBanking = () => {
  const [records, setRecords] = useState<BankEntry[]>([]);
  const [history, setHistory] = useState<BankEntry[]>([]);
  const [status, setStatus] = useState<BankingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BankingResult | null>(null);

  const fetchBankingRecords = async (shipId: string, year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankingAdapter.getBankingRecords(shipId, year);
      setRecords(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch banking records';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchShipBankingHistory = async (shipId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankingAdapter.getShipBankingHistory(shipId);
      setHistory(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch banking history';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchBankingStatus = async (shipId: string, year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankingAdapter.getBankingStatus(shipId, year);
      setStatus(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch banking status';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bankSurplus = async (operation: BankingOperation) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankingAdapter.bankSurplus(operation);
      setResult(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to bank surplus';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyBanked = async (operation: BankingOperation) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankingAdapter.applyBanked(operation);
      setResult(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to apply banked';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    records,
    history,
    status,
    loading,
    error,
    result,
    fetchBankingRecords,
    fetchShipBankingHistory,
    fetchBankingStatus,
    bankSurplus,
    applyBanked,
  };
};