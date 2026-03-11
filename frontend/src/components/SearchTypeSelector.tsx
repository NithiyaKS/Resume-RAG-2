import React from 'react';
import '../styles/SearchTypeSelector.css';

interface SearchTypeSelectorProps {
  selectedType: 'bm25' | 'vector' | 'hybrid' | 'rerank';
  onTypeChange: (type: 'bm25' | 'vector' | 'hybrid' | 'rerank') => void;
}

const searchTypes = [
  {
    id: 'bm25',
    label: 'BM25',
    icon: '📄',
    description: 'Fast keyword search',
    badge: 'FAST',
  },
  {
    id: 'vector',
    label: 'Vector',
    icon: '🧠',
    description: 'Semantic search',
    badge: 'SMART',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    icon: '⚡',
    description: 'Best of both worlds',
    badge: 'RECOMMENDED',
  },
  {
    id: 'rerank',
    label: 'Re-Rank',
    icon: '📊',
    description: 'AI-powered ranking',
    badge: 'ADVANCED',
  },
];

const SearchTypeSelector: React.FC<SearchTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  return (
    <div className="search-type-selector-wrapper">
      <label className="search-method-label">Search Method</label>
      <div className="search-type-selector">
        {searchTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            className={`search-method-card ${selectedType === type.id ? 'active' : ''}`}
            onClick={() => onTypeChange(type.id as any)}
          >
            <input
              type="radio"
              name="search-type"
              value={type.id}
              checked={selectedType === type.id}
              onChange={() => onTypeChange(type.id as any)}
              className="method-radio"
              style={{ display: 'none' }}
            />
            <div className="method-badge">{type.badge}</div>
            <span className="method-icon">{type.icon}</span>
            <h4 className="method-label">{type.label}</h4>
            <p className="method-description">{type.description}</p>
            <div className="method-selector">
              <div className={`selector-dot ${selectedType === type.id ? 'selected' : ''}`}></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchTypeSelector;
