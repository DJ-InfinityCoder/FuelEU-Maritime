// Core Domain Entity: Pool
export interface Pool {
  id: string;
  year: number;
  createdAt: string;
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface CreatePoolRequest {
  year: number;
  members: {
    shipId: string;
    cbBefore: number;
  }[];
}

export interface CreatePoolResponse {
  pool: Pool;
  members: PoolMember[];
  totalCbBefore: number;
  totalCbAfter: number;
  valid: boolean;
  message?: string;
}
