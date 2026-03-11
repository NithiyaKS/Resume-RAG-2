import React from 'react';
import '../styles/HybridWeightSlider.css';

interface HybridWeightSliderProps {
  bm25Weight: number;
  vectorWeight: number;
  onChange: (bm25Weight: number, vectorWeight: number) => void;
}

const HybridWeightSlider: React.FC<HybridWeightSliderProps> = ({
  bm25Weight,
  vectorWeight,
  onChange,
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBm25 = parseInt(e.target.value);
    const newVector = 100 - newBm25;
    onChange(newBm25, newVector);
  };

  const handleReset = () => {
    onChange(50, 50);
  };

  return (
    <div className="hybrid-weight-slider">
      <div className="slider-header">
        <label className="section-label">Hybrid Search Weights</label>
        <p className="section-subtitle">Adjust the balance between keyword and semantic search</p>
      </div>

      <div className="slider-main">
        <div className="weight-display">
          <div className="weight-item bm25-item">
            <span className="method-icon">📄</span>
            <div className="method-info">
              <span className="method-name">Keyword Search</span>
              <span className="weight-value">{bm25Weight}%</span>
            </div>
          </div>
          <div className="weight-divider"></div>
          <div className="weight-item vector-item">
            <span className="method-icon">🧠</span>
            <div className="method-info">
              <span className="method-name">Semantic Search</span>
              <span className="weight-value">{vectorWeight}%</span>
            </div>
          </div>
        </div>

        <div className="slider-container">
          <div className="slider-background" style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${bm25Weight}%, #3b82f6 ${bm25Weight}%, #3b82f6 100%)`
          }}></div>
          <input
            type="range"
            min="0"
            max="100"
            value={bm25Weight}
            onChange={handleSliderChange}
            className="weight-slider"
          />
        </div>

        <div className="slider-labels">
          <span className="label left">Keyword Only</span>
          <span className="label center">Balanced</span>
          <span className="label right">Semantic Only</span>
        </div>
        <button className="btn-reset" onClick={handleReset}>
          ↺ Reset to 50/50
        </button>
      </div>
    </div>
  );
};

export default HybridWeightSlider;
