import React, { useState } from 'react';
import { useComparison } from '../../hooks/useRoutes';
import { useCompliance } from '../../hooks/useCompliance';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FUEL_EU_CONSTANTS } from '@/shared/constants';

export const CompareTab: React.FC = () => {
  const { comparisons, loading, error, refetch } = useComparison();
  const { computeCompliance, loading: computeLoading } = useCompliance();
  const [computeMessage, setComputeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleComputeCompliance = async () => {
    try {
      setComputeMessage(null);
      const result = await computeCompliance();
      setComputeMessage({
        type: 'success',
        text: `✅ Compliance Balance computed successfully! ${result.results?.length || 0} routes processed.`
      });
      // Refresh comparison data after computing
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      setComputeMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to compute compliance'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  // Handle the actual backend response format
  const comparisonData = comparisons as any;
  const baseline = comparisonData?.baseline || null;
  const comparisonsList = Array.isArray(comparisonData?.comparisons) ? comparisonData.comparisons : [];

  // Prepare chart data
  const chartData = comparisonsList.map((comp: any) => ({
    name: comp.routeId,
    baseline: baseline?.ghgIntensity || 0,
    comparison: comp.ghgIntensity,
    target: FUEL_EU_CONSTANTS.TARGET_INTENSITY_2025,
  }));

  return (
    <div className="space-y-6">
      {/* Compute Compliance Balance Button */}
      <Card title="Compliance Balance Computation">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Compute CB for All Routes</h4>
              <p className="text-xs text-blue-700 mt-1">
                Calculate Compliance Balance using: CB = (Target Intensity - Actual Intensity) × Energy in Scope
              </p>
            </div>
            <Button
              onClick={handleComputeCompliance}
              disabled={computeLoading}
              variant="primary"
            >
              {computeLoading ? 'Computing...' : '🧮 Compute CB'}
            </Button>
          </div>
          
          {computeMessage && (
            <div className={`mt-3 p-3 rounded ${
              computeMessage.type === 'success' 
                ? 'bg-green-100 border border-green-300 text-green-800' 
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              <p className="text-sm font-medium">{computeMessage.text}</p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Baseline vs Comparison Routes">
        {!baseline ? (
          <div className="text-center py-8 text-gray-500">
            <p>No baseline route selected. Please set a baseline in the Routes tab.</p>
          </div>
        ) : (
          <>
            {/* Baseline Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Baseline Route</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Route ID:</span>
                  <span className="ml-2 font-medium text-blue-900">{baseline.routeId}</span>
                </div>
                <div>
                  <span className="text-blue-700">Vessel:</span>
                  <span className="ml-2 font-medium text-blue-900">{baseline.vesselType}</span>
                </div>
                <div>
                  <span className="text-blue-700">Fuel:</span>
                  <span className="ml-2 font-medium text-blue-900">{baseline.fuelType}</span>
                </div>
                <div>
                  <span className="text-blue-700">GHG Intensity:</span>
                  <span className="ml-2 font-medium text-blue-900">
                    {baseline.ghgIntensity.toFixed(2)} gCO₂e/MJ
                  </span>
                </div>
              </div>
            </div>

            {/* Target Info */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                Target Intensity (2025)
              </h4>
              <div className="text-sm">
                <span className="text-green-700">Target:</span>
                <span className="ml-2 font-medium text-green-900">
                  {FUEL_EU_CONSTANTS.TARGET_INTENSITY_2025.toFixed(4)} gCO₂e/MJ
                </span>
                <span className="ml-4 text-green-700">
                  (2% below {FUEL_EU_CONSTANTS.BASE_INTENSITY} gCO₂e/MJ)
                </span>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vessel Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fuel Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Baseline<br />
                      <span className="text-xs font-normal">(gCO₂e/MJ)</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comparison<br />
                      <span className="text-xs font-normal">(gCO₂e/MJ)</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonsList.map((comp: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comp.routeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comp.vesselType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="info">{comp.fuelType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {baseline?.ghgIntensity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {comp.ghgIntensity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            comp.percentDiff < 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {comp.percentDiff > 0 ? '+' : ''}
                          {comp.percentDiff.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comp.compliant ? (
                          <Badge variant="success">✅ Compliant</Badge>
                        ) : (
                          <Badge variant="danger">❌ Non-Compliant</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <Card title="GHG Intensity Comparison">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine
                    y={FUEL_EU_CONSTANTS.TARGET_INTENSITY_2025}
                    label="Target"
                    stroke="green"
                    strokeDasharray="5 5"
                  />
                  <Bar dataKey="baseline" fill="#3b82f6" name="Baseline" />
                  <Bar dataKey="comparison" fill="#f59e0b" name="Comparison" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};
