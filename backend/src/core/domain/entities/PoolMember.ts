// src/core/domain/entities/PoolMember.ts
export interface PoolMember {
    poolId: number;
    shipId: string;
    cbBefore: number; // CB before pooling
    cbAfter: number; // CB after pooling allocation
}
