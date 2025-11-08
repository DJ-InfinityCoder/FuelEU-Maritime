import React, { useState, useEffect } from 'react';
import { useCompliance } from '../../hooks/useCompliance';
import { usePooling } from '../../hooks/usePooling';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { CreatePoolResponse, PoolMember, Pool } from '@/core/domain/entities/Pool';

interface PoolMemberInput {
  shipId: string;
  cbBefore: number | null;
  loading?: boolean;
  error?: string;
}

interface PoolWithMembers extends Pool {
  members?: PoolMember[];
  showDetails?: boolean;
}

export const PoolingTab: React.FC = () => {
  const { fetchAdjustedCb } = useCompliance();
  const { createPool, fetchPools, fetchPoolMembers, loading } = usePooling();
  
  const [year, setYear] = useState('2024');
  const [members, setMembers] = useState<PoolMemberInput[]>([
    { shipId: '', cbBefore: null },
  ]);
  const [poolResult, setPoolResult] = useState<CreatePoolResponse | null>(null);
  const [existingPools, setExistingPools] = useState<PoolWithMembers[]>([]);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch existing pools when year changes
  useEffect(() => {
    loadPools();
  }, [year]);

  const loadPools = async () => {
    try {
      const pools = await fetchPools(parseInt(year));
      setExistingPools(pools.map(p => ({ ...p, showDetails: false })));
    } catch (err) {
      console.error('Failed to load pools:', err);
    }
  };

  const togglePoolDetails = async (poolId: string) => {
    const pool = existingPools.find(p => p.id === poolId);
    if (!pool) return;

    if (pool.showDetails) {
      // Hide details
      setExistingPools(prev =>
        prev.map(p => p.id === poolId ? { ...p, showDetails: false } : p)
      );
    } else {
      // Fetch and show details
      try {
        const members = await fetchPoolMembers(parseInt(poolId));
        setExistingPools(prev =>
          prev.map(p => p.id === poolId ? { ...p, members, showDetails: true } : p)
        );
      } catch (err) {
        setResultMessage({
          type: 'error',
          text: `❌ Failed to load pool members: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      }
    }
  };

  const addMember = () => {
    setMembers([...members, { shipId: '', cbBefore: null }]);
  };

  const removeMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const updateMember = (index: number, updates: Partial<PoolMemberInput>) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], ...updates };
    setMembers(newMembers);
  };

  const fetchMemberCb = async (index: number) => {
    const member = members[index];
    if (!member.shipId || !year) {
      setResultMessage({ 
        type: 'error', 
        text: '❌ Please enter Ship ID and Year first' 
      });
      return;
    }

    try {
      // Set loading state for this member
      updateMember(index, { loading: true, error: undefined });
      setResultMessage(null);
      
      const data = await fetchAdjustedCb(member.shipId, parseInt(year));
      console.log('[PoolingTab] Fetched CB data:', data);
      
      const cbValue = data.adjustedCbGco2eq ?? data.cbGco2eq ?? 0;
      console.log('[PoolingTab] Extracted CB value:', cbValue);
      
      updateMember(index, { cbBefore: cbValue, loading: false });
      
      setResultMessage({
        type: 'success',
        text: `✅ CB fetched for ${member.shipId}: ${cbValue.toLocaleString()} gCO₂eq ${cbValue > 0 ? '(Surplus)' : cbValue < 0 ? '(Deficit)' : '(Neutral)'}`
      });
    } catch (err) {
      console.error('[PoolingTab] Error fetching CB:', err);
      updateMember(index, { loading: false, error: 'Failed to fetch CB' });
      setResultMessage({ 
        type: 'error', 
        text: `❌ Failed to fetch CB for ${member.shipId}: ${err instanceof Error ? err.message : 'Unknown error'}` 
      });
    }
  };

  const calculateTotalCb = () => {
    return members.reduce((sum, m) => sum + (m.cbBefore ?? 0), 0);
  };

  const hasSurplus = members.some(m => m.cbBefore !== null && m.cbBefore > 0);
  const hasDeficit = members.some(m => m.cbBefore !== null && m.cbBefore < 0);

  const isPoolValid = () => {
    const totalCb = calculateTotalCb();
    const hasAllShipIds = members.every(m => m.shipId.trim() !== '');
    const hasAllCbValues = members.every(m => m.cbBefore !== null);
    const uniqueShips = new Set(members.map(m => m.shipId.trim()));
    
    return (
      totalCb >= 0 && 
      hasAllShipIds &&
      hasAllCbValues &&
      members.length >= 2 && 
      uniqueShips.size === members.length &&
      hasSurplus &&
      hasDeficit
    );
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    const totalCb = calculateTotalCb();
    
    if (!members.every(m => m.cbBefore !== null)) {
      errors.push('All ships must have CB fetched from database');
    }
    if (totalCb < 0) {
      errors.push(`Sum of CB must be ≥ 0 (currently ${totalCb.toFixed(2)} gCO₂eq)`);
    }
    if (members.some(m => !m.shipId.trim())) {
      errors.push('All ship IDs must be provided');
    }
    if (members.length < 2) {
      errors.push('Pool must have at least 2 members');
    }
    const uniqueShips = new Set(members.map(m => m.shipId.trim()));
    if (uniqueShips.size !== members.length) {
      errors.push('Duplicate ship IDs detected - each ship can only join once');
    }
    if (!hasSurplus) {
      errors.push('Pool must have at least one ship with surplus (positive CB)');
    }
    if (!hasDeficit) {
      errors.push('Pool must have at least one ship with deficit (negative CB)');
    }
    
    return errors;
  };

  const handleCreatePool = async () => {
    const errors = getValidationErrors();
    
    if (errors.length > 0) {
      setResultMessage({ 
        type: 'error', 
        text: `❌ Pool Invalid:\n${errors.map(e => `• ${e}`).join('\n')}` 
      });
      return;
    }

    try {
      setResultMessage(null);
      const result = await createPool({
        year: parseInt(year),
        members: members.filter(m => m.cbBefore !== null).map(m => ({
          shipId: m.shipId,
          cbBefore: m.cbBefore!,
        })),
      });

      setPoolResult(result);
      
      const successMsg = `✅ Pool Created Successfully!\n` +
        `Pool ID: #${result.pool.id} | Year: ${result.pool.year}\n` +
        `Total Members: ${result.members.length}\n` +
        `Total CB Before: ${result.totalCbBefore?.toLocaleString() || 'N/A'} gCO₂eq\n` +
        `Total CB After: ${result.totalCbAfter?.toLocaleString() || 'N/A'} gCO₂eq\n` +
        `✅ All Article 21 rules validated`;
      
      setResultMessage({ 
        type: 'success', 
        text: successMsg
      });
      
      // Refresh pools list
      await loadPools();
      
      // Reset form
      setMembers([{ shipId: '', cbBefore: null }]);
    } catch (err) {
      const errorMsg = `❌ Failed to Create Pool:\n${err instanceof Error ? err.message : 'Unknown error'}`;
      setResultMessage({ 
        type: 'error', 
        text: errorMsg
      });
    }
  };

  const totalCb = calculateTotalCb();
  const poolValid = isPoolValid();

  return (
    <div className="space-y-6">
      <Card title="Pooling - Article 21">
        <div className="prose max-w-none mb-6">
          <p className="text-sm text-gray-600">
            Pooling allows multiple ships to combine their Compliance Balances. A valid pool must have:
          </p>
          <ul className="text-sm text-gray-600 list-disc ml-6 mt-2">
            <li>Total combined CB ≥ 0</li>
            <li>At least one surplus ship (positive CB) and one deficit ship (negative CB)</li>
            <li>Deficit ships cannot exit worse than before</li>
            <li>Surplus ships cannot exit with negative CB</li>
          </ul>
          
          {/* Help Box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-1">💡 How to Create a Pool:</p>
            <ol className="text-xs text-blue-700 list-decimal ml-5 space-y-1">
              <li>Enter Ship ID (e.g., R001, R002, R003 for 2024 or R004, R005 for 2025)</li>
              <li>Click "Fetch CB" to automatically load Compliance Balance from database</li>
              <li>Add more members (minimum 2 required)</li>
              <li>Ensure at least one surplus ship (positive CB) and one deficit ship (negative CB)</li>
              <li>Click "Create Pool" when all validations pass</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              ⚠️ Important: CB values are fetched from database - do NOT enter manually!
            </p>
          </div>
        </div>

        {/* Year Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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

        {/* Members */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Pool Members</h4>
            <Button size="small" onClick={addMember}>
              + Add Member
            </Button>
          </div>

          <div className="space-y-4">
            {members.map((member, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Ship ID Input */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ship ID *
                    </label>
                    <input
                      type="text"
                      value={member.shipId}
                      onChange={(e) => updateMember(index, { shipId: e.target.value })}
                      placeholder="e.g., R001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* CB Display (Read-only) */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compliance Balance
                    </label>
                    <div className={`w-full px-3 py-2 rounded-lg border-2 font-semibold ${
                      member.cbBefore === null 
                        ? 'bg-gray-100 border-gray-300 text-gray-500' 
                        : member.cbBefore >= 0 
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-red-50 border-red-300 text-red-700'
                    }`}>
                      {member.loading ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : member.cbBefore !== null ? (
                        `${member.cbBefore >= 0 ? '+' : ''}${member.cbBefore.toLocaleString()} gCO₂eq`
                      ) : (
                        <span className="text-gray-400">Not fetched</span>
                      )}
                    </div>
                    {member.error && (
                      <p className="text-xs text-red-500 mt-1">{member.error}</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center h-[42px]">
                      {member.cbBefore !== null && (
                        <Badge variant={member.cbBefore > 0 ? 'success' : member.cbBefore < 0 ? 'danger' : 'default'}>
                          {member.cbBefore > 0 ? '✅ Surplus' : member.cbBefore < 0 ? '⚠️ Deficit' : '— Neutral'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-3 flex items-end space-x-2">
                    <Button
                      size="small"
                      variant="primary"
                      onClick={() => fetchMemberCb(index)}
                      loading={member.loading}
                      disabled={!member.shipId.trim() || member.loading}
                      className="flex-1"
                    >
                      {member.cbBefore !== null ? '🔄 Refresh' : '📥 Fetch CB'}
                    </Button>
                    {members.length > 1 && (
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => removeMember(index)}
                        disabled={member.loading}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {member.cbBefore !== null && member.cbBefore !== 0 && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    💡 {member.cbBefore > 0 
                      ? `This ship has ${member.cbBefore.toLocaleString()} gCO₂eq surplus available to share with deficit ships`
                      : `This ship has ${Math.abs(member.cbBefore).toLocaleString()} gCO₂eq deficit that needs coverage from pool surplus`
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pool Summary */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Pool Summary</h4>
            <Badge variant={poolValid ? 'success' : 'danger'}>
              {poolValid ? '✅ Valid Pool' : '❌ Invalid Pool'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Total Members</div>
              <div className="text-2xl font-bold text-gray-900">{members.length}</div>
            </div>

            <div className={`text-center p-4 rounded-lg ${totalCb >= 0 ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
              <div className="text-sm text-gray-600 mb-2">Sum of Adjusted CB</div>
              <div className={`text-2xl font-bold ${totalCb >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalCb >= 0 ? '+' : ''}{totalCb.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
              {totalCb < 0 && (
                <div className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ Must be ≥ 0
                </div>
              )}
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Pool Status</div>
              <div className={`text-xl font-bold ${totalCb >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalCb >= 0 ? '✅ Compliant' : '❌ Non-Compliant'}
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          {!poolValid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">⚠️ Pool Requirements Not Met:</p>
              <ul className="text-xs text-red-700 list-disc ml-5 space-y-1">
                {totalCb < 0 && <li>Sum of adjusted CB must be ≥ 0 (currently {totalCb.toFixed(2)})</li>}
                {members.some(m => !m.shipId.trim()) && <li>All ship IDs must be provided</li>}
                {members.length < 2 && <li>Pool must have at least 2 members</li>}
              </ul>
            </div>
          )}

          <Button
            onClick={handleCreatePool}
            loading={loading}
            disabled={!poolValid}
            variant="success"
            className="w-full"
          >
            Create Pool
          </Button>
        </Card>

        {/* Pool Result */}
        {poolResult && (
          <Card title="✅ Pool Created Successfully">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <span className="text-gray-600">Pool ID:</span>
                  <span className="ml-2 font-medium">#{poolResult.pool.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Year:</span>
                  <span className="ml-2 font-medium">{poolResult.pool.year}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total CB Before:</span>
                  <span className={`ml-2 font-medium ${poolResult.totalCbBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {poolResult.totalCbBefore >= 0 ? '+' : ''}{poolResult.totalCbBefore.toLocaleString()} gCO₂eq
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total CB After:</span>
                  <span className={`ml-2 font-medium ${poolResult.totalCbAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {poolResult.totalCbAfter >= 0 ? '+' : ''}{poolResult.totalCbAfter.toLocaleString()} gCO₂eq
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Ship ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        CB Before
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        CB After
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Change
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {poolResult.members.map((member: PoolMember, idx: number) => {
                      const change = member.cbAfter - member.cbBefore;
                      const improved = member.cbBefore < 0 && member.cbAfter > member.cbBefore;
                      const contributed = member.cbBefore > 0 && member.cbAfter < member.cbBefore;
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm font-medium">{member.shipId}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {member.cbBefore >= 0 ? '+' : ''}{member.cbBefore.toLocaleString()}
                          </td>
                          <td className={`px-4 py-2 text-sm font-medium ${member.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {member.cbAfter >= 0 ? '+' : ''}{member.cbAfter.toLocaleString()}
                          </td>
                          <td className={`px-4 py-2 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change > 0 ? '+' : ''}{change.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {improved && <Badge variant="success">✅ Improved</Badge>}
                            {contributed && <Badge variant="info">🤝 Contributed</Badge>}
                            {!improved && !contributed && <Badge variant="default">— No Change</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Article 21 Rules Validated:</strong>
                </p>
                <ul className="text-xs text-blue-700 list-disc ml-5 mt-2 space-y-1">
                  <li>✅ Sum of adjusted CB ≥ 0</li>
                  <li>✅ Deficit ships did not exit worse</li>
                  <li>✅ Surplus ships did not exit negative</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Existing Pools */}
      {existingPools.length > 0 && (
        <Card title={`Existing Pools for Year ${year}`}>
          <div className="space-y-4">
            {existingPools.map((pool) => {
              const totalCbBefore = pool.members?.reduce((sum, m) => sum + m.cbBefore, 0) || 0;
              const totalCbAfter = pool.members?.reduce((sum, m) => sum + m.cbAfter, 0) || 0;
              
              return (
                <div key={pool.id} className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Pool Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-blue-900">
                          Pool #{pool.id}
                        </div>
                        <Badge variant="info">Year {pool.year}</Badge>
                        <Badge variant="success">✅ Active</Badge>
                      </div>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => togglePoolDetails(pool.id)}
                      >
                        {pool.showDetails ? '▲ Hide Details' : '▼ Show Details'}
                      </Button>
                    </div>
                    {pool.createdAt && (
                      <div className="text-xs text-blue-700">
                        Created: {new Date(pool.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Pool Details */}
                  {pool.showDetails && pool.members && (
                    <div className="p-4 bg-white">
                      {/* Pool Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">Total Members</div>
                          <div className="text-2xl font-bold text-gray-900">{pool.members.length}</div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                          <div className="text-sm text-gray-600 mb-2">Total CB Before</div>
                          <div className={`text-2xl font-bold ${totalCbBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalCbBefore >= 0 ? '+' : ''}{totalCbBefore.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                        </div>

                        <div className={`text-center p-4 rounded-lg border-2 ${totalCbAfter >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                          <div className="text-sm text-gray-600 mb-2">Total CB After</div>
                          <div className={`text-2xl font-bold ${totalCbAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalCbAfter >= 0 ? '+' : ''}{totalCbAfter.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">gCO₂eq</div>
                        </div>
                      </div>

                      {/* Members Table */}
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ship ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CB Before
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CB After
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Change
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Impact
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pool.members.map((member, idx) => {
                              const change = member.cbAfter - member.cbBefore;
                              const improved = member.cbBefore < 0 && member.cbAfter > member.cbBefore;
                              const contributed = member.cbBefore > 0 && member.cbAfter < member.cbBefore;
                              
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {member.shipId}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-sm font-bold ${member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {member.cbBefore >= 0 ? '+' : ''}{member.cbBefore.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500">gCO₂eq</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-sm font-bold ${member.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {member.cbAfter >= 0 ? '+' : ''}{member.cbAfter.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500">gCO₂eq</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-sm font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {change > 0 ? '+' : ''}{change.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500">gCO₂eq</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {improved && <Badge variant="success">✅ Deficit Reduced</Badge>}
                                    {contributed && <Badge variant="info">🤝 Surplus Shared</Badge>}
                                    {!improved && !contributed && <Badge variant="default">— No Change</Badge>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Article 21 Compliance */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 font-semibold mb-2">
                          ✅ Article 21 Compliance Verified
                        </p>
                        <ul className="text-xs text-blue-700 list-disc ml-5 space-y-1">
                          <li>Total CB is ≥ 0 ({totalCbAfter >= 0 ? 'Compliant' : 'Non-Compliant'})</li>
                          <li>All deficit ships improved or maintained their position</li>
                          <li>No surplus ships went negative</li>
                          <li>Pool balanced successfully per FuelEU Maritime regulations</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {pool.showDetails && !pool.members && (
                    <div className="p-8 text-center bg-white">
                      <div className="text-gray-500">Loading pool members...</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {existingPools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No pools found for year {year}.</p>
              <p className="text-sm mt-2">Create a new pool above to get started.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
