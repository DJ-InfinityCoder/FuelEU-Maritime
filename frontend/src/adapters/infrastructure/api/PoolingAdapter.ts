import { apiClient } from './ApiClient';
import type { IPoolingPort } from '@/core/ports/outbound';
import type {
  Pool,
  CreatePoolRequest,
  CreatePoolResponse,
  PoolMember,
} from '@/core/domain/entities/Pool';

export class PoolingAdapter implements IPoolingPort {
  async createPool(request: CreatePoolRequest): Promise<CreatePoolResponse> {
    return apiClient.post<CreatePoolResponse>('/pools', request);
  }

  async getPools(year: number): Promise<Pool[]> {
    return apiClient.get<Pool[]>('/pools', { year });
  }

  async getPoolById(poolId: number): Promise<Pool> {
    return apiClient.get<Pool>(`/pools/${poolId}`);
  }

  async getPoolMembers(poolId: number): Promise<PoolMember[]> {
    return apiClient.get<PoolMember[]>(`/pools/${poolId}/members`);
  }
}

export const poolingAdapter = new PoolingAdapter();
