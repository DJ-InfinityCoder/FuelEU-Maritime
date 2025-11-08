import { useState, useEffect } from 'react';
import { routesAdapter } from '@/adapters/infrastructure/api/RoutesAdapter';
import type { Route, RouteComparison } from '@/core/domain/entities/Route';

export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routesAdapter.getAllRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const setBaseline = async (routeId: string) => {
    try {
      await routesAdapter.setBaseline(routeId);
      await fetchRoutes(); // Refresh routes
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to set baseline');
    }
  };

  return { routes, loading, error, setBaseline, refetch: fetchRoutes };
};

export const useComparison = () => {
  const [comparisons, setComparisons] = useState<RouteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routesAdapter.getComparison();
      setComparisons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  return { comparisons, loading, error, refetch: fetchComparison };
};
