import React, { useState } from 'react';
import SearchTypeSelector from './SearchTypeSelector';
import HybridWeightSlider from './HybridWeightSlider';
import SearchResultsDisplay from './SearchResultsDisplay';
import '../styles/SearchPanel.css';

interface SearchResult {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  skills?: string;
  email?: string;
  score?: number;
  matchScore?: number;
  snippet?: string;
  text?: string;
}

const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'bm25' | 'vector' | 'hybrid' | 'rerank'>(
    'hybrid'
  );
  const [bm25Weight, setBm25Weight] = useState(50);
  const [vectorWeight, setVectorWeight] = useState(50);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    // For rerank, we need existing results first
    if (searchType === 'rerank') {
      if (searchResults.length === 0) {
        setSearchError('Please perform a search first before using re-ranking');
        return;
      }
      
      // Re-rank existing results
      setIsSearching(true);
      setSearchError(null);

      try {
        const body = {
          query: query.trim(),
          candidates: searchResults.map(result => ({
            _id: result._id,
            name: result.name,
            role: result.role,
            company: result.company,
            skills: result.skills,
            email: result.email,
            score: result.score || result.matchScore || 0,
          })),
          topK: 10,
          maxTokens: 2000,
          temperature: 0.5,
          detailed: true,
        };

        const response = await fetch('http://localhost:5000/v1/search/rerank', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Re-ranking failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle re-rank response
        let results: SearchResult[] = [];
        if (data.data) {
          if (Array.isArray(data.data)) {
            results = data.data;
          }
        }
        
        setSearchResults(results);

        if (results.length === 0) {
          setSearchError('No re-ranked results found');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Re-ranking failed';
        setSearchError(message);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // For other search types, perform normal search
    setIsSearching(true);
    setSearchError(null);

    try {
      let endpoint = '';
      let body: any = { query };

      if (searchType === 'hybrid') {
        endpoint = '/v1/search/hybrid';
        body.weights = {
          bm25: bm25Weight / 100,
          vector: vectorWeight / 100,
        };
      } else {
        endpoint = `/v1/search/${searchType}`;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different API response formats
      let results: SearchResult[] = [];
      if (data.data) {
        // If data.data has a 'results' property, extract it
        if (Array.isArray(data.data.results)) {
          results = data.data.results;
        } else if (Array.isArray(data.data)) {
          // If data.data is already an array
          results = data.data;
        }
      }
      
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError('No results found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setSearchError(message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setSearchError(null);
  };

  const handleWeightChange = (bm25: number, vector: number) => {
    setBm25Weight(bm25);
    setVectorWeight(vector);
  };

  const handleSummarize = (result: SearchResult) => {
    console.log('Summarize:', result);
    // This will be connected to the summarization API
    alert(`Summarization for ${result.name} - Feature coming soon`);
  };

  return (
    <div className="search-panel">
      {/* Search Input Section */}
      <div className="search-input-section">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter search query (e.g., 'Senior Python developer with 5+ years experience')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="btn-search" disabled={isSearching}>
            {isSearching ? '⏳ Searching...' : '🔍 Search'}
          </button>
          {query && (
            <button onClick={handleClear} className="btn-clear">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Type Selector */}
      <div className="search-options-section">
        <SearchTypeSelector
          selectedType={searchType}
          onTypeChange={setSearchType}
        />
      </div>

      {/* Hybrid Weight Slider (Conditional) */}
      {searchType === 'hybrid' && (
        <div className="search-options-section">
          <HybridWeightSlider
            bm25Weight={bm25Weight}
            vectorWeight={vectorWeight}
            onChange={handleWeightChange}
          />
        </div>
      )}

      {/* Search Results Section */}
      <div className="search-results-section">
        <SearchResultsDisplay
          results={searchResults}
          loading={isSearching}
          error={searchError}
          onSummarize={handleSummarize}
        />
      </div>
    </div>
  );
};

export default SearchPanel;
