import React, { useState } from 'react';
import { useCompliance } from '../../hooks/useCompliance';
import { useBanking } from '../../hooks/useBanking';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { ComplianceBalance } from '@/core/domain/entities/ShipCompliance';
import type { BankEntry } from '@/core/domain/entities/BankEntry';

export const BankingTab: React.FC = () => {
  const { fetchComplianceBalance } = useCompliance();
  const { bankSurplus, applyBanked, fetchBankingRecords, loading } = useBanking();
  
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('2024');
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [cbData, setCbData] = useState<ComplianceBalance | null>(null);
  const [bankingRecords, setBankingRecords] = useState<BankEntry[]>([]);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFetchCB = async () => {
    if (!shipId || !year) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Please enter both Ship ID and Year to fetch compliance balance' 
      });
      return;
    }

    try {
      setResultMessage(null);
      const data = await fetchComplianceBalance(shipId, parseInt(year));
      
      if (!data || data.cbBefore === undefined) {
        setResultMessage({ 
          type: 'error', 
          text: `❌ No Compliance Data Found\n` +
                `Ship: ${shipId} | Year: ${year}\n` +
                `The ship may not exist or CB hasn't been computed yet.\n` +
                `💡 Available Ships: R001, R002, R003 (2024) | R004, R005 (2025)\n` +
                `Tip: Go to Compare Tab and click "Compute CB" button first.`
        });
        return;
      }
      
      setCbData(data);
      
      // Show success message with CB details
      setResultMessage({ 
        type: 'success', 
        text: `✅ Compliance Balance Retrieved\n` +
              `Ship: ${shipId} | Year: ${year}\n` +
              `CB: ${data.cbBefore.toLocaleString()} gCO₂eq | ` +
              `Status: ${data.cbBefore > 0 ? 'Surplus' : data.cbBefore < 0 ? 'Deficit' : 'Neutral'}`
      });
      
      // Also fetch banking records
      const records = await fetchBankingRecords(shipId, parseInt(year));
      setBankingRecords(records);
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? `❌ Failed to fetch CB: ${err.message}` 
        : '❌ Failed to fetch compliance balance. Please try again.';
      
      setResultMessage({ 
        type: 'error', 
        text: errorMsg
      });
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId || !year || !bankAmount) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Please fill in Ship ID, Year, and Amount to bank surplus' 
      });
      return;
    }

    const amountValue = parseFloat(bankAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Amount must be a positive number greater than 0' 
      });
      return;
    }

    try {
      setResultMessage(null);
      const result = await bankSurplus({
        shipId,
        year: parseInt(year),
        amount: amountValue,
      });
      
      const successMsg = `✅ Banking Successful!\n` +
        `Ship: ${shipId} | Year: ${year}\n` +
        `Amount Banked: ${amountValue.toLocaleString()} gCO₂eq\n` +
        `CB Before: ${result.cbBefore?.toLocaleString() || 'N/A'} gCO₂eq → ` +
        `CB After: ${result.cbAfter?.toLocaleString() || 'N/A'} gCO₂eq\n` +
        `${result.message || 'Surplus saved for future use'}`;
      
      setResultMessage({ 
        type: 'success', 
        text: successMsg
      });
      
      // Refresh CB
      await handleFetchCB();
      setBankAmount('');
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? `❌ Banking Failed: ${err.message}` 
        : '❌ Failed to bank surplus. Please try again.';
      
      setResultMessage({ 
        type: 'error', 
        text: errorMsg
      });
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId || !year || !applyAmount) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Please fill in Ship ID, Year, and Amount to apply banked surplus' 
      });
      return;
    }

    const amountValue = parseFloat(applyAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Amount must be a positive number greater than 0' 
      });
      return;
    }

    try {
      setResultMessage(null);
      const result = await applyBanked({
        shipId,
        year: parseInt(year),
        amount: amountValue,
      });
      
      const successMsg = `✅ Application Successful!\n` +
        `Ship: ${shipId} | Year: ${year}\n` +
        `Amount Applied: ${amountValue.toLocaleString()} gCO₂eq\n` +
        `CB Before: ${result.cbBefore?.toLocaleString() || 'N/A'} gCO₂eq → ` +
        `CB After: ${result.cbAfter?.toLocaleString() || 'N/A'} gCO₂eq\n` +
        `${result.message || 'Banked surplus used to offset deficit'}`;
      
      setResultMessage({ 
        type: 'success', 
        text: successMsg
      });
      
      // Refresh CB
      await handleFetchCB();
      setApplyAmount('');
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? `❌ Application Failed: ${err.message}` 
        : '❌ Failed to apply banked surplus. Please try again.';
      
      setResultMessage({ 
        type: 'error', 
        text: errorMsg
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
            Banking allows ships with positive Compliance Balance (surplus) to save it for future years 
            or apply it to offset deficits. This implements FuelEU Maritime Regulation Article 20.
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-1">💡 Available Ship IDs:</p>
            <p className="text-xs text-blue-700">
              R001, R002, R003 (year 2024) | R004, R005 (year 2025)
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Note: If CB shows as 0, it means CB hasn't been computed yet or the ship is perfectly compliant.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ship ID
            </label>
            <input
              type="text"
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              placeholder="e.g., SHIP001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleFetchCB} loading={loading} className="w-full">
              Fetch Compliance Balance
            </Button>
          </div>
        </div>

        {/* Result Message */}
        {resultMessage && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              resultMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <p className="text-sm font-medium whitespace-pre-line">{resultMessage.text}</p>
          </div>
        )}

        {/* CB Display */}
        {cbData && (
          <div className="mb-6">
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">CB Before</div>
                  <div className={`text-2xl font-bold ${cbData.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cbData.cbBefore?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Applied</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {cbData.applied?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">CB After</div>
                  <div className={`text-2xl font-bold ${cbData.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cbData.cbAfter?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                {hasSurplus ? (
                  <Badge variant="success">Surplus Available</Badge>
                ) : hasDeficit ? (
                  <Badge variant="danger">Deficit</Badge>
                ) : (
                  <Badge variant="default">Neutral</Badge>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Banking Records */}
        {bankingRecords.length > 0 && (
          <Card title="Banking History">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ship ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankingRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.shipId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(record.amountGco2eq.toString()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Banking Actions */}
        {cbData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Surplus */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              {!hasSurplus && cbData && cbData.cbBefore !== undefined && cbData.cbBefore !== null && (
                <p className="text-xs text-red-500 mt-2">
                  {cbData.cbBefore === 0 
                    ? '⚠️ CB is exactly 0 - ship is compliant, no banking needed'
                    : `❌ Banking disabled: CB must be > 0 (current: ${cbData.cbBefore.toFixed(2)})`
                  }
                </p>
              )}
            </Card>

            {/* Apply Banked */}
            <Card title="Apply Banked Surplus">
              <p className="text-sm text-gray-600 mb-4">
                Use previously banked surplus to offset deficit (requires CB ≤ 0)
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (gCO₂eq)
                </label>
                <input
                  type="number"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={!hasDeficit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                onClick={handleApplyBanked}
                loading={loading}
                disabled={!hasDeficit}
                variant="primary"
                className="w-full"
              >
                Apply Banked
              </Button>
              {!hasDeficit && cbData && cbData.cbBefore !== undefined && cbData.cbBefore !== null && (
                <p className="text-xs text-red-500 mt-2">
                  {cbData.cbBefore === 0 
                    ? '⚠️ CB is exactly 0 - ship is compliant, no deficit to cover'
                    : `❌ Apply disabled: CB must be < 0 (current: ${cbData.cbBefore.toFixed(2)})`
                  }
                </p>
              )}
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};
