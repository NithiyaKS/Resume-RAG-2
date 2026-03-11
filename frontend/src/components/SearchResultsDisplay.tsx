import React, { useState } from 'react';
import '../styles/SearchResultsDisplay.css';

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

interface SearchResultsDisplayProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  onSummarize?: (result: SearchResult) => void;
}

const ITEMS_PER_PAGE = 10;

const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  results,
  loading,
  error,
  onSummarize,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ensure results is always an array
  const resultsArray = Array.isArray(results) ? results : [];
  const totalPages = Math.ceil(resultsArray.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = resultsArray.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="results-display loading">
        <div className="spinner"></div>
        <p>Searching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-display error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (resultsArray.length === 0) {
    return (
      <div className="results-display empty">
        <span className="empty-icon">📭</span>
        <p>No results found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="results-display">
      <div className="results-header">
        <h3>Search Results</h3>
        <span className="result-count">
          {resultsArray.length} {resultsArray.length === 1 ? 'result' : 'results'} found
        </span>
      </div>

      <div className="results-table">
        <div className="table-header">
          <div className="col-rank">#</div>
          <div className="col-name">Name</div>
          <div className="col-role">Role</div>
          <div className="col-company">Company</div>
          <div className="col-score">Match Score</div>
          <div className="col-actions">Actions</div>
        </div>

        <div className="table-body">
          {paginatedResults.map((result, idx) => (
            <React.Fragment key={result._id}>
              <div className="table-row">
                <div className="col-rank">
                  <span className="rank-badge">{startIdx + idx + 1}</span>
                </div>
                <div className="col-name">{result.name}</div>
                <div className="col-role">{result.role || 'N/A'}</div>
                <div className="col-company">{result.company || 'N/A'}</div>
                <div className="col-score">
                  {result.matchScore !== undefined ? (
                    <span className="score-badge">
                      {(result.matchScore * 100).toFixed(0)}%
                    </span>
                  ) : result.score !== undefined ? (
                    <span className="score-badge">
                      {result.score.toFixed(2)}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="col-actions">
                  <button
                    className="btn-expand"
                    onClick={() =>
                      setExpandedId(
                        expandedId === result._id ? null : result._id
                      )
                    }
                    title={expandedId === result._id ? 'Hide details' : 'Show details'}
                  >
                    {expandedId === result._id ? '▼' : '▶'}
                  </button>
                  {onSummarize && (
                    <button
                      className="btn-summarize"
                      onClick={() => onSummarize(result)}
                      title="Summarize this result"
                    >
                      📝
                    </button>
                  )}
                </div>
              </div>

              {expandedId === result._id && (
                <div className="table-row-details">
                  <div className="details-content">
                    {result.skills && (
                      <div className="detail-field">
                        <span className="detail-label">Skills:</span>
                        <span className="detail-value">{result.skills}</span>
                      </div>
                    )}
                    {result.email && (
                      <div className="detail-field">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{result.email}</span>
                      </div>
                    )}
                    {result.snippet && (
                      <div className="detail-field">
                        <span className="detail-label">Snippet:</span>
                        <span className="detail-value snippet">
                          {result.snippet}
                        </span>
                      </div>
                    )}
                    {!result.skills &&
                      !result.email &&
                      !result.snippet && (
                      <p className="no-details">No additional details available</p>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-prev"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <div className="page-info">
            Page {currentPage} of {totalPages}
          </div>

          <button
            className="btn-next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResultsDisplay;
