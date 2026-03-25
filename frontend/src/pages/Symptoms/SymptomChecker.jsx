import React, { useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle, Plus, Search, Thermometer, Clock, Shield, BookOpen } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './SymptomChecker.css';

const BODY_PARTS = [
    { id: 'head',    label: 'Head & Neck' },
    { id: 'chest',   label: 'Chest & Heart' },
    { id: 'stomach', label: 'Stomach & Gut' },
    { id: 'limbs',   label: 'Arms & Legs' },
    { id: 'skin',    label: 'Skin' },
    { id: 'general', label: 'General / Whole Body' },
];

const SYMPTOMS_DB = {
    head:    ['Headache', 'Fever', 'Sore Throat', 'Runny Nose', 'Earache', 'Dizziness', 'Stiff Neck', 'Blurred Vision'],
    chest:   ['Chest Pain', 'Shortness of Breath', 'Palpitations', 'Cough', 'Wheezing'],
    stomach: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal Pain', 'Bloating', 'Loss of Appetite'],
    limbs:   ['Joint Pain', 'Muscle Weakness', 'Swelling', 'Numbness', 'Cramps'],
    skin:    ['Rash', 'Itching', 'Hives', 'Bruising', 'Skin Discoloration'],
    general: ['Fatigue', 'Weight Loss', 'Night Sweats', 'Chills', 'Body Ache'],
};

const SEVERITY_COLORS = { Mild: '#10b981', Moderate: '#f59e0b', Severe: '#ef4444' };

const SymptomChecker = () => {
    const { user, API } = useUser();

    const [step, setStep]                     = useState(1);
    const [selectedPart, setSelectedPart]     = useState(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [duration, setDuration]             = useState('');
    const [severity, setSeverity]             = useState(5);
    const [searchQuery, setSearchQuery]       = useState('');
    const [result, setResult]                 = useState(null);
    const [loading, setLoading]               = useState(false);
    const [expandedCondition, setExpandedCondition] = useState(0); // which card is open

    const toggleSymptom = (symptom) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
        );
    };

    // ── Call backend, fall back to local logic if unavailable ────────────────
    const analyzeSymptoms = async () => {
        setStep(5);
        setLoading(true);

        try {
            const res = await fetch(`${API}/symptoms/check`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    symptoms: selectedSymptoms,
                    duration,
                    severity,
                    email: user?.email || null,
                }),
            });

            if (!res.ok) throw new Error('Backend error');
            const data = await res.json();
            setResult({ source: 'backend', ...data });

        } catch (err) {
            // ── Local fallback (original logic) ──────────────────────────────
            const DISEASES_LOCAL = [
                { name: 'Common Cold',        related: ['Runny Nose', 'Sore Throat', 'Headache', 'Fever', 'Cough', 'Body Ache', 'Fatigue'],                   advice: 'Rest and hydration. Use OTC pain relievers.', self_care: ['Drink warm fluids', 'Rest for 8+ hours', 'Gargle with salt water'], see_doctor_if: ['Fever exceeds 103°F', 'Symptoms last 10+ days'], severity_threshold: 4, isEmergency: false, category: 'Viral Infection' },
                { name: 'Influenza (Flu)',     related: ['Fever', 'Body Ache', 'Headache', 'Fatigue', 'Cough', 'Chills', 'Sore Throat'],                        advice: 'Get plenty of rest and drink fluids.', self_care: ['Isolate to prevent spread', 'Take paracetamol for fever'], see_doctor_if: ['Fever above 104°F', 'Chest pain'], severity_threshold: 5, isEmergency: false, category: 'Viral Infection' },
                { name: 'Dengue Fever',        related: ['Fever', 'Headache', 'Joint Pain', 'Body Ache', 'Rash', 'Fatigue', 'Nausea', 'Vomiting'],              advice: 'Avoid ibuprofen. Stay hydrated. See a doctor.', self_care: ['Drink 3L fluids daily', 'Only take paracetamol'], see_doctor_if: ['Bleeding from nose/gums', 'Platelet count drops'], severity_threshold: 6, isEmergency: true, category: 'Vector-Borne' },
                { name: 'Malaria',             related: ['Fever', 'Chills', 'Headache', 'Fatigue', 'Nausea', 'Vomiting', 'Body Ache', 'Night Sweats'],           advice: 'See a doctor immediately for blood test and antimalarials.', self_care: ['Stay hydrated', 'Use mosquito nets'], see_doctor_if: ['All cases need immediate attention'], severity_threshold: 6, isEmergency: true, category: 'Parasitic' },
                { name: 'Migraine',            related: ['Headache', 'Blurred Vision', 'Nausea', 'Vomiting', 'Dizziness', 'Fatigue'],                            advice: 'Rest in a quiet, dark room. Apply cold compress.', self_care: ['Dark quiet room', 'Cold compress on head'], see_doctor_if: ['Worst headache of your life', 'With stiff neck and fever'], severity_threshold: 7, isEmergency: false, category: 'Neurological' },
                { name: 'Asthma Attack',       related: ['Wheezing', 'Shortness of Breath', 'Chest Pain', 'Cough', 'Fatigue'],                                   advice: 'Sit upright and use rescue inhaler. Call emergency if no improvement.', self_care: ['Sit upright', 'Use rescue inhaler', 'Pursed-lip breathing'], see_doctor_if: ['Inhaler not helping', 'Blue lips'], severity_threshold: 7, isEmergency: true, category: 'Respiratory' },
                { name: 'Gastroenteritis',     related: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal Pain', 'Fever', 'Fatigue', 'Loss of Appetite'],            advice: 'Rehydrate with ORS. BRAT diet.', self_care: ['Sip ORS every 15 min', 'Eat banana, rice, toast'], see_doctor_if: ['Blood in stool', 'No fluids for 24 hours'], severity_threshold: 5, isEmergency: false, category: 'Gastrointestinal' },
                { name: 'Possible Heart Attack', related: ['Chest Pain', 'Shortness of Breath', 'Fatigue', 'Dizziness', 'Palpitations', 'Nausea'],              advice: 'Call emergency services NOW. Do not drive yourself.', self_care: ['Chew aspirin 325mg', 'Sit or lie comfortably', 'Loosen clothing'], see_doctor_if: ['IMMEDIATELY'], severity_threshold: 8, isEmergency: true, category: 'Cardiovascular' },
                { name: 'Anemia',              related: ['Fatigue', 'Dizziness', 'Shortness of Breath', 'Palpitations', 'Muscle Weakness', 'Skin Discoloration'], advice: 'Increase iron intake. Get a CBC blood test.', self_care: ['Eat spinach, lentils, dates', 'Take iron supplements if prescribed'], see_doctor_if: ['Severe fatigue', 'Rapid heartbeat'], severity_threshold: 4, isEmergency: false, category: 'Hematological' },
                { name: 'Appendicitis',        related: ['Abdominal Pain', 'Nausea', 'Vomiting', 'Fever', 'Loss of Appetite'],                                   advice: 'Go to the emergency room immediately.', self_care: ['Do NOT eat or drink anything', 'Do NOT apply heat to abdomen'], see_doctor_if: ['IMMEDIATELY — surgical emergency'], severity_threshold: 7, isEmergency: true, category: 'Surgical Emergency' },
                { name: 'Sinusitis',           related: ['Headache', 'Runny Nose', 'Fever', 'Fatigue', 'Sore Throat', 'Earache'],                                advice: 'Steam inhalation and saline nasal drops.', self_care: ['Steam inhalation twice daily', 'Saline nasal rinse', 'Sleep with head elevated'], see_doctor_if: ['Symptoms > 10 days', 'Vision changes'], severity_threshold: 4, isEmergency: false, category: 'ENT' },
            ];

            const scored = DISEASES_LOCAL.map(d => {
                const matched = selectedSymptoms.filter(s => d.related.includes(s));
                if (!matched.length) return null;
                const recall    = matched.length / d.related.length;
                const precision = matched.length / selectedSymptoms.length;
                let score       = (recall + precision) * 50;
                score -= Math.abs(d.severity_threshold - severity) * 4;
                return {
                    name:             d.name,
                    confidence:       Math.min(95, Math.max(30, Math.round(score))),
                    matched_symptoms: matched,
                    advice:           d.advice,
                    self_care:        d.self_care,
                    see_doctor_if:    d.see_doctor_if,
                    isEmergency:      d.isEmergency || severity >= 9,
                    category:         d.category,
                };
            }).filter(Boolean).sort((a, b) => b.confidence - a.confidence).slice(0, 3);

            setResult({
                source:           'local',
                top_conditions:   scored,
                emergency:        scored.some(c => c.isEmergency) || severity >= 9,
                overall_severity: severity <= 3 ? 'Mild' : severity <= 7 ? 'Moderate' : 'Severe',
                symptom_count:    selectedSymptoms.length,
                duration,
                severity_score:   severity,
                message:          scored.some(c => c.isEmergency) ? '⚠️ EMERGENCY: Please seek immediate medical attention!' : 'Analysis complete. Consult a doctor for proper diagnosis.',
            });
        }
        setLoading(false);
    };

    const resetProcess = () => {
        setStep(1); setSelectedPart(null); setSelectedSymptoms([]);
        setDuration(''); setSeverity(5); setSearchQuery(''); setResult(null);
        setExpandedCondition(0);
    };

    const severityColor = result ? SEVERITY_COLORS[result.overall_severity] || '#10b981' : '#10b981';

    return (
        <div className="checker-container fade-in">
            <header className="checker-header">
                <h1>Symptom Checker</h1>
                <p>Identify potential health issues in 3 easy steps</p>
            </header>

            <div className="steps-indicator glass-panel">
                {['Symptoms', 'Duration', 'Severity', 'Analysis'].map((label, i) => (
                    <React.Fragment key={label}>
                        <div className={`step ${step >= i + 1 ? 'active' : ''}`}>
                            <span className="step-num">{i + 1}</span>
                            <span className="step-text">{label}</span>
                        </div>
                        {i < 3 && <div className="divider" />}
                    </React.Fragment>
                ))}
            </div>

            <div className="checker-content glass-panel">

                {/* ── STEP 1: Symptoms ── */}
                {step === 1 && (
                    <div className="step-content fade-in">
                        <div className="step-header">
                            <h2>What symptoms are you experiencing?</h2>
                            <p className="text-muted">Select all that apply.</p>
                        </div>
                        <div className="search-container">
                            <Search className="search-icon" size={20} />
                            <input type="text" placeholder="Search symptoms (e.g., headache, fever)..."
                                className="symptom-search-input" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="symptoms-layout">
                            <div className="body-parts-sidebar">
                                {BODY_PARTS.map(part => (
                                    <button key={part.id}
                                        className={`part-btn ${selectedPart === part.id ? 'active' : ''}`}
                                        onClick={() => setSelectedPart(part.id)}>
                                        {part.label}
                                    </button>
                                ))}
                            </div>
                            <div className="symptoms-selection-area">
                                {selectedPart ? (
                                    <div className="options-grid compact">
                                        {SYMPTOMS_DB[selectedPart]
                                            .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(symptom => (
                                                <button key={symptom}
                                                    className={`option-btn symptom-btn ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
                                                    onClick={() => toggleSymptom(symptom)}>
                                                    <span>{symptom}</span>
                                                    {selectedSymptoms.includes(symptom) && <CheckCircle size={16} className="text-success" />}
                                                </button>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="select-prompt">
                                        <Activity size={48} className="prompt-icon" />
                                        <p>Select a body area from the left to view symptoms.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedSymptoms.length > 0 && (
                            <div className="selected-symptoms-bar">
                                <strong>Selected ({selectedSymptoms.length}):</strong>
                                <div className="selected-chips">
                                    {selectedSymptoms.map(s => (
                                        <span key={s} className="symptom-chip" onClick={() => toggleSymptom(s)}>
                                            {s} &times;
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="actions right">
                            <button className="primary-btn" disabled={selectedSymptoms.length === 0} onClick={() => setStep(2)}>
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Duration ── */}
                {step === 2 && (
                    <div className="step-content fade-in">
                        <div className="step-header">
                            <h2>How long have you had these symptoms?</h2>
                            <p className="text-muted">Duration helps narrow down conditions.</p>
                        </div>
                        <div className="duration-options">
                            {['Less than 1 day', '1 - 3 days', '1 week', 'More than 1 week'].map(d => (
                                <button key={d} className={`duration-btn ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>
                                    <Clock size={24} className="duration-icon" />
                                    <span>{d}</span>
                                    {duration === d && <CheckCircle size={18} className="check-icon" />}
                                </button>
                            ))}
                        </div>
                        <div className="actions">
                            <button className="secondary-btn" onClick={() => setStep(1)}>Back</button>
                            <button className="primary-btn" disabled={!duration} onClick={() => setStep(3)}>
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Severity ── */}
                {step === 3 && (
                    <div className="step-content fade-in">
                        <div className="step-header">
                            <h2>How severe are your symptoms?</h2>
                            <p className="text-muted">On a scale of 1 to 10.</p>
                        </div>
                        <div className="severity-container">
                            <div className="severity-display">
                                <Thermometer size={48} className={`severity-icon level-${Math.ceil(severity / 3)}`} />
                                <span className="severity-value">{severity} / 10</span>
                                <span className="severity-label">
                                    {severity <= 3 ? 'Mild Discomfort' : severity <= 7 ? 'Moderate Pain' : 'Severe / Intolerable'}
                                </span>
                            </div>
                            <input type="range" min="1" max="10" value={severity}
                                onChange={(e) => setSeverity(parseInt(e.target.value))}
                                className={`severity-slider level-${Math.ceil(severity / 3)}`} />
                            <div className="slider-labels"><span>Mild</span><span>Moderate</span><span>Severe</span></div>
                        </div>
                        <div className="actions">
                            <button className="secondary-btn" onClick={() => setStep(2)}>Back</button>
                            <button className="primary-btn analyze-btn" onClick={analyzeSymptoms}>
                                Analyze Symptoms <Activity size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 5: Loading / Results ── */}
                {step === 5 && loading && (
                    <div className="step-content loading fade-in">
                        <Activity className="animate-pulse" size={64} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analyzing Symptoms...</h3>
                        <p className="text-muted">Cross-referencing medical database and evaluating severity.</p>
                        <div className="loading-bar"><div className="loading-progress" /></div>
                    </div>
                )}

                {step === 5 && !loading && result && (
                    <div className="step-content result fade-in">

                        {/* ── Result Header ── */}
                        <div className="result-header">
                            <div className={`result-icon ${result.emergency ? 'danger' : 'success'}`}>
                                {result.emergency ? <AlertTriangle size={36} /> : <CheckCircle size={36} />}
                            </div>
                            <div className="result-title">
                                <h3>Diagnosis Analysis</h3>
                                <div className="result-badges">
                                    <span className="severity-badge" style={{ background: severityColor + '22', color: severityColor, border: `1px solid ${severityColor}` }}>
                                        Severity: {result.overall_severity}
                                    </span>
                                    <span className="confidence-badge">
                                        {result.symptom_count} symptoms · {result.duration}
                                    </span>
                                    {result.source === 'backend' && (
                                        <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)' }}>
                                            🤖 AI Analysis
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Emergency Banner ── */}
                        {result.emergency && (
                            <div className="emergency-warning" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
                                <AlertTriangle size={22} />
                                <strong>{result.message}</strong>
                            </div>
                        )}

                        {/* ── Top Conditions ── */}
                        <h4 style={{ marginBottom: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                            Top {result.top_conditions?.length || 0} Possible Condition{result.top_conditions?.length !== 1 ? 's' : ''}
                        </h4>

                        {result.top_conditions?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {result.top_conditions.map((cond, idx) => (
                                    <div key={idx}
                                        className="glass-panel"
                                        style={{ borderRadius: 12, overflow: 'hidden', border: idx === 0 ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                                        onClick={() => setExpandedCondition(expandedCondition === idx ? -1 : idx)}>

                                        {/* Condition Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: idx === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: idx === 0 ? '#10b981' : '#94a3b8', fontSize: '0.9rem', flexShrink: 0 }}>
                                                #{idx + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{cond.name}</span>
                                                    {cond.isEmergency && <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>EMERGENCY</span>}
                                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '2px 8px' }}>{cond.category}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${cond.confidence}%`, background: idx === 0 ? '#10b981' : '#f59e0b', borderRadius: 4, transition: 'width 1s ease' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: idx === 0 ? '#10b981' : '#f59e0b', minWidth: 40 }}>{cond.confidence}%</span>
                                                </div>
                                            </div>
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{expandedCondition === idx ? '▲' : '▼'}</span>
                                        </div>

                                        {/* Matched symptoms chips */}
                                        <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {cond.matched_symptoms?.map(s => (
                                                <span key={s} style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '2px 8px' }}>✓ {s}</span>
                                            ))}
                                        </div>

                                        {/* Expanded details */}
                                        {expandedCondition === idx && (
                                            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="fade-in">
                                                <div style={{ marginTop: 14 }}>
                                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12 }}>{cond.advice}</p>

                                                    {cond.self_care?.length > 0 && (
                                                        <div style={{ marginBottom: 12 }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                <Shield size={13} /> Self-Care Steps
                                                            </div>
                                                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                {cond.self_care.map((tip, i) => (
                                                                    <li key={i} style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', gap: 6 }}>
                                                                        <span style={{ color: '#10b981' }}>•</span> {tip}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {cond.see_doctor_if?.length > 0 && (
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                <BookOpen size={13} /> See a Doctor If
                                                            </div>
                                                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                {cond.see_doctor_if.map((tip, i) => (
                                                                    <li key={i} style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'flex', gap: 6 }}>
                                                                        <span>⚠️</span> {tip}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="analysis-box glass-panel" style={{ textAlign: 'center', padding: 24 }}>
                                <p style={{ color: '#94a3b8' }}>No matching conditions found. Please consult a doctor.</p>
                            </div>
                        )}

                        <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: 16, textAlign: 'center' }}>
                            ⚠️ This is not a medical diagnosis. Always consult a qualified healthcare professional.
                        </p>

                        <div className="actions right mt-4">
                            <button className="secondary-btn" onClick={resetProcess}>Start New Check</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymptomChecker;
