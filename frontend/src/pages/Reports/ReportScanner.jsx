import React, { useState, useRef } from 'react';
import {
    Upload, FileText, AlertCircle, X, Activity,
    ChevronRight, ShieldAlert, FileBarChart, HeartPulse,
    Eye, Lightbulb, TrendingUp, Clock, Lock,
    Download, Trash2, CheckCircle, Image, File,
    Search, Filter, Calendar, Stethoscope, Utensils, FileSearch
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line
} from 'recharts';
import './ReportScanner.css';

/* ───────────── Static Data ───────────── */
const TABS = [
    { id: 'reports',  label: 'Reports',  icon: <FileText size={16} /> },
    { id: 'insights', label: 'AI Insights', icon: <Lightbulb size={16} /> },
    { id: 'vault',    label: 'Vault',    icon: <Lock size={16} /> },
];

const REPORT_TYPES = {
    pdf:  { label: 'Medical Report', color: '#3b82f6', icon: <FileText size={18} /> },
    jpg:  { label: 'X-Ray / Scan',   color: '#8b5cf6', icon: <Image    size={18} /> },
    jpeg: { label: 'X-Ray / Scan',   color: '#8b5cf6', icon: <Image    size={18} /> },
    png:  { label: 'Medical Image',  color: '#06b6d4', icon: <Image    size={18} /> },
    default: { label: 'Clinical Report', color: '#22c55e', icon: <File size={18} /> },
};

const SCAN_STEPS = [
    'Reading file structure…',
    'Extracting medical data…',
    'Cross-referencing findings…',
    'Generating AI insights…',
];

const vaultDocs = [];

/* ───────────── Helpers ───────────── */
const getReportType = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    return REPORT_TYPES[ext] || REPORT_TYPES.default;
};

const formatDate = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ───────────── Trend Data by Time Range ───────────── */
const TREND_RANGES = {
    'last': [
        { label: 'Jan',  hemoglobin: 14.5, vitaminD: 18, cholesterol: 215, bloodSugar: 94 },
    ],
    '3m': [
        { label: 'Nov',  hemoglobin: 13.8, vitaminD: 20, cholesterol: 208, bloodSugar: 90 },
        { label: 'Dec',  hemoglobin: 14.1, vitaminD: 17, cholesterol: 212, bloodSugar: 92 },
        { label: 'Jan',  hemoglobin: 14.5, vitaminD: 18, cholesterol: 215, bloodSugar: 94 },
    ],
    '6m': [
        { label: 'Aug',  hemoglobin: 13.0, vitaminD: 28, cholesterol: 195, bloodSugar: 86 },
        { label: 'Sep',  hemoglobin: 13.5, vitaminD: 24, cholesterol: 200, bloodSugar: 88 },
        { label: 'Oct',  hemoglobin: 13.2, vitaminD: 22, cholesterol: 202, bloodSugar: 89 },
        { label: 'Nov',  hemoglobin: 13.8, vitaminD: 20, cholesterol: 208, bloodSugar: 90 },
        { label: 'Dec',  hemoglobin: 14.1, vitaminD: 17, cholesterol: 212, bloodSugar: 92 },
        { label: 'Jan',  hemoglobin: 14.5, vitaminD: 18, cholesterol: 215, bloodSugar: 94 },
    ],
    '1y': [
        { label: 'Feb',  hemoglobin: 12.8, vitaminD: 32, cholesterol: 188, bloodSugar: 83 },
        { label: 'Mar',  hemoglobin: 13.0, vitaminD: 30, cholesterol: 190, bloodSugar: 84 },
        { label: 'Apr',  hemoglobin: 13.2, vitaminD: 29, cholesterol: 192, bloodSugar: 85 },
        { label: 'May',  hemoglobin: 13.5, vitaminD: 27, cholesterol: 194, bloodSugar: 86 },
        { label: 'Jun',  hemoglobin: 13.1, vitaminD: 25, cholesterol: 196, bloodSugar: 87 },
        { label: 'Jul',  hemoglobin: 13.3, vitaminD: 26, cholesterol: 198, bloodSugar: 88 },
        { label: 'Aug',  hemoglobin: 13.0, vitaminD: 28, cholesterol: 195, bloodSugar: 86 },
        { label: 'Sep',  hemoglobin: 13.5, vitaminD: 24, cholesterol: 200, bloodSugar: 88 },
        { label: 'Oct',  hemoglobin: 13.2, vitaminD: 22, cholesterol: 202, bloodSugar: 89 },
        { label: 'Nov',  hemoglobin: 13.8, vitaminD: 20, cholesterol: 208, bloodSugar: 90 },
        { label: 'Dec',  hemoglobin: 14.1, vitaminD: 17, cholesterol: 212, bloodSugar: 92 },
        { label: 'Jan',  hemoglobin: 14.5, vitaminD: 18, cholesterol: 215, bloodSugar: 94 },
    ],
};

const TIME_FILTERS = [
    { key: 'last', label: 'Last Report' },
    { key: '3m',   label: '3 Months'    },
    { key: '6m',   label: '6 Months'    },
    { key: '1y',   label: '1 Year'      },
];

const CHART_TOOLTIP_STYLE = {
    contentStyle: {
        background: 'rgba(10,15,30,0.96)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: '#fff',
        fontSize: '0.82rem',
    },
    labelStyle: { color: '#94a3b8', marginBottom: 4 },
    itemStyle:  { color: '#e2e8f0' },
    cursor:     { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 },
};

const CHART_AXIS = {
    stroke:    'rgba(148,163,184,0.5)',
    fontSize:  11,
    tickLine:  false,
    axisLine:  false,
};

/* Mini stat summary for each metric */
const METRIC_STATS = [
    { key: 'hemoglobin',   label: 'Hemoglobin',   unit: 'g/dL', ref: '13.5–17.5', color: '#3b82f6', current: 14.5, status: 'normal'   },
    { key: 'vitaminD',     label: 'Vitamin D',     unit: 'ng/mL',ref: '30–100',    color: '#f59e0b', current: 18,   status: 'low'      },
    { key: 'cholesterol',  label: 'Cholesterol',   unit: 'mg/dL',ref: '<200',      color: '#ef4444', current: 215,  status: 'high'     },
    { key: 'bloodSugar',   label: 'Blood Sugar',   unit: 'mg/dL',ref: '70–99',     color: '#22c55e', current: 94,   status: 'normal'   },
];

/* ───────────── TrendsDashboard component ───────────── */
const TrendsDashboard = () => {
    const [range, setRange] = useState('6m');
    const data = TREND_RANGES[range];

    const renderChart = (dataKey, color, name, unit) => (
        <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={color} stopOpacity={0}    />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" {...CHART_AXIS} />
                <YAxis {...CHART_AXIS} />
                <Tooltip
                    {...CHART_TOOLTIP_STYLE}
                    formatter={(val) => [`${val} ${unit}`, name]}
                />
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={600}
                    animationEasing="ease-out"
                />
            </LineChart>
        </ResponsiveContainer>
    );

    return (
        <div className="trends-dashboard">

            {/* ── Header ── */}
            <div className="trends-header glass-panel">
                <div className="trends-header-left">
                    <div className="trends-header-icon"><TrendingUp size={24} /></div>
                    <div>
                        <h2>Health Analytics</h2>
                        <p>Track your lab values over time and spot patterns early.</p>
                    </div>
                </div>
                {/* Time filters */}
                <div className="time-filters">
                    {TIME_FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`time-filter-btn ${range === f.key ? 'active' : ''}`}
                            onClick={() => setRange(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="trends-stat-cards">
                {METRIC_STATS.map(m => (
                    <div key={m.key} className="tsc-card glass-panel">
                        <div className="tsc-label">{m.label}</div>
                        <div className="tsc-value" style={{ color: m.color }}>{m.current} <span className="tsc-unit">{m.unit}</span></div>
                        <div className="tsc-ref">Ref: {m.ref}</div>
                        <span className={`tsc-badge ${m.status}`}>{m.status === 'normal' ? '✓ Normal' : m.status === 'low' ? '↓ Low' : '↑ High'}</span>
                        <div className="tsc-bar-track">
                            <div className="tsc-bar-fill" style={{ width: '60%', background: m.color }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── 4 Charts Grid ── */}
            <div className="charts-grid">
                {[
                    { key: 'hemoglobin',  color: '#3b82f6', label: 'Hemoglobin',  unit: 'g/dL',  icon: '🩸', ref: '13.5–17.5 g/dL' },
                    { key: 'vitaminD',    color: '#f59e0b', label: 'Vitamin D',   unit: 'ng/mL', icon: '☀️', ref: '30–100 ng/mL'   },
                    { key: 'cholesterol', color: '#ef4444', label: 'Cholesterol', unit: 'mg/dL', icon: '🫀', ref: '<200 mg/dL'      },
                    { key: 'bloodSugar',  color: '#22c55e', label: 'Blood Sugar', unit: 'mg/dL', icon: '🍬', ref: '70–99 mg/dL'    },
                ].map(c => (
                    <div key={c.key} className="chart-card glass-panel">
                        <div className="chart-card-header">
                            <div className="chart-card-title">
                                <span className="chart-icon">{c.icon}</span>
                                <span>{c.label}</span>
                            </div>
                            <div className="chart-card-ref">Ref: {c.ref}</div>
                        </div>
                        <div className="chart-card-body">
                            {renderChart(c.key, c.color, c.label, c.unit)}
                        </div>
                        <div className="chart-card-footer">
                            <span className="legend-dot" style={{ background: c.color }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.label} ({c.unit})</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="insights-disclaimer">
                <AlertCircle size={14} />
                <p>Data shown is based on uploaded reports. Values may vary across labs.</p>
            </div>
        </div>
    );
};



/* ───────────── Component ───────────── */
const ReportScanner = () => {
    const [activeTab, setActiveTab]     = useState('reports');
    const [isDragging, setIsDragging]   = useState(false);
    const [scanStep, setScanStep]       = useState(0);
    const [analyzing, setAnalyzing]     = useState(false);
    const [reports, setReports]         = useState([]);   // list of uploaded report cards
    const [viewReport, setViewReport]   = useState(null); // report being viewed in analysis panel
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType]   = useState('All');
    
    // New states for Text Paste and HF API
    const [inputType, setInputType]     = useState('file'); // 'file' | 'text'
    const [textInput, setTextInput]     = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    
    const inputRef = useRef();

    /* Drag handlers */
    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
    };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };
    const handleFileSelect = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };

    /* Hugging Face AI cold-start logic */
    const summarizeReport = async (reportText) => {
        setAnalyzing(true);
        setLoadingMessage('Waking up AI model...');
        
        const chunkText = (text, maxChars = 3500) => {
            if (!text) return [""];
            if (text.length <= maxChars) return [text];

            // Prefer paragraph-ish splits to keep context coherent.
            const paras = String(text).split(/\n{2,}/);
            const chunks = [];
            let current = "";

            for (const p of paras) {
                const candidate = current ? `${current}\n\n${p}` : p;
                if (candidate.length > maxChars && current) {
                    chunks.push(current);
                    current = p;
                } else {
                    current = candidate;
                }
            }

            if (current) chunks.push(current);

            // Safety fallback: split any still-too-large chunk.
            const safe = [];
            for (const c of chunks) {
                if (c.length <= maxChars) safe.push(c);
                else {
                    for (let i = 0; i < c.length; i += maxChars) {
                        safe.push(c.slice(i, i + maxChars));
                    }
                }
            }
            return safe;
        };

        const chunks = chunkText(reportText);
        const summaries = [];

        for (let i = 0; i < chunks.length; i++) {
            let attempts = 0;

            while (attempts < 3) {
                try {
                    setLoadingMessage(
                        i === 0
                            ? (summaries.length === 0 ? 'Waking up AI model...' : 'Generating summary...')
                            : `Summarizing report chunk ${i + 1}/${chunks.length}...`
                    );

                    const res = await fetch("https://api-inference.huggingface.co/models/Falconsai/medical_summarization", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            inputs: chunks[i],
                            parameters: { max_length: 220, min_length: 50, do_sample: false },
                        }),
                    });

                    const data = await res.json();

                    if (data.error && data.error.toLowerCase().includes("loading")) {
                        setLoadingMessage("Model loading, please wait...");
                        await new Promise(r => setTimeout(r, 8000));
                        attempts++;
                        continue;
                    }

                    summaries.push(data[0]?.summary_text || "Could not summarize this chunk.");
                    break;
                } catch (err) {
                    console.error("HF API Error:", err);
                    break;
                }
            }
        }

        setAnalyzing(false);
        setLoadingMessage('');
        return summaries.filter(Boolean).join('\n\n') || "Model timeout or error — please try again.";
    };

    const handleTextSubmit = async (e) => {
        if (e) e.stopPropagation();
        if (!textInput.trim()) return;
        
        const summary = await summarizeReport(textInput);
        
        // Simple heuristic for deficiencies (to preserve deficiencies UI logic)
        const lowerText = textInput.toLowerCase();
        let extDeficiencies = [];
        if (lowerText.includes('vitamin d') && lowerText.includes('low')) extDeficiencies.push('Low Vitamin D');
        if (lowerText.includes('iron') && lowerText.includes('low')) extDeficiencies.push('Iron Deficiency');
        if (lowerText.includes('b12') && lowerText.includes('low')) extDeficiencies.push('Low B12');
        if (lowerText.includes('hemoglobin') && lowerText.includes('low')) extDeficiencies.push('Low Hemoglobin');

        const newReport = {
            id: Date.now(),
            name: 'Pasted Medical Text',
            date: formatDate(),
            type: 'Text Document',
            typeColor: '#34d399',
            size: '-',
            status: 'Analyzed',
            summary: summary,
            metrics: [],
            deficiencies: extDeficiencies, // preserve deficiencies display logic
            suggestions: [],
            warnings: [],
            healthScore: 85,
        };
        setReports(prev => [newReport, ...prev]);
        setTextInput('');
        setInputType('file'); // visually return to file 
    };

    /* Core upload + AI extraction flow */
    const handleFile = async (file) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Only PDF files are supported for AI analysis. Please upload a .pdf file.');
            return;
        }

        setAnalyzing(true);
        setScanStep(0);

        let step = 0;
        const interval = setInterval(() => {
            step += 1;
            if (step < SCAN_STEPS.length) setScanStep(step);
            else clearInterval(interval);
        }, 800);

        try {
            // Build a multipart/form-data request — send file + HF token to Python backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('hf_token', import.meta.env.VITE_HUGGINGFACE_TOKEN || '');

            const response = await fetch('http://localhost:8000/analyze-report', {
                method: 'POST',
                body: formData,
            });

            clearInterval(interval);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Backend error: ${response.status}`);
            }

            const data = await response.json();
            
            let finalSummary = data.summary || 'Analysis complete.';
            if (data.extracted_text) {
                // Fetch HF summary.
                // Also provide extracted lab values as an explicit reference so the summarizer
                // doesn't confuse numbers inside test names (e.g., "Vitamin D 25-OH").
                setAnalyzing(true);
                const markersContext = Array.isArray(data.markers) && data.markers.length
                    ? data.markers.map(m => `- ${m.name}: ${m.value}`).join('\n')
                    : '';

                const markerContextBlock = markersContext
                    ? `Important lab values (use exact numbers; do not change):\n${markersContext}\n\n`
                    : '';

                const summaryInput = `${markerContextBlock}Medical report text:\n${data.extracted_text}`;
                const aiSummary = await summarizeReport(summaryInput);
                if (aiSummary && aiSummary !== "Model timeout or error — please try again.") {
                    finalSummary = aiSummary;
                    if (markersContext) {
                        finalSummary += `\n\nExtracted lab values:\n${markersContext}`;
                    }
                }
            }

            setScanStep(0);

            const type = getReportType(file.name);
            const newReport = {
                id: Date.now(),
                name: file.name,
                date: formatDate(),
                type: type.label,
                typeColor: type.color,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                status: 'Analyzed',
                summary: finalSummary,
                metrics: data.markers || [],
                deficiencies: data.deficiencies || [],
                suggestions: data.suggestions || [],
                warnings: data.warnings || [],
                healthScore: data.health_score || 85,
            };
            setReports(prev => [newReport, ...prev]);
            if (inputRef.current) inputRef.current.value = '';

        } catch (err) {
            console.error('Report analysis error:', err);
            clearInterval(interval);
            setAnalyzing(false);
            alert(`Error: ${err.message}\n\nMake sure the Python backend is running:\ncd backend && uvicorn main:app --reload`);
        }
    };

    const deleteReport = (id) => {
        setReports(prev => prev.filter(r => r.id !== id));
        if (viewReport?.id === id) setViewReport(null);
    };

    /* ── JSX ── */
    return (
        <div className="hr-container fade-in">

            {/* ── Page Header ── */}
            <div className="hr-header">
                <div className="hr-header-text">
                    <h1>Health Records &amp; Reports</h1>
                    <p>Manage and analyze all your medical records in one secure place.</p>
                </div>
                <div className="hr-actions">
                    <button className="hr-btn hr-btn-upload" onClick={() => { setActiveTab('reports'); setTimeout(() => inputRef.current?.click(), 100); }}>
                        <Upload size={16} /> Upload Medical Report
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="hr-tabs">
                {TABS.map(tab => (
                    <button key={tab.id} className={`hr-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div className="hr-tab-content fade-in" key={activeTab}>

                {/* ══ REPORTS TAB ══ */}
                {activeTab === 'reports' && (
                    <div className="reports-tab">

                        {/* Upload Zone */}
                        <div
                            className={`upload-zone ${isDragging ? 'drag-active' : ''} ${analyzing ? 'is-scanning' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => !analyzing && inputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={inputRef}
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileSelect}
                            />

                            {analyzing ? (
                                /* Scanning animation */
                                <div className="scan-state">
                                    <div className="scan-orbit">
                                        <div className="scan-ring ring-1" />
                                        <div className="scan-ring ring-2" />
                                        <div className="scan-ring ring-3" />
                                        <Activity size={32} className="scan-icon" />
                                    </div>
                                    <h3 className="scan-title">{loadingMessage || 'Analyzing report with AI…'}</h3>
                                    <p className="scan-step">{loadingMessage ? 'Interacting with Hugging Face...' : SCAN_STEPS[scanStep]}</p>
                                    <div className="scan-bar-wrap">
                                        <div className="scan-bar" style={{ animationDuration: '2.6s' }} />
                                    </div>
                                </div>
                            ) : (
                                /* Idle upload prompt */
                                <div className="upload-prompt" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    
                                    {/* Type Toggle Header */}
                                    <div className="input-type-toggle" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '12px', width: 'fit-content' }}>
                                        <button 
                                            className="hr-btn"
                                            style={{ background: inputType === 'file' ? 'var(--accent-primary)' : 'transparent', color: inputType === 'file' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
                                            onClick={(e) => { e.stopPropagation(); setInputType('file'); }}
                                        >
                                            <Upload size={16} /> Upload File
                                        </button>
                                        <button 
                                            className="hr-btn"
                                            style={{ background: inputType === 'text' ? 'var(--accent-primary)' : 'transparent', color: inputType === 'text' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}
                                            onClick={(e) => { e.stopPropagation(); setInputType('text'); }}
                                        >
                                            <FileText size={16} /> Paste Text
                                        </button>
                                    </div>

                                    {inputType === 'file' ? (
                                        <>
                                            <div className="upload-circle">
                                                <Upload size={36} />
                                            </div>
                                            <h3>Drag and drop your medical report here<br />or click to upload</h3>
                                            <p className="upload-hint">Supports PDF, JPG, PNG · Up to 20 MB</p>
                                            <div className="upload-badges">
                                                <span className="file-badge">📄 PDF</span>
                                                <span className="file-badge">🖼 Images</span>
                                                <span className="file-badge">🩺 Medical Reports</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-paste-area" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <textarea 
                                                value={textInput}
                                                onChange={(e) => setTextInput(e.target.value)}
                                                placeholder="Paste your medical report text here to generate an AI summary..."
                                                style={{ width: '100%', minHeight: '160px', background: 'rgba(15,23,42,0.5)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                                            />
                                            <button 
                                                className="hr-btn hr-btn-upload" 
                                                style={{ alignSelf: 'flex-end' }}
                                                onClick={handleTextSubmit}
                                                disabled={!textInput.trim() || analyzing}
                                            >
                                                <Lightbulb size={16} /> Summarize Report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Report Cards List */}
                        {reports.length > 0 && (
                            <div className="report-cards-section">
                                <h3 className="rcs-title">Uploaded Reports <span className="rcs-count">{reports.length}</span></h3>

                                <div className="report-cards-list">
                                    {reports.map(rpt => (
                                        <div key={rpt.id} className={`report-card glass-panel ${viewReport?.id === rpt.id ? 'selected' : ''}`}>
                                            <div className="rc-left">
                                                <div className="rc-type-icon" style={{ background: rpt.typeColor + '22', color: rpt.typeColor }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div className="rc-info">
                                                    <h4 className="rc-name">{rpt.name}</h4>
                                                    <div className="rc-meta">
                                                        <span className="rc-type-badge" style={{ background: rpt.typeColor + '22', color: rpt.typeColor }}>
                                                            {rpt.type}
                                                        </span>
                                                        <span className="rc-date">📅 {rpt.date}</span>
                                                        <span className="rc-size">💾 {rpt.size}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rc-right">
                                                <span className="rc-status-badge">
                                                    <CheckCircle size={13} /> {rpt.status}
                                                </span>
                                                <div className="rc-actions">
                                                    <button className="rc-btn rc-btn-view" onClick={() => setViewReport(viewReport?.id === rpt.id ? null : rpt)} title="View Analysis">
                                                        <Eye size={15} /> View Analysis
                                                    </button>
                                                    <button className="rc-btn rc-btn-download" title="Download">
                                                        <Download size={15} />
                                                    </button>
                                                    <button className="rc-btn rc-btn-delete" onClick={() => deleteReport(rpt.id)} title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Inline Analysis Panel */}
                                {viewReport && (
                                    <div className="analysis-panel glass-panel fade-in">
                                        <div className="ap-header">
                                            <div className="ap-title">
                                                <FileBarChart size={20} color="var(--accent-primary)" />
                                                <h3>AI Analysis — {viewReport.name}</h3>
                                            </div>
                                            <button className="icon-close-btn" onClick={() => setViewReport(null)}><X size={18} /></button>
                                        </div>

                                        <div className="ap-body">
                                            {/* Summary */}
                                            <div className="ap-card">
                                                <h4>📋 Report Summary</h4>
                                                <p>{viewReport.summary}</p>
                                            </div>

                                            {/* Metric boxes */}
                                            {viewReport.metrics && viewReport.metrics.length > 0 && (
                                                <div className="ap-card">
                                                    <h4>🔬 Key Markers Extracted</h4>
                                                    <div className="metrics-grid">
                                                        {viewReport.metrics.map((m, i) => (
                                                            <div key={i} className={`metric-box ${m.status?.toLowerCase() || 'normal'}`}>
                                                                <span className="metric-label">{m.name}</span>
                                                                <span className="metric-val">{m.value}</span>
                                                                <span className={`status-dot ${m.status?.toLowerCase() || 'normal'}`} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bar chart */}
                                            {viewReport.metrics && viewReport.metrics.length > 0 && (
                                                <div className="ap-card">
                                                    <h4>📊 Lab Values Chart</h4>
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <BarChart data={viewReport.metrics.map(m => ({ name: m.name, value: typeof m.num === 'number' ? m.num : parseFloat(m.value) || 0 }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                                                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                                            <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                                                            <Bar dataKey="value" fill="var(--accent-primary)" radius={[4,4,0,0]} barSize={32} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Dynamic Deficiencies Readout */}
                                            {viewReport.deficiencies && viewReport.deficiencies.length > 0 && (
                                                <div className="ap-card risk-ap-card">
                                                    <h4><ShieldAlert size={16} style={{ color: '#f59e0b' }} /> Health Risk Indicators</h4>
                                                    <div className="risk-list">
                                                        {viewReport.deficiencies.map((d, i) => (
                                                            <div key={i} className="risk-item">
                                                                <div className="risk-header">
                                                                    <div className="risk-title"><ShieldAlert size={15} /><span>Abnormal {d}</span></div>
                                                                    <span className="risk-badge warning">Flagged</span>
                                                                </div>
                                                                <p className="risk-impact">Extracted from report as abnormal. AI diet plan recommended.</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Diet Plan Generation */}
                                            {viewReport.aiResponse && (
                                                <div className="ap-card recommendation-card" style={{ marginTop: '1rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                    <h4><Utensils size={16} style={{ color: 'var(--accent-primary)' }} /> AI-Generated Dietary Plan</h4>
                                                    <div className="recommendation-content" style={{ marginTop: '1rem' }}>
                                                        <div className="rec-text" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                                                            {viewReport.aiResponse}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="disclaimer">
                                            <AlertCircle size={14} />
                                            <p>AI-generated summary. Consult a qualified physician for official diagnosis.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty state */}
                        {reports.length === 0 && !analyzing && (
                            <div className="empty-reports">
                                <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                                <p>No reports uploaded yet. Upload a medical report above to get started.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ AI INSIGHTS TAB ══ */}
                {activeTab === 'insights' && (
                    <div className="insights-dashboard">
                        {reports.length === 0 ? (
                            <div className="empty-state">
                                <Lightbulb size={48} className="empty-icon text-muted" />
                                <h3>No Insights Available</h3>
                                <p>Upload a medical report to generate AI-driven nutritional and health insights.</p>
                                <button className="hr-btn hr-btn-upload" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('reports')}>Go to Upload</button>
                            </div>
                        ) : (
                            <>
                                <div className="insights-banner glass-panel">
                                    <div className="insights-banner-left">
                                        <div className="insights-banner-icon"><Lightbulb size={26} /></div>
                                        <div>
                                            <h2>AI Report Insights</h2>
                                            <p>Analysis for {reports[0].name}</p>
                                        </div>
                                    </div>
                                    <span className="insights-updated-tag">Analyzed: {reports[0].date}</span>
                                </div>

                                {/* Health Score Bar */}
                                <div className="ins-section glass-panel">
                                    <div className="ins-section-header">
                                        <div className="ins-section-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><HeartPulse size={20} /></div>
                                        <h3>Overall Health Score</h3>
                                    </div>
                                    <div className="health-score-wrap">
                                        <div className="health-score-num" style={{ color: (reports[0].healthScore || 85) >= 70 ? '#22c55e' : (reports[0].healthScore || 85) >= 45 ? '#f59e0b' : '#ef4444' }}>
                                            {reports[0].healthScore || 85}<span>/100</span>
                                        </div>
                                        <div className="health-score-bar-track">
                                            <div className="health-score-bar-fill" style={{ width: `${reports[0].healthScore || 85}%`, background: (reports[0].healthScore || 85) >= 70 ? '#22c55e' : (reports[0].healthScore || 85) >= 45 ? '#f59e0b' : '#ef4444' }} />
                                        </div>
                                        <p className="health-score-label">{(reports[0].healthScore || 85) >= 70 ? '✅ Good' : (reports[0].healthScore || 85) >= 45 ? '⚠️ Needs Attention' : '❗ Critical – Consult a Doctor'}</p>
                                    </div>
                                    <p className="ins-summary-text" style={{ marginTop: '0.75rem' }}>{reports[0].summary}</p>
                                </div>

                                {/* Lab Markers */}
                                {reports[0].metrics?.length > 0 && (
                                    <div className="ins-section glass-panel">
                                        <div className="ins-section-header">
                                            <div className="ins-section-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}><FileBarChart size={20} /></div>
                                            <h3>Extracted Lab Markers</h3>
                                        </div>
                                        <div className="findings-grid">
                                            {reports[0].metrics.map((f, i) => (
                                                <div key={i} className={`finding-card ${f.status?.toLowerCase() || 'normal'}`}>
                                                    <div className="finding-top">
                                                        <span className="finding-name">{f.name}</span>
                                                        <span className={`finding-badge ${f.status?.toLowerCase() || 'normal'}`}>{f.status?.toUpperCase() || 'NORMAL'}</span>
                                                    </div>
                                                    <div className="finding-value">{f.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Deficiencies */}
                                {reports[0].deficiencies?.length > 0 && (
                                    <div className="ins-section glass-panel">
                                        <div className="ins-section-header">
                                            <div className="ins-section-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}><AlertCircle size={20} /></div>
                                            <h3>Detected Deficiencies</h3>
                                        </div>
                                        <div className="pill-list">
                                            {reports[0].deficiencies.map((d, i) => (<span key={i} className="pill pill-red">❗ {d}</span>))}
                                        </div>
                                    </div>
                                )}

                                {/* Warnings */}
                                {reports[0].warnings?.length > 0 && (
                                    <div className="ins-section glass-panel">
                                        <div className="ins-section-header">
                                            <div className="ins-section-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><ShieldAlert size={20} /></div>
                                            <h3>Health Warnings</h3>
                                        </div>
                                        <div className="pill-list">
                                            {reports[0].warnings.map((w, i) => (<span key={i} className="pill pill-yellow">⚠️ {w}</span>))}
                                        </div>
                                    </div>
                                )}

                                {/* Dietary Suggestions */}
                                {reports[0].suggestions?.length > 0 && (
                                    <div className="ins-section glass-panel">
                                        <div className="ins-section-header">
                                            <div className="ins-section-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}><Utensils size={20} /></div>
                                            <h3>Dietary Suggestions</h3>
                                        </div>
                                        <ul className="suggestions-list">
                                            {reports[0].suggestions.map((s, i) => (
                                                <li key={i}><CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0 }} /> {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="insights-disclaimer">
                                    <AlertCircle size={14} />
                                    <p>⚕️ Disclaimer: This analysis is AI-generated and not a substitute for professional medical advice. Always consult a qualified doctor.</p>
                                </div>
                            </>
                        )}
                    </div>
                )}


                {/* ══ TRENDS TAB (Deleted) ══ */}
                {/* ══ TIMELINE TAB (Deleted) ══ */}

                {/* ══ VAULT TAB ══ */}
                {activeTab === 'vault' && (
                    <div className="hr-tab-panel vault-panel">
                        {/* Vault Controls */}
                        <div className="vault-controls glass-panel">
                            <div className="search-box">
                                <Search size={18} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search documents..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="filter-dropdown">
                                <Filter size={18} className="filter-icon" />
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="All">All Types</option>
                                    <option value="PDF">PDF Reports</option>
                                    <option value="Image">Medical Images</option>
                                </select>
                            </div>
                        </div>

                        {/* Document Grid */}
                        <div className="vault-grid">
                            {vaultDocs
                                .filter(doc => 
                                    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                    (filterType === 'All' || doc.type === filterType)
                                )
                                .map((doc, i) => (
                                    <div key={doc.id} className="vault-document-card glass-panel fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div className="vdc-type-icon" style={{ background: doc.color + '15', color: doc.color }}>
                                            {doc.icon}
                                        </div>
                                        <div className="vdc-info">
                                            <h4 title={doc.name}>{doc.name}</h4>
                                            <div className="vdc-meta">
                                                <span>{doc.date}</span>
                                                <span className="dot">•</span>
                                                <span>{doc.size}</span>
                                            </div>
                                        </div>
                                        <div className="vdc-actions">
                                            <button className="vdc-btn view" title="View"><Eye size={16} /></button>
                                            <button className="vdc-btn download" title="Download"><Download size={16} /></button>
                                            <button className="vdc-btn delete" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Empty Vault State */}
                        {vaultDocs.filter(doc => 
                            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                            (filterType === 'All' || doc.type === filterType)
                        ).length === 0 && (
                            <div className="empty-vault">
                                <FileSearch size={48} />
                                <p>No documents found matching your search.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ReportScanner;
