import React, { useState } from 'react';
import LeftNavigation from './components/LeftNavigation';
import DataIngestionPanel from './components/DataIngestionPanel';
import SearchPanel from './components/SearchPanel';
import './styles/App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingestion' | 'search'>('ingestion');

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>� Resume AI Assistant</h1>
        <p>Intelligent Resume Search & Analysis Platform</p>
      </header>

      <div className="app-layout">
        {/* Left Navigation Panel */}
        <LeftNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-wrapper">
            {activeTab === 'ingestion' && <DataIngestionPanel />}
            {activeTab === 'search' && <SearchPanel />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
