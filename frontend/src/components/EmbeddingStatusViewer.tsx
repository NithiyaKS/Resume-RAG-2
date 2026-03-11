import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { Logger } from '../utils/logger';
import '../styles/components.css';

interface StatusData {
  totalResumes: number;
  embeddedCount: number;
  pendingCount: number;
  failedCount: number;
  completionPercentage: string;
  recentResumes: Array<{
    id: string;
    name: string;
    email: string;
    embeddingStatus: 'pending' | 'completed' | 'failed';
    createdAt: string;
  }>;
}

export const EmbeddingStatusViewer: React.FC = () => {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getEmbeddingStatus();
      setStatusData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'failed':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'pending':
        return '⏳';
      default:
        return '?';
    }
  };

  if (loading && !statusData) {
    return (
      <div className="card">
        <h2>📊 Embedding Status Monitor</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '15px', color: '#666' }}>
            Loading status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>📊 Embedding Status Monitor</h2>
        <div className="status-message status-error">
          <span>✗</span>
          <span>{error}</span>
        </div>
        <button
          className="button button-secondary"
          onClick={fetchStatus}
          style={{ marginTop: '10px' }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📊 Embedding Status Monitor</h2>

      {statusData && (
        <>
          {/* Statistics Grid */}
          <div className="json-stats">
            <div className="stat-item">
              <div className="stat-label">Total Resumes</div>
              <div className="stat-value">{statusData.totalResumes}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Embedded ✓</div>
              <div className="stat-value" style={{ color: '#28a745' }}>
                {statusData.embeddedCount}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Pending ⏳</div>
              <div className="stat-value" style={{ color: '#ffc107' }}>
                {statusData.pendingCount}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Failed ✗</div>
              <div className="stat-value" style={{ color: '#dc3545' }}>
                {statusData.failedCount}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontWeight: '600', color: '#333' }}>
                Embedding Progress
              </span>
              <span style={{ color: '#666' }}>
                {statusData.completionPercentage}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '24px',
                background: '#f0f0f0',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${parseFloat(statusData.completionPercentage)}%`,
                  background: `linear-gradient(90deg, #667eea 0%, #764ba2 100%)`,
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {parseFloat(statusData.completionPercentage) > 10 &&
                  `${statusData.completionPercentage}%`}
              </div>
            </div>
          </div>

          {/* Recent Records Table */}
          {statusData.recentResumes.length > 0 && (
            <div style={{ marginTop: '25px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>
                📝 Recent Records:
              </h3>
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                        Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                        Email
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#333' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#333' }}>
                        Dimension
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusData.recentResumes.map((resume) => (
                      <tr key={resume.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', color: '#333' }}>
                          <strong>{resume.name}</strong>
                        </td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '0.9rem' }}>
                          {resume.email}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            color: getStatusColor(resume.embeddingStatus),
                            fontWeight: '600',
                          }}
                        >
                          <span style={{ marginRight: '5px' }}>
                            {getStatusIcon(resume.embeddingStatus)}
                          </span>
                          {resume.embeddingStatus.charAt(0).toUpperCase() +
                            resume.embeddingStatus.slice(1)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#667eea' }}>
                          {resume.embeddingStatus === 'completed'
                            ? '1024-dim'
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            className="button button-secondary"
            onClick={fetchStatus}
            disabled={loading}
            style={{ marginTop: '15px', width: '100%' }}
          >
            🔄 Refresh Status
          </button>
        </>
      )}
    </div>
  );
};

export default EmbeddingStatusViewer;
