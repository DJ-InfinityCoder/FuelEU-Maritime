import { useState } from 'react';
import { poolingAdapter } from '@/adapters/infrastructure/api/PoolingAdapter';
import type { Pool, CreatePoolRequest, CreatePoolResponse } from '@/core/domain/entities/Pool';

export const usePooling = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<CreatePoolResponse | null>(null);

  const fetchPools = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await poolingAdapter.getPools(year);
      setPools(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch pools';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createPool = async (request: CreatePoolRequest) => {
    try {
      setLoading(true);
      setError(null);
      const data = await poolingAdapter.createPool(request);
      setCreateResult(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create pool';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchPoolById = async (poolId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await poolingAdapter.getPoolById(poolId);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch pool';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchPoolMembers = async (poolId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await poolingAdapter.getPoolMembers(poolId);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch pool members';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    pools,
    loading,
    error,
    createResult,
    fetchPools,
    createPool,
    fetchPoolById,
    fetchPoolMembers,
  };
};
