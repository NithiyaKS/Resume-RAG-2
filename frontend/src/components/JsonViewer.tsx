import React, { useState } from 'react';
import { Resume, ConversionResponse } from '../types';
import '../styles/components.css';

interface JsonViewerProps {
  data: ConversionResponse | null;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!data) {
    return (
      <div className="card">
        <h2>📊 JSON Preview</h2>
        <div className="status-message status-info">
          <span>ℹ</span>
          <span>Upload and convert a CSV file to see the JSON preview</span>
        </div>
      </div>
    );
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const downloadJson = () => {
    const jsonString = JSON.stringify(data.data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copySingleRecord = (index: number) => {
    const recordJson = JSON.stringify(data.data[index], null, 2);
    navigator.clipboard.writeText(recordJson);
    alert(`Record ${index + 1} copied to clipboard!`);
  };

  return (
    <div className="card json-viewer">
      <h2>📊 JSON Preview ({data.previewRecords || data.convertedRecords} Records)</h2>

      <div className="json-stats">
        <div className="stat-item">
          <div className="stat-label">Total Rows in CSV</div>
          <div className="stat-value">{data.totalRowsInFile || data.totalRows}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Converted Records</div>
          <div className="stat-value">{data.previewRecords || data.convertedRecords}</div>
        </div>
      </div>

      {data.convertedRecords && data.convertedRecords > 0 && (
        <>
          <button className="button button-primary" onClick={downloadJson}>
            ⬇️ Download JSON
          </button>

          <div className="json-content">
            {data.data.map((resume: Resume, index: number) => (
              <div key={index} className="json-item">
                <div
                  className="json-item-title"
                  onClick={() => toggleExpand(index)}
                  style={{ cursor: 'pointer' }}
                >
                  {expandedIndex === index ? '▼' : '▶'} Record {index + 1}: {resume.name}
                </div>

                {expandedIndex === index && (
                  <div style={{ marginTop: '10px' }}>
                    <div className="json-item-field">
                      <span className="json-field-label">Email:</span>
                      <span className="json-field-value">{resume.email}</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Phone:</span>
                      <span className="json-field-value">{resume.phone}</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Location:</span>
                      <span className="json-field-value">{resume.location}</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Company:</span>
                      <span className="json-field-value">{resume.company}</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Role:</span>
                      <span className="json-field-value">{resume.role}</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Education:</span>
                      <span className="json-field-value">{resume.education}</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Total Experience:</span>
                      <span className="json-field-value">{resume.totalExperience} years</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Relevant Experience:</span>
                      <span className="json-field-value">{resume.relevantExperience} years</span>
                    </div>
                    <div className="json-item-field">
                      <span className="json-field-label">Skills:</span>
                      <span className="json-field-value">
                        {resume.skills.slice(0, 3).join(', ')}
                        {resume.skills.length > 3 && ` +${resume.skills.length - 3}`}
                      </span>
                    </div>
                    <button
                      className="button button-secondary"
                      onClick={() => copySingleRecord(index)}
                      style={{ marginTop: '10px', width: '100%' }}
                    >
                      📋 Copy Record
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default JsonViewer;
