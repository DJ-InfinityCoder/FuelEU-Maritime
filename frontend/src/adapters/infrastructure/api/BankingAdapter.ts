import { apiClient } from './ApiClient';
import type { IBankingPort } from '@/core/ports/outbound';
import type {
  BankEntry,
  BankingOperation,
  BankingResult,
  BankingStatus,
} from '@/core/domain/entities/BankEntry';

export class BankingAdapter implements IBankingPort {
  async getBankingRecords(shipId: string, year: number): Promise<BankEntry[]> {
    return apiClient.get<BankEntry[]>('/banking/records', {
      shipId,
      year,
    });
  }

  async getShipBankingHistory(shipId: string): Promise<BankEntry[]> {
    return apiClient.get<BankEntry[]>(`/banking/history/${shipId}`);
  }

  async getBankingStatus(shipId: string, year: number): Promise<BankingStatus> {
    return apiClient.get<BankingStatus>(`/banking/status/${shipId}/${year}`);
  }

  async bankSurplus(operation: BankingOperation): Promise<BankingResult> {
    return apiClient.post<BankingResult>('/banking/bank', operation);
  }

  async applyBanked(operation: BankingOperation): Promise<BankingResult> {
    return apiClient.post<BankingResult>('/banking/apply', operation);
  }
}

export const bankingAdapter = new BankingAdapter();