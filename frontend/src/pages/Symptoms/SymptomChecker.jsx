import React, { useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle, Plus } from 'lucide-react';
import './SymptomChecker.css';

const BODY_PARTS = [
    { id: 'head', label: 'Head & Neck' },
    { id: 'chest', label: 'Chest & Heart' },
    { id: 'stomach', label: 'Stomach & Gut' },
    { id: 'limbs', label: 'Arms & Legs' },
    { id: 'skin', label: 'Skin' },
    { id: 'general', label: 'General / Whole Body' },
];

const SYMPTOMS_DB = {
    head: ['Headache', 'Dizziness', 'Sore Throat', 'Vision Issues', 'Ear Pain', 'Sinus Pressure'],
    chest: ['Chest Pain', 'Shortness of Breath', 'Palpitations', 'Cough', 'Wheezing'],
    stomach: ['Nausea', 'Stomach Ache', 'Bloating', 'Indigestion', 'Vomiting', 'Diarrhea', 'Constipation'],
    limbs: ['Joint Pain', 'Muscle Weakness', 'Swelling', 'Numbness', 'Tremors', 'Cramps'],
    skin: ['Rash', 'Itching', 'Dryness', 'Redness', 'Hives', 'Acne'],
    general: ['Fever', 'Fatigue', 'Chills', 'Sweating', 'Weight Loss', 'Drowsiness']
};

const SymptomChecker = () => {
    const [step, setStep] = useState(1);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [description, setDescription] = useState(''); // New state
    const [result, setResult] = useState(null);

    const handlePartSelect = (partId) => {
        setSelectedPart(partId);
        setStep(2);
    };

    const toggleSymptom = (symptom) => {
        if (selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
        } else {
            setSelectedSymptoms(prev => [...prev, symptom]);
        }
    };

    const analyzeSymptoms = () => {
        setStep(4); // Moved to step 4 because step 3 is now description
        // Mock Analysis Logic

        setTimeout(() => {
            setResult({
                severity: 'Low',
                condition: 'Likely minor issue',
                advice: 'Rest and hydration recommended. If symptoms persist for more than 24 hours, consult a general physician.',
                isEmergency: false
            });
        }, 1500);
    };

    const resetProcess = () => {
        setStep(1);
        setSelectedPart(null);
        setSelectedSymptoms([]);
        setResult(null);
    };

    return (
        <div className="checker-container fade-in">
            <header className="checker-header">
                <h1>Symptom Checker</h1>
                <p>Identify potential health issues in 3 easy steps</p>
            </header>

            <div className="steps-indicator glass-panel">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Select Area</div>
                <div className="divider"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Symptoms</div>
                <div className="divider"></div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Analysis</div>
            </div>

            <div className="checker-content glass-panel">
                {step === 1 && (
                    <div className="step-content fade-in">
                        <h2>Where is the issue located?</h2>
                        <div className="options-grid">
                            {BODY_PARTS.map(part => (
                                <button
                                    key={part.id}
                                    className="option-btn"
                                    onClick={() => handlePartSelect(part.id)}
                                >
                                    {part.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content fade-in">
                        <h2>Select symptoms for {BODY_PARTS.find(p => p.id === selectedPart)?.label}</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Type to search or add..."
                                className="search-input"
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase();
                                    const symptoms = document.querySelectorAll('.option-btn:not(.custom-add-btn)');
                                    symptoms.forEach(btn => {
                                        if (btn.textContent.toLowerCase().includes(val)) {
                                            btn.style.display = 'flex';
                                        } else {
                                            btn.style.display = 'none';
                                        }
                                    });
                                    // Store query in a let for the button to use is tricky in React without state.
                                    // Better to use state for the value. But we are editing a block.
                                    // To keep it simple, we check the input value on button click.
                                }}
                                id="symptom-search-box"
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'white'
                                }}
                            />
                            <button
                                className="primary-btn custom-add-btn"
                                onClick={() => {
                                    const input = document.getElementById('symptom-search-box');
                                    const val = input.value.trim();
                                    if (val && !selectedSymptoms.includes(val)) {
                                        toggleSymptom(val);
                                        input.value = ''; // Clear after adding
                                        // Reset filters
                                        document.querySelectorAll('.option-btn').forEach(btn => btn.style.display = 'flex');
                                    }
                                }}
                                style={{ padding: '0 1.5rem', height: '50px' }}
                            >
                                <Plus size={20} /> Add
                            </button>
                        </div>
                        <div className="options-grid">
                            {SYMPTOMS_DB[selectedPart].map(symptom => (
                                <button
                                    key={symptom}
                                    className={`option-btn ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
                                    onClick={() => toggleSymptom(symptom)}
                                >
                                    {symptom}
                                    {selectedSymptoms.includes(symptom) && <CheckCircle size={16} />}
                                </button>
                            ))}
                        </div>
                        <div className="actions">
                            <button className="secondary-btn" onClick={() => setStep(1)}>Back</button>
                            <button
                                className="primary-btn"
                                disabled={selectedSymptoms.length === 0}
                                onClick={() => setStep(3)}
                            >
                                Next <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content fade-in">
                        <h2>Describe your symptoms</h2>
                        <p className="text-muted">Describing how you feel helps AI provide better accuracy.</p>

                        <textarea
                            className="description-input"
                            placeholder="e.g. Sharp pain in lower back when bending down..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />

                        <div className="actions">
                            <button className="secondary-btn" onClick={() => setStep(2)}>Back</button>
                            <button
                                className="primary-btn"
                                onClick={analyzeSymptoms}
                            >
                                Analyze <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && !result && (
                    <div className="step-content loading fade-in">
                        <Activity className="animate-pulse" size={48} color="var(--accent-primary)" />
                        <h3>Analyzing Symptoms...</h3>
                        <p>Comparing with medical database</p>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="step-content result fade-in">
                        <div className="result-header">
                            <div className={`result-icon ${result.isEmergency ? 'danger' : 'success'}`}>
                                {result.isEmergency ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
                            </div>
                            <div>
                                <h3>Analysis Complete</h3>
                                <p className="severity">Severity: <span className={result.severity.toLowerCase()}>{result.severity}</span></p>
                            </div>
                        </div>

                        <div className="analysis-box">
                            <h4>Possible Condition</h4>
                            <p>{result.condition}</p>
                        </div>

                        <div className="advice-box">
                            <h4>Recommendation</h4>
                            <p>{result.advice}</p>
                        </div>

                        <button className="primary-btn" onClick={resetProcess}>
                            Check Another Symptom
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymptomChecker;
