import React, { useRef, useState } from 'react';
import apiService from '../services/apiService';
import { ConversionResponse, ApiError } from '../types';
import '../styles/components.css';

interface CsvUploaderProps {
  onConversion: (data: ConversionResponse) => void;
  onPreview: (data: ConversionResponse) => void;
  onReset?: () => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onConversion, onPreview, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setMessage(null);
      return;
    }

    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setMessage({ type: 'error', text: 'Please select a valid CSV file' });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setMessage({ type: 'info', text: `Selected: ${file.name}` });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.convertCsvToJson(selectedFile);
      setMessage({
        type: 'success',
        text: `Successfully converted ${response.convertedRecords} records`,
      });
      onConversion(response);
    } catch (error) {
      const apiError = error as ApiError;
      setMessage({ type: 'error', text: apiError.message || 'Conversion failed' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.previewCsvConversion(selectedFile);
      setMessage({
        type: 'success',
        text: `Preview: ${response.previewRecords} records shown (${response.totalRowsInFile} total)`,
      });
      onPreview(response);
    } catch (error) {
      const apiError = error as ApiError;
      setMessage({ type: 'error', text: apiError.message || 'Preview failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="card upload-section">
      <h2>📤 CSV Uploader</h2>

      <div className="file-input-wrapper">
        <label
          className={`file-input-label ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
            <div>
              {selectedFile ? `${selectedFile.name}` : 'Drag and drop or click to select CSV'}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
          />
        </label>
      </div>

      {message && (
        <div className={`status-message status-${message.type}`}>
          <span>
            {message.type === 'success' && '✓'}
            {message.type === 'error' && '✗'}
            {message.type === 'info' && 'ℹ'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      <div className="button-group">
        <button
          className="button button-primary"
          onClick={handleConvert}
          disabled={!selectedFile || loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Converting...
            </>
          ) : (
            <>✨ Convert to JSON</>
          )}
        </button>
        <button
          className="button button-secondary"
          onClick={handlePreview}
          disabled={!selectedFile || loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Previewing...
            </>
          ) : (
            <>👁️ Preview</>
          )}
        </button>
        <button
          className="button button-secondary"
          onClick={handleReset}
          disabled={!selectedFile || loading}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

export default CsvUploader;
