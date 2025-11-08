import { useState } from 'react';
import { RoutesTab } from './adapters/ui/components/tabs/RoutesTab';
import { CompareTab } from './adapters/ui/components/tabs/CompareTab';
import { BankingTab } from './adapters/ui/components/tabs/BankingTab';
import { PoolingTab } from './adapters/ui/components/tabs/PoolingTab';

type TabType = 'routes' | 'compare' | 'banking' | 'pooling';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('routes');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'routes', label: 'Routes' },
    { id: 'compare', label: 'Compare' },
    { id: 'banking', label: 'Banking' },
    { id: 'pooling', label: 'Pooling' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                FuelEU Maritime Compliance Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Regulation (EU) 2023/1805 - Compliance Management System
              </p>
            </div>
          
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'routes' && <RoutesTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'banking' && <BankingTab />}
        {activeTab === 'pooling' && <PoolingTab />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            FuelEU Maritime Compliance Dashboard © {new Date().getFullYear()}
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Implementing Regulation (EU) 2023/1805 - Articles 20 & 21
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
