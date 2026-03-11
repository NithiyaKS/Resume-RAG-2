import React, { useState } from 'react';
import { ConversionResponse } from '../types';
import CsvUploader from './CsvUploader';
import JsonViewer from './JsonViewer';
import EmbeddingComponent from './EmbeddingComponent';
import EmbeddingStatusViewer from './EmbeddingStatusViewer';
import '../styles/DataIngestionPanel.css';

const DataIngestionPanel: React.FC = () => {
  const [conversionData, setConversionData] = useState<ConversionResponse | null>(null);
  const [isJsonConverted, setIsJsonConverted] = useState(false);

  const handleConversion = (data: ConversionResponse) => {
    setConversionData(data);
    setIsJsonConverted(true);
  };

  const handlePreview = (data: ConversionResponse) => {
    setConversionData(data);
    setIsJsonConverted(true);
  };

  const handleReset = () => {
    setConversionData(null);
    setIsJsonConverted(false);
  };

  return (
    <div className="data-ingestion-panel">
      <div className="panel-title">
        <h2>📤 Data Ingestion</h2>
        <p>Convert CSV to JSON → Generate Embeddings → Search & Analyze</p>
      </div>

      {/* Step 1: CSV Upload & Conversion */}
      <div className="ingestion-section step-1">
        <div className="step-header">
          <span className="step-number">1</span>
          <h3>Upload & Convert CSV</h3>
        </div>
        <CsvUploader
          onConversion={handleConversion}
          onPreview={handlePreview}
          onReset={handleReset}
        />
      </div>

      {/* Step 2: CSV Preview & Statistics */}
      {conversionData && (
        <div className="ingestion-section step-2">
          <div className="step-header">
            <span className="step-number">2</span>
            <h3>Review JSON Data</h3>
          </div>
          <JsonViewer data={conversionData} />
        </div>
      )}

      {/* Step 3: Embedding Generation */}
      {isJsonConverted && conversionData && (
        <>
          <div className="ingestion-section step-3">
            <div className="step-header">
              <span className="step-number">3</span>
              <h3>Generate Embeddings</h3>
            </div>
            <EmbeddingComponent
              jsonRecords={conversionData.data}
              isEnabled={isJsonConverted}
              onReset={handleReset}
            />
          </div>

          {/* Embedding Status Monitor */}
          <div className="ingestion-section step-4">
            <div className="step-header">
              <span className="step-number">4</span>
              <h3>Embedding Status</h3>
            </div>
            <EmbeddingStatusViewer />
          </div>
        </>
      )}
    </div>
  );
};

export default DataIngestionPanel;
