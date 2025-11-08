import React, { useState, useEffect } from 'react';
import { useCompliance } from '../../hooks/useCompliance';
import { useBanking } from '../../hooks/useBanking';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { ComplianceBalance } from '@/core/domain/entities/ShipCompliance';
import type { BankEntry, BankingStatus } from '@/core/domain/entities/BankEntry';

export const BankingTab: React.FC = () => {
  const { fetchComplianceBalance } = useCompliance();
  const { 
    bankSurplus, 
    applyBanked, 
    fetchShipBankingHistory,
    fetchBankingStatus,
    loading 
  } = useBanking();
  
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('2024');
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [cbData, setCbData] = useState<ComplianceBalance | null>(null);
  const [bankingHistory, setBankingHistory] = useState<BankEntry[]>([]);
  const [bankingStatus, setBankingStatus] = useState<BankingStatus | null>(null);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-fetch CB and status when ship/year changes
  useEffect(() => {
    if (shipId && year) {
      handleFetchAll();
    } else {
      // Clear data when ship/year is empty
      setCbData(null);
      setBankingStatus(null);
      setBankingHistory([]);
      setResultMessage(null);
    }
  }, [shipId, year]);

  const handleFetchAll = async () => {
    if (!shipId || !year) return;

    try {
      setResultMessage(null);
      
      // Fetch CB and banking data in parallel
      const [cbResult, statusData, historyData] = await Promise.all([
        fetchComplianceBalance(shipId, parseInt(year)).catch(() => null),
        fetchBankingStatus(shipId, parseInt(year)).catch(() => null),
        fetchShipBankingHistory(shipId).catch(() => []),
      ]);
      
      // Update CB data if available
      if (cbResult && cbResult.cbBefore !== undefined) {
        setCbData(cbResult);
      } else {
        setCbData(null);
      }
      
      // Update banking status and history
      setBankingStatus(statusData);
      setBankingHistory(historyData);
      
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const handleFetchCB = async () => {
    if (!shipId || !year) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Please enter both Ship ID and Year' 
      });
      return;
    }

    await handleFetchAll();
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year || !bankAmount) {
      setResultMessage({ type: 'error', text: '❌ Fill all fields' });
      return;
    }

    const amountValue = parseFloat(bankAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setResultMessage({ type: 'error', text: '❌ Amount must be positive' });
      return;
    }

    try {
      setResultMessage(null);
      const result = await bankSurplus({
        shipId,
        year: parseInt(year),
        amount: amountValue,
      });
      
      setResultMessage({ 
        type: 'success', 
        text: `✅ ${result.message}\nCB: ${result.cbBefore?.toLocaleString()} → ${result.cbAfter?.toLocaleString()} gCO₂eq`
      });
      
      await handleFetchAll();
      setBankAmount('');
    } catch (err) {
      setResultMessage({ 
        type: 'error', 
        text: `❌ ${err instanceof Error ? err.message : 'Banking failed'}`
      });
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year || !applyAmount) {
      setResultMessage({ type: 'error', text: '❌ Fill all fields' });
      return;
    }

    const amountValue = parseFloat(applyAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setResultMessage({ type: 'error', text: '❌ Amount must be positive' });
      return;
    }

    try {
      setResultMessage(null);
      const result = await applyBanked({
        shipId,
        year: parseInt(year),
        amount: amountValue,
      });
      
      setResultMessage({ 
        type: 'success', 
        text: `✅ ${result.message}\nCB: ${result.cbBefore?.toLocaleString()} → ${result.cbAfter?.toLocaleString()} gCO₂eq`
      });
      
      await handleFetchAll();
      setApplyAmount('');
    } catch (err) {
      setResultMessage({ 
        type: 'error', 
        text: `❌ ${err instanceof Error ? err.message : 'Application failed'}`
      });
    }
  };

  const hasSurplus = cbData && cbData.cbBefore > 0;
  const hasDeficit = cbData && cbData.cbBefore < 0;

  return (
    <div className="space-y-6">
      <Card title="Banking - Article 20">
        <div className="prose max-w-none mb-6">
          <p className="text-sm text-gray-600">
            Banking allows ships to save surplus CB for future years or apply banked CB to offset deficits.
            Banked CB can only be used by the same ship (same ID) across different years.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ship ID</label>
            <input
              type="text"
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              placeholder="e.g., R001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleFetchCB} loading={loading} className="w-full">
              Fetch CB & Status
            </Button>
          </div>
        </div>

        {/* Result Message */}
        {resultMessage && (
          <div className={`p-4 rounded-lg mb-6 ${
            resultMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium whitespace-pre-line">{resultMessage.text}</p>
          </div>
        )}

        {/* Banking Status Card */}
        {bankingStatus?.exists && (
          <Card title={`Banking Status: ${shipId} (${year})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Current CB</div>
                <div className={`text-2xl font-bold ${
                  (bankingStatus.currentCB ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(bankingStatus.currentCB ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                <Badge 
                  variant={bankingStatus.status === 'SURPLUS' ? 'success' : bankingStatus.status === 'DEFICIT' ? 'danger' : 'default'}
                  className="mt-2"
                >
                  {bankingStatus.status}
                </Badge>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 mb-2">Total Banked</div>
                <div className="text-2xl font-bold text-blue-700">
                  {bankingStatus.banking?.totalBanked.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">gCO₂eq (Ship-wide)</div>
                <div className="text-xs text-blue-600 mt-1">All Years</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 mb-2">Total Applied</div>
                <div className="text-2xl font-bold text-purple-700">
                  {bankingStatus.banking?.totalApplied.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">gCO₂eq (Ship-wide)</div>
                <div className="text-xs text-purple-600 mt-1">All Years</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 mb-2">Available to Use</div>
                <div className="text-2xl font-bold text-green-700">
                  {bankingStatus.banking?.availableBanked.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                <div className="text-xs text-green-600 mt-1">For Ship {shipId}</div>
              </div>
            </div>

            {/* Year-specific Banking Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* This Year's Activity */}
              {bankingStatus.thisYear && bankingStatus.thisYear.transactions > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-medium text-amber-800 mb-2 flex items-center justify-between">
                    <span>Year {year} Activity</span>
                    <Badge variant="default">{bankingStatus.thisYear.transactions} transaction(s)</Badge>
                  </div>
                  {bankingStatus.thisYear.entries.map((entry, idx) => {
                    const isBanking = entry.amountGco2eq > 0;
                    return (
                      <div key={idx} className="mt-2 p-3 bg-white rounded border border-amber-200">
                        <div className="flex items-center justify-between">
                          <Badge variant={isBanking ? 'success' : 'danger'}>
                            {isBanking ? 'BANKED' : 'APPLIED'}
                          </Badge>
                          <span className={`font-bold ${isBanking ? 'text-green-600' : 'text-red-600'}`}>
                            {isBanking ? '+' : ''}{entry.amountGco2eq.toLocaleString()} gCO₂eq
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          CB: {entry.cbBefore?.toLocaleString() || 'N/A'} → {entry.cbAfter?.toLocaleString() || 'N/A'}
                        </div>
                        {entry.createdAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Year {year} Activity
                  </div>
                  <p className="text-xs text-gray-500">No banking transactions for this year</p>
                </div>
              )}

              {/* Other Years Summary */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="text-sm font-medium text-indigo-800 mb-2 flex items-center justify-between">
                  <span>Other Years Activity</span>
                  <Badge variant="default">{bankingStatus.otherYears?.transactions || 0} transaction(s)</Badge>
                </div>
                {bankingStatus.otherYears && bankingStatus.otherYears.transactions > 0 ? (
                  <div className="space-y-2">
                    {/* Group by year and show summary */}
                    {(() => {
                      const yearGroups = bankingStatus.otherYears.entries.reduce((acc, entry) => {
                        const yr = entry.year.toString();
                        if (!acc[yr]) {
                          acc[yr] = { banked: 0, applied: 0 };
                        }
                        if (entry.amountGco2eq > 0) {
                          acc[yr].banked += entry.amountGco2eq;
                        } else {
                          acc[yr].applied += Math.abs(entry.amountGco2eq);
                        }
                        return acc;
                      }, {} as Record<string, { banked: number; applied: number }>);

                      return Object.entries(yearGroups).map(([yr, amounts]) => (
                        <div key={yr} className="p-2 bg-white rounded border border-indigo-100">
                          <div className="text-xs font-medium text-indigo-700 mb-1">Year {yr}</div>
                          <div className="flex items-center justify-between text-xs">
                            {amounts.banked > 0 && (
                              <span className="text-green-600">
                                Banked: +{amounts.banked.toLocaleString()}
                              </span>
                            )}
                            {amounts.applied > 0 && (
                              <span className="text-red-600">
                                Applied: -{amounts.applied.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-600">No transactions in other years</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Banking Actions */}
        {cbData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card title="Bank Surplus">
              <p className="text-sm text-gray-600 mb-4">
                Save positive CB for future use (requires CB &gt; 0)
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (gCO₂eq)
                </label>
                <input
                  type="number"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={!hasSurplus}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
              <Button
                onClick={handleBankSurplus}
                loading={loading}
                disabled={!hasSurplus}
                variant="success"
                className="w-full"
              >
                Bank Surplus
              </Button>
            </Card>

            <Card title="Apply Banked Surplus">
              <p className="text-sm text-gray-600 mb-4">
                Use banked surplus to offset deficit (requires CB &lt; 0)
              </p>
              {bankingStatus?.banking && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  bankingStatus.banking.availableBanked > 0 
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-xs ${
                    bankingStatus.banking.availableBanked > 0 
                      ? 'text-blue-700' 
                      : 'text-red-700'
                  }`}>
                    {bankingStatus.banking.availableBanked > 0 ? (
                      <>
                        Available to apply: <span className="font-bold">
                          {bankingStatus.banking.availableBanked.toLocaleString()} gCO₂eq
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">⚠️ No banked surplus available</span>
                        <br />
                        <span className="text-xs">
                          You need to bank surplus first from a year with positive CB (CB &gt; 0) before you can apply it to offset a deficit.
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (gCO₂eq)
                </label>
                <input
                  type="number"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  placeholder={
                    bankingStatus?.banking?.availableBanked 
                      ? `Max: ${bankingStatus.banking.availableBanked}` 
                      : 'No banked CB available'
                  }
                  disabled={!hasDeficit || (bankingStatus?.banking?.availableBanked ?? 0) <= 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
              <Button
                onClick={handleApplyBanked}
                loading={loading}
                disabled={!hasDeficit || (bankingStatus?.banking?.availableBanked ?? 0) <= 0}
                variant="primary"
                className="w-full"
              >
                Apply Banked
              </Button>
              {!hasDeficit && cbData && cbData.cbBefore !== undefined && (
                <p className="text-xs text-amber-600 mt-3 p-2 bg-amber-50 rounded">
                  {cbData.cbBefore === 0 
                    ? '⚠️ CB is 0 - Ship is compliant, no deficit to cover'
                    : cbData.cbBefore > 0
                    ? `⚠️ CB is positive (${cbData.cbBefore.toFixed(2)} gCO₂eq) - Apply is only for deficits (CB < 0)`
                    : ''
                  }
                </p>
              )}
              {hasDeficit && (bankingStatus?.banking?.availableBanked ?? 0) <= 0 && (
                <p className="text-xs text-red-600 mt-3 p-2 bg-red-50 rounded">
                  ❌ Cannot apply: No banked surplus available for ship {shipId}.
                  <br />
                  💡 Bank surplus from a year with positive CB first.
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Complete Banking History */}
        {bankingHistory.length > 0 && (
          <Card title={`Complete Banking History: ${shipId} (All Years)`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB Before</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CB After</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankingHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.year}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={entry.transactionType === 'BANK' ? 'success' : 'default'}>
                          {entry.transactionType || (entry.amountGco2eq > 0 ? 'BANK' : 'APPLY')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {entry.cbBefore !== undefined 
                          ? entry.cbBefore.toLocaleString() 
                          : 'N/A'}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                        entry.amountGco2eq > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.amountGco2eq > 0 ? '+' : ''}
                        {entry.amountGco2eq.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {entry.cbAfter !== undefined 
                          ? entry.cbAfter.toLocaleString() 
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};