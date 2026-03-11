import React from 'react';
import '../styles/LeftNavigation.css';

interface LeftNavigationProps {
  activeTab: 'ingestion' | 'search';
  onTabChange: (tab: 'ingestion' | 'search') => void;
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="left-panel">
      <div className="panel-header">
        <h2>Resume RAG</h2>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'ingestion' ? 'active' : ''}`}
          onClick={() => onTabChange('ingestion')}
        >
          <span className="icon">📤</span>
          <span className="label">Data Ingestion</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onTabChange('search')}
        >
          <span className="icon">🔍</span>
          <span className="label">Search</span>
        </button>
      </nav>

      <div className="panel-footer">
        <p className="version">v1.0.0</p>
      </div>
    </div>
  );
};

export default LeftNavigation;
