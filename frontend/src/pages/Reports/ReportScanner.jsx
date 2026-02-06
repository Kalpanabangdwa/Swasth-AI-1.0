import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Utensils } from 'lucide-react';
import './ReportScanner.css';

const ReportScanner = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
        setResult(null);
    };

    const analyzeReport = () => {
        setAnalyzing(true);
        // Mock Analysis
        setTimeout(() => {
            setAnalyzing(false);
            setResult({
                status: 'completed',
                summary: 'Blood test results indicate Vitamin D and Iron deficiencies. Hemoglobin is normal.',
                metrics: [
                    { name: 'Hemoglobin', value: '14.5 g/dL', status: 'normal' },
                    { name: 'WBC Count', value: '6.5 K/uL', status: 'normal' },
                    { name: 'Vitamin D', value: '18 ng/mL', status: 'low' },
                    { name: 'Iron (Ferritin)', value: '12 ng/mL', status: 'low' }
                ],
                deficiencies: [
                    {
                        nutrient: 'Vitamin D',
                        impact: 'Fatigue, bone pain, muscle weakness',
                        foods: ['Salmon & Fatty Fish', 'Egg Yolks', 'Mushrooms', 'Fortified Milk']
                    },
                    {
                        nutrient: 'Iron',
                        impact: 'Dizziness, pale skin, weakness',
                        foods: ['Spinach & Leafy Greens', 'Red Meat', 'Legumes', 'Pumpkin Seeds']
                    }
                ]
            });
        }, 2000);
    };

    return (
        <div className="scanner-container fade-in">
            <div className="scanner-header">
                <h1>Medical Report Scanner</h1>
                <p>AI-powered analysis of your lab reports and prescriptions.</p>
            </div>

            <div className="scanner-layout">
                <div className="upload-section">
                    {!file ? (
                        <div
                            className={`drop-zone glass-panel ${isDragging ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="upload-icon">
                                <Upload size={40} />
                            </div>
                            <h3>Drag & Drop your report here</h3>
                            <p>Supported formats: PDF, JPG, PNG</p>
                            <label className="browse-btn">
                                Browse Files
                                <input type="file" hidden onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
                            </label>
                        </div>
                    ) : (
                        <div className="file-preview glass-panel fade-in">
                            <div className="file-info">
                                <FileText size={32} color="var(--accent-primary)" />
                                <div>
                                    <h4>{file.name}</h4>
                                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button className="remove-btn" onClick={removeFile} disabled={analyzing}>
                                    <X size={20} />
                                </button>
                            </div>

                            {!result && (
                                <button
                                    className="analyze-btn primary-btn"
                                    onClick={analyzeReport}
                                    disabled={analyzing}
                                >
                                    {analyzing ? 'Analyzing...' : 'Analyze Report'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {(analyzing || result) && (
                    <div className="result-section glass-panel fade-in">
                        {analyzing ? (
                            <div className="scanning-animation">
                                <div className="scan-line"></div>
                                <h3>Processing Document...</h3>
                                <p>Extracting medical terminology and values.</p>
                            </div>
                        ) : (
                            <div className="analysis-result">
                                <div className="result-header">
                                    <CheckCircle size={24} color="var(--success)" />
                                    <h3>Analysis Complete</h3>
                                </div>
                                <p className="summary">{result.summary}</p>

                                <div className="metrics-list">
                                    {result.metrics.map((metric, idx) => (
                                        <div key={idx} className="metric-item">
                                            <span className="metric-name">{metric.name}</span>
                                            <div className="metric-right">
                                                <span className="metric-value">{metric.value}</span>
                                                <span className={`status-badge ${metric.status}`}>
                                                    {metric.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>



                                {/* Diet Recommendation */}
                                {result.deficiencies && result.deficiencies.length > 0 && (
                                    <div className="diet-recommendation fade-in">
                                        <h3 style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Utensils size={20} color="#3b82f6" />
                                            Smart Diet Plan (Based on Deficiencies)
                                        </h3>

                                        <div className="diet-grid">
                                            {result.deficiencies.map((def, idx) => (
                                                <div key={idx} className="deficiency-card">
                                                    <h4>Low {def.nutrient} Detected</h4>
                                                    <p className="impact-text">Impact: {def.impact}</p>
                                                    <div className="food-list">
                                                        <h5>Recommended Foods:</h5>
                                                        <ul>
                                                            {def.foods.map((food, fIdx) => (
                                                                <li key={fIdx}>{food}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="disclaimer">
                                    <AlertCircle size={16} />
                                    <p>AI Generated summary. Please consult a doctor for official diagnosis.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportScanner;
