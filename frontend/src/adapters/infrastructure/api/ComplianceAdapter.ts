import { apiClient } from './ApiClient';
import type { ICompliancePort } from '@/core/ports/outbound';
import type { ShipCompliance, ComplianceBalance } from '@/core/domain/entities/ShipCompliance';

export class ComplianceAdapter implements ICompliancePort {
  async getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    return apiClient.get<ComplianceBalance>('/compliance/cb', {
      shipId,
      year,
    });
  }

  async getAdjustedComplianceBalance(
    shipId: string,
    year: number
  ): Promise<ShipCompliance> {
    return apiClient.get<ShipCompliance>('/compliance/adjusted-cb', {
      shipId,
      year,
    });
  }

  async computeCompliance(): Promise<any> {
    return apiClient.get<any>('/compliance/cb');
  }
}

export const complianceAdapter = new ComplianceAdapter();
