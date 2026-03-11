import React, { useState } from 'react';
import apiService from '../services/apiService';
import { Resume, EmbeddingResult } from '../types';
import '../styles/components.css';

interface EmbeddingComponentProps {
  jsonRecords: Resume[];
  isEnabled: boolean;
  onEmbeddingComplete?: (results: EmbeddingResult[]) => void;
  onReset?: () => void;
}

export const EmbeddingComponent: React.FC<EmbeddingComponentProps> = ({
  jsonRecords,
  isEnabled,
  onEmbeddingComplete,
  onReset,
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [embeddingResult, setEmbeddingResult] = useState<{
    totalRecords: number;
    successCount: number;
    failureCount: number;
    results: EmbeddingResult[];
  } | null>(null);

  const handleGenerateEmbeddings = async () => {
    if (!jsonRecords || jsonRecords.length === 0) {
      alert('No records to embed. Convert CSV to JSON first.');
      return;
    }

    setLoading(true);
    setEmbeddingResult(null);

    try {
      console.log('Starting embedding process with records:', jsonRecords);

      const response = await apiService.storeAndEmbed(jsonRecords);

      console.log('Embedding response:', response);

      // Extract values from the response (which has a 'summary' object)
      const summary = response.summary || response;
      
      setEmbeddingResult({
        totalRecords: summary.totalRequested || summary.totalRecords || 0,
        successCount: summary.successful || summary.successCount || 0,
        failureCount: summary.failed || summary.failureCount || 0,
        results: response.results || [],
      });

      setShowModal(true);

      if (onEmbeddingComplete) {
        onEmbeddingComplete(response.results || []);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Embedding failed';
      console.error('Embedding error:', error);
      alert(`Embedding failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmbeddingResult(null);
    setShowModal(false);
    if (onReset) {
      onReset();
    }
  };

  if (!isEnabled) {
    return (
      <div className="card">
        <h2>✨ Generate Embeddings</h2>
        <div className="status-message status-info">
          <span>ℹ</span>
          <span>Convert CSV to JSON first to enable embedding generation</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>✨ Generate Embeddings</h2>

      <p style={{ color: '#666', marginBottom: '15px' }}>
        Convert {jsonRecords.length} records to 1024-dimensional vectors using
        Mistral AI
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          className="button button-primary"
          onClick={handleGenerateEmbeddings}
          disabled={loading || !jsonRecords || jsonRecords.length === 0}
          style={{ flex: 1 }}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Embedding in progress...
            </>
          ) : (
            <>🔮 Generate Embeddings</>
          )}
        </button>
        
        <button
          className="button button-secondary"
          onClick={handleReset}
          disabled={!embeddingResult || loading}
          style={{ minWidth: '120px' }}
        >
          🔄 Reset
        </button>
      </div>

      {loading && (
        <div className="status-message status-info">
          <span>⏳</span>
          <span>Embedding is in progress, please wait...</span>
        </div>
      )}

      {embeddingResult && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            📊 Embedding Results
          </h3>

          <div className="json-stats">
            <div className="stat-item">
              <div className="stat-label">Total Records</div>
              <div className="stat-value">{embeddingResult.totalRecords}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Successfully Embedded</div>
              <div className="stat-value" style={{ color: '#28a745' }}>
                {embeddingResult.successCount}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Failed</div>
              <div className="stat-value" style={{ color: '#dc3545' }}>
                {embeddingResult.failureCount}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Embedding Dimension</div>
              <div className="stat-value">1024</div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#333', marginBottom: '10px' }}>
              🎯 Embedding Field (Vector Index):
            </h4>
            <div style={{ paddingLeft: '15px' }}>
              <div
                style={{
                  padding: '12px 15px',
                  background: '#f0f0f0',
                  borderRadius: '6px',
                  borderLeft: '4px solid #667eea',
                }}
              >
                <strong>embedding</strong> - Combined vector from skills and text
                <br />
                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                  Dimensions: 1024 | Type: cosine similarity
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#333', marginBottom: '10px' }}>
              📋 Detailed Results:
            </h4>
            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            >
              {embeddingResult.results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    borderBottom:
                      index < embeddingResult.results.length - 1
                        ? '1px solid #f0f0f0'
                        : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>
                      {result.name || 'Unknown'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginTop: '3px',
                      }}
                    >
                      {result.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {result.status === 'completed' ? (
                      <>
                        <div
                          style={{
                            color: '#28a745',
                            fontWeight: '600',
                            marginBottom: '3px',
                          }}
                        >
                          ✓ {result.embeddingDimension}-dim
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          Completed
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ color: '#dc3545', fontWeight: '600' }}>
                          ✗ Failed
                        </div>
                        {result.error && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#dc3545',
                              marginTop: '3px',
                            }}
                          >
                            {result.error}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: '15px',
              padding: '12px',
              background: '#e8f5e9',
              border: '1px solid #4caf50',
              borderRadius: '6px',
              color: '#2e7d32',
            }}
          >
            💾 All embeddings stored in MongoDB Atlas with vector indexes
            configured
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showModal && embeddingResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h2 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
              ✅ Embedding Complete!
            </h2>

            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div
                  style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                    {embeddingResult.totalRecords}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Total Records
                  </div>
                </div>

                <div
                  style={{
                    padding: '15px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                    {embeddingResult.successCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '5px' }}>
                    Successfully Embedded
                  </div>
                </div>

                {embeddingResult.failureCount > 0 && (
                  <div
                    style={{
                      padding: '15px',
                      backgroundColor: '#ffebee',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                      {embeddingResult.failureCount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#c41c3b', marginTop: '5px' }}>
                      Failed
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: '15px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    1024
                  </div>
                  <div style={{ fontSize: '12px', color: '#1565c0', marginTop: '5px' }}>
                    Dimensions
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#333',
              }}
            >
              <strong>✨ Success Rate: </strong>
              {embeddingResult.totalRecords > 0
                ? ((embeddingResult.successCount / embeddingResult.totalRecords) * 100).toFixed(1)
                : 0}
              %
            </div>

            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              All embeddings have been stored in MongoDB Atlas with vector indexes configured for semantic search.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="button button-primary"
                onClick={() => setShowModal(false)}
                style={{ flex: 1 }}
              >
                ✓ Done
              </button>
              <button
                className="button button-secondary"
                onClick={handleReset}
                style={{ flex: 1 }}
              >
                🔄 Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddingComponent;
