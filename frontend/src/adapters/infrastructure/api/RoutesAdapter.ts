import { apiClient } from './ApiClient';
import type { IRoutesPort } from '@/core/ports/outbound';
import type { Route, RouteComparison } from '@/core/domain/entities/Route';

export class RoutesAdapter implements IRoutesPort {
  async getAllRoutes(): Promise<Route[]> {
    return apiClient.get<Route[]>('/routes');
  }

  async setBaseline(routeId: string): Promise<void> {
    await apiClient.post(`/routes/${routeId}/baseline`);
  }

  async getComparison(): Promise<RouteComparison[]> {
    return apiClient.get<RouteComparison[]>('/routes/comparison');
  }
}

export const routesAdapter = new RoutesAdapter();
