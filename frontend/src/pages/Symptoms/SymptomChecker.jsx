import React, { useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle, Plus, Search, Thermometer, Clock } from 'lucide-react';
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
    head: ['Headache', 'Fever', 'Sore Throat', 'Runny Nose', 'Earache', 'Dizziness', 'Stiff Neck', 'Blurred Vision'],
    chest: ['Chest Pain', 'Shortness of Breath', 'Palpitations', 'Cough', 'Wheezing'],
    stomach: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal Pain', 'Bloating', 'Loss of Appetite'],
    limbs: ['Joint Pain', 'Muscle Weakness', 'Swelling', 'Numbness', 'Cramps'],
    skin: ['Rash', 'Itching', 'Hives', 'Bruising', 'Skin Discoloration'],
    general: ['Fatigue', 'Weight Loss', 'Night Sweats', 'Chills', 'Body Ache']
};

const DISEASES_DB = [
    { name: 'Common Cold', related: ['Runny Nose', 'Sore Throat', 'Headache', 'Fever', 'Cough', 'Body Ache', 'Fatigue'], advice: 'Rest and hydration. Use OTC pain relievers.', severity_threshold: 4, isEmergency: false },
    { name: 'Influenza (Flu)', related: ['Fever', 'Body Ache', 'Headache', 'Fatigue', 'Cough', 'Chills', 'Sore Throat'], advice: 'Get plenty of rest and drink fluids. Take paracetamol for fever.', severity_threshold: 5, isEmergency: false },
    { name: 'Dengue Fever', related: ['Fever', 'Headache', 'Joint Pain', 'Body Ache', 'Rash', 'Fatigue', 'Nausea', 'Vomiting'], advice: 'Avoid ibuprofen. Stay hydrated. Monitor platelet counts with a doctor.', severity_threshold: 6, isEmergency: true },
    { name: 'Malaria', related: ['Fever', 'Chills', 'Headache', 'Fatigue', 'Nausea', 'Vomiting', 'Body Ache', 'Night Sweats'], advice: 'See a doctor immediately for a blood test and antimalarial medication.', severity_threshold: 6, isEmergency: true },
    { name: 'Typhoid Fever', related: ['Fever', 'Abdominal Pain', 'Fatigue', 'Loss of Appetite', 'Headache', 'Diarrhea', 'Constipation', 'Nausea'], advice: 'Drink boiled water, eat easily digestible food, and see a doctor for antibiotics.', severity_threshold: 5, isEmergency: true },
    { name: 'Chickenpox', related: ['Rash', 'Itching', 'Fever', 'Fatigue', 'Loss of Appetite', 'Headache'], advice: 'Apply calamine lotion to soothe itching and take cool baths.', severity_threshold: 4, isEmergency: false },
    { name: 'Bronchitis', related: ['Cough', 'Chest Pain', 'Shortness of Breath', 'Fatigue', 'Fever', 'Wheezing'], advice: 'Inhale steam and drink warm fluids. Avoid smoke.', severity_threshold: 5, isEmergency: false },
    { name: 'Asthma Attack', related: ['Wheezing', 'Shortness of Breath', 'Chest Pain', 'Cough', 'Fatigue'], advice: 'Sit upright and use your rescue inhaler. Seek immediate help if it doesn’t improve.', severity_threshold: 7, isEmergency: true },
    { name: 'Pneumonia', related: ['Fever', 'Cough', 'Shortness of Breath', 'Chest Pain', 'Fatigue', 'Chills'], advice: 'Requires urgent medical evaluation and possibly antibiotics.', severity_threshold: 6, isEmergency: true },
    { name: 'Angina / Heart Attack', related: ['Chest Pain', 'Shortness of Breath', 'Fatigue', 'Dizziness', 'Palpitations', 'Nausea'], advice: 'Stop all activity. Seek emergency medical attention immediately.', severity_threshold: 8, isEmergency: true },
    { name: 'Cardiac Arrhythmia', related: ['Palpitations', 'Chest Pain', 'Dizziness', 'Shortness of Breath', 'Fatigue'], advice: 'Sit comfortably and try to relax. See a cardiologist if this persists.', severity_threshold: 6, isEmergency: false },
    { name: 'Gastroenteritis (Food Poisoning)', related: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal Pain', 'Fever', 'Fatigue', 'Loss of Appetite'], advice: 'Rehydrate heavily with ORS. Stick to a bland diet.', severity_threshold: 5, isEmergency: false },
    { name: 'Acid Reflux (GERD)', related: ['Abdominal Pain', 'Nausea', 'Bloating', 'Chest Pain', 'Loss of Appetite'], advice: 'Avoid lying down after eating. Eat smaller, non-spicy meals.', severity_threshold: 4, isEmergency: false },
    { name: 'Irritable Bowel Syndrome', related: ['Abdominal Pain', 'Bloating', 'Diarrhea', 'Constipation', 'Nausea', 'Fatigue'], advice: 'Track diet triggers and manage stress. See a doctor for long-term management.', severity_threshold: 5, isEmergency: false },
    { name: 'Migraine', related: ['Headache', 'Blurred Vision', 'Nausea', 'Vomiting', 'Dizziness', 'Fatigue'], advice: 'Rest in a quiet, dark room. Apply cold compresses to the head.', severity_threshold: 7, isEmergency: false },
    { name: 'Tension Headache', related: ['Headache', 'Stiff Neck', 'Fatigue', 'Dizziness'], advice: 'Perform neck stretches, correct posture, and try gentle massage.', severity_threshold: 4, isEmergency: false },
    { name: 'Rheumatoid Arthritis', related: ['Joint Pain', 'Swelling', 'Fatigue', 'Stiff Neck', 'Muscle Weakness', 'Fever'], advice: 'Apply warm/cold compresses. Consult a rheumatologist.', severity_threshold: 6, isEmergency: false },
    { name: 'Muscle Strain', related: ['Joint Pain', 'Muscle Weakness', 'Swelling', 'Cramps', 'Numbness'], advice: 'Apply ice and elevate the area. Discontinue physical activity.', severity_threshold: 5, isEmergency: false },
    { name: 'Allergic Reaction', related: ['Rash', 'Itching', 'Hives', 'Swelling', 'Shortness of Breath', 'Fever'], advice: 'Take antihistamines immediately. If breathing is restricted, call emergency services.', severity_threshold: 6, isEmergency: true },
    { name: 'Eczema / Dermatitis', related: ['Rash', 'Itching', 'Skin Discoloration', 'Hives', 'Swelling'], advice: 'Moisturize skin continuously. Avoid harsh irritants and strong soaps.', severity_threshold: 4, isEmergency: false },
    { name: 'Anemia', related: ['Fatigue', 'Dizziness', 'Shortness of Breath', 'Palpitations', 'Muscle Weakness', 'Skin Discoloration'], advice: 'Increase iron intake in your diet and consult a doctor for a blood test.', severity_threshold: 4, isEmergency: false },
    { name: 'Diabetes (Uncontrolled)', related: ['Weight Loss', 'Fatigue', 'Blurred Vision', 'Numbness', 'Nausea'], advice: 'Consult an endocrinologist immediately to check blood sugar levels.', severity_threshold: 6, isEmergency: true },
    { name: 'Hypothyroidism', related: ['Fatigue', 'Weight Loss', 'Constipation', 'Muscle Weakness', 'Joint Pain', 'Dryness'], advice: 'Consult a doctor for a thyroid panel blood test.', severity_threshold: 4, isEmergency: false },
    { name: 'Sinusitis', related: ['Headache', 'Runny Nose', 'Fever', 'Fatigue', 'Sore Throat', 'Earache'], advice: 'Use saline nasal drops and steam inhalation. Consult a doctor if it lasts over a week.', severity_threshold: 4, isEmergency: false },
    { name: 'Gout', related: ['Joint Pain', 'Swelling', 'Redness', 'Fever'], advice: 'Elevate the joint, avoid high-purine foods, and drink plenty of water.', severity_threshold: 6, isEmergency: false },
    { name: 'Kidney Stones', related: ['Abdominal Pain', 'Nausea', 'Vomiting', 'Fever', 'Chills'], advice: 'Drink excessive water. Seek medical care for severe pain or inability to pass urine.', severity_threshold: 8, isEmergency: true },
    { name: 'Appendicitis', related: ['Abdominal Pain', 'Nausea', 'Vomiting', 'Fever', 'Loss of Appetite'], advice: 'Go to the emergency room immediately. This requires urgent surgical evaluation.', severity_threshold: 7, isEmergency: true },
    { name: 'Tuberculosis (TB)', related: ['Cough', 'Weight Loss', 'Night Sweats', 'Fever', 'Fatigue', 'Chest Pain'], advice: 'Requires urgent medical diagnosis and a long course of antibiotics.', severity_threshold: 6, isEmergency: true },
    { name: 'Hepatitis', related: ['Fatigue', 'Nausea', 'Vomiting', 'Abdominal Pain', 'Loss of Appetite', 'Fever', 'Joint Pain', 'Skin Discoloration'], advice: 'Seek a liver function test and medical advice immediately.', severity_threshold: 6, isEmergency: true },
    { name: 'Meningitis', related: ['Headache', 'Fever', 'Stiff Neck', 'Nausea', 'Vomiting', 'Dizziness'], advice: 'Seek emergency medical attention immediately. Highly dangerous.', severity_threshold: 8, isEmergency: true }
];

const SymptomChecker = () => {
    const [step, setStep] = useState(1);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState(5);
    const [searchQuery, setSearchQuery] = useState('');
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
        setStep(5);
        
        setTimeout(() => {
            let bestMatch = null;
            let highestScore = -1;

            if (selectedSymptoms.length === 0) {
                setResult({
                    severity: 'None',
                    condition: 'No clear diagnosis',
                    advice: 'Please select symptoms to get a diagnosis.',
                    confidence: 0,
                    isEmergency: false
                });
                return;
            }

            DISEASES_DB.forEach(disease => {
                let matchCount = 0;
                disease.related.forEach(dsym => {
                    if (selectedSymptoms.includes(dsym)) matchCount++;
                });

                // Calculate a base score
                let score = (matchCount / Math.max(selectedSymptoms.length, 1)) * 50;
                score += (matchCount / disease.related.length) * 50;

                // Adjust based on severity correlation
                let severityDiff = Math.abs(disease.severity_threshold - severity);
                score -= severityDiff * 5; 

                // Adjust based on duration
                if (disease.isEmergency && (duration === '1 - 3 days' || duration === '1 week' || duration === 'More than 1 week')) {
                     if (severity > 6) score += 10;
                }

                if (score > highestScore && matchCount > 0) {
                    highestScore = score;
                    bestMatch = disease;
                }
            });

            if (!bestMatch || highestScore < 20) {
                setResult({
                    severity: severity <= 3 ? 'Mild' : severity <= 7 ? 'Moderate' : 'Severe',
                    condition: 'Unclear Condition',
                    advice: 'Your symptoms do not clearly match our database. Please consult a doctor for a proper diagnosis.',
                    confidence: Math.max(10, Math.min(Math.round(highestScore), 45)),
                    isEmergency: severity > 8
                });
                return;
            }

            let finalConfidence = Math.min(98, Math.max(45, Math.round(highestScore)));
            let isEmerg = bestMatch.isEmergency || severity >= 9;

            setResult({
                severity: severity <= 3 ? 'Mild' : severity <= 7 ? 'Moderate' : 'Severe',
                condition: bestMatch.name,
                advice: bestMatch.advice,
                confidence: finalConfidence,
                isEmergency: isEmerg
            });
        }, 1500);
    };

    const resetProcess = () => {
        setStep(1);
        setSelectedPart(null);
        setSelectedSymptoms([]);
        setDuration('');
        setSeverity(5);
        setSearchQuery('');
        setResult(null);
    };

    return (
        <div className="checker-container fade-in">
            <header className="checker-header">
                <h1>Symptom Checker</h1>
                <p>Identify potential health issues in 3 easy steps</p>
            </header>

            <div className="steps-indicator glass-panel">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                    <span className="step-num">1</span>
                    <span className="step-text">Symptoms</span>
                </div>
                <div className="divider"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                    <span className="step-num">2</span>
                    <span className="step-text">Duration</span>
                </div>
                <div className="divider"></div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                    <span className="step-num">3</span>
                    <span className="step-text">Severity</span>
                </div>
                <div className="divider"></div>
                <div className={`step ${step >= 4 ? 'active' : ''}`}>
                    <span className="step-num">4</span>
                    <span className="step-text">Analysis</span>
                </div>
            </div>

            <div className="checker-content glass-panel">
                {step === 1 && (
                    <div className="step-content fade-in">
                        <div className="step-header">
                            <h2>What symptoms are you experiencing?</h2>
                            <p className="text-muted">Select all that apply.</p>
                        </div>

                        <div className="search-container">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search symptoms (e.g., headache, fever)..."
                                className="symptom-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="symptoms-layout">
                            {/* Body Parts Sidebar */}
                            <div className="body-parts-sidebar">
                                {BODY_PARTS.map(part => (
                                    <button
                                        key={part.id}
                                        className={`part-btn ${selectedPart === part.id ? 'active' : ''}`}
                                        onClick={() => setSelectedPart(part.id)}
                                    >
                                        {part.label}
                                    </button>
                                ))}
                            </div>

                            {/* Symptoms Grid */}
                            <div className="symptoms-selection-area">
                                {selectedPart ? (
                                    <div className="options-grid compact">
                                        {SYMPTOMS_DB[selectedPart]
                                            .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(symptom => (
                                                <button
                                                    key={symptom}
                                                    className={`option-btn symptom-btn ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
                                                    onClick={() => toggleSymptom(symptom)}
                                                >
                                                    <span>{symptom}</span>
                                                    {selectedSymptoms.includes(symptom) && <CheckCircle size={16} className="text-success" />}
                                                </button>
                                            ))}
                                        {searchQuery && !SYMPTOMS_DB[selectedPart].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) && (
                                            <div className="no-symptoms">
                                                No symptoms found matching "{searchQuery}"
                                            </div>
                                        )}
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
                            <button
                                className="primary-btn"
                                disabled={selectedSymptoms.length === 0}
                                onClick={() => setStep(2)}
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content fade-in">
                        <div className="step-header">
                            <h2>How long have you had these symptoms?</h2>
                            <p className="text-muted">Understanding duration helps rule out certain conditions.</p>
                        </div>

                        <div className="duration-options">
                            {['Less than 1 day', '1 - 3 days', '1 week', 'More than 1 week'].map(d => (
                                <button
                                    key={d}
                                    className={`duration-btn ${duration === d ? 'active' : ''}`}
                                    onClick={() => setDuration(d)}
                                >
                                    <Clock size={24} className="duration-icon" />
                                    <span>{d}</span>
                                    {duration === d && <CheckCircle size={18} className="check-icon" />}
                                </button>
                            ))}
                        </div>

                        <div className="actions">
                            <button className="secondary-btn" onClick={() => setStep(1)}>Back</button>
                            <button
                                className="primary-btn"
                                disabled={!duration}
                                onClick={() => setStep(3)}
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content fade-in">
                        <div className="step-header">
                            <h2>How severe are your symptoms?</h2>
                            <p className="text-muted">On a scale of 1 to 10, how much discomfort are you in?</p>
                        </div>

                        <div className="severity-container">
                            <div className="severity-display">
                                <Thermometer size={48} className={`severity-icon level-${Math.ceil(severity / 3)}`} />
                                <span className="severity-value">{severity} / 10</span>
                                <span className="severity-label">
                                    {severity <= 3 ? 'Mild Discomfort' : severity <= 7 ? 'Moderate Pain' : 'Severe / Intolerable'}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={severity}
                                onChange={(e) => setSeverity(parseInt(e.target.value))}
                                className={`severity-slider level-${Math.ceil(severity / 3)}`}
                            />

                            <div className="slider-labels">
                                <span>Mild</span>
                                <span>Moderate</span>
                                <span>Severe</span>
                            </div>
                        </div>

                        <div className="actions">
                            <button className="secondary-btn" onClick={() => setStep(2)}>Back</button>
                            <button
                                className="primary-btn analyze-btn"
                                onClick={analyzeSymptoms}
                            >
                                Analyze Symptoms <Activity size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-content loading fade-in">
                        <Activity className="animate-pulse" size={64} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analyzing Symptoms...</h3>
                        <p className="text-muted">Cross-referencing medical database and evaluating severity.</p>
                        <div className="loading-bar">
                            <div className="loading-progress"></div>
                        </div>
                    </div>
                )}

                {step === 5 && result && (
                    <div className="step-content result fade-in">
                        <div className="result-header">
                            <div className={`result-icon ${result.isEmergency ? 'danger' : 'success'}`}>
                                {result.isEmergency ? <AlertTriangle size={36} /> : <CheckCircle size={36} />}
                            </div>
                            <div className="result-title">
                                <h3>Diagnosis Analysis</h3>
                                <div className="result-badges">
                                    <span className={`severity-badge ${result.severity.toLowerCase()}`}>
                                        Severity: {result.severity}
                                    </span>
                                    <span className="confidence-badge">
                                        {result.confidence}% Confidence
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="result-grid">
                            <div className="analysis-box condition-box glass-panel">
                                <h4>Possible Condition</h4>
                                <h2>{result.condition}</h2>
                            </div>

                            <div className="advice-box glass-panel">
                                <h4>Recommended Action & Self Care</h4>
                                <p>{result.advice}</p>
                                {result.isEmergency && (
                                    <div className="emergency-warning">
                                        <AlertTriangle size={20} />
                                        <span>Please seek immediate medical attention.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="actions right mt-4">
                            <button className="secondary-btn" onClick={resetProcess}>
                                Start New Check
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymptomChecker;
