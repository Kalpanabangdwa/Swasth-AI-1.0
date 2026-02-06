import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, Heart, Timer, Sparkles, ChevronLeft, ChevronRight, Footprints } from 'lucide-react';
import './Maternity.css';

const BABY_SIZES = [
    { week: 4, fruit: '🫐', label: 'Poppy Seed', desc: 'Tiny but mighty!' },
    { week: 8, fruit: '🍇', label: 'Raspberry', desc: 'Developing quickly.' },
    { week: 12, fruit: '🍋', label: 'Lime', desc: 'Little fingers forming.' },
    { week: 16, fruit: '🥑', label: 'Avocado', desc: 'Hearing your voice.' },
    { week: 20, fruit: '🍌', label: 'Banana', desc: 'Halfway there!' },
    { week: 24, fruit: '🌽', label: 'Corn', desc: 'Practicing breathing.' },
    { week: 28, fruit: '🍆', label: 'Eggplant', desc: 'Opening eyes.' },
    { week: 32, fruit: '🥥', label: 'Coconut', desc: 'Getting chubby.' },
    { week: 36, fruit: '🥬', label: 'Kale', desc: 'Almost ready.' },
    { week: 40, fruit: '🍉', label: 'Watermelon', desc: 'Welcome to the world!' },
];

const MOM_AFFIRMATIONS = [
    "My body is creating a miracle.",
    "I trust my instincts.",
    "I am strong, capable, and loved.",
    "Every kick is a hello.",
    "Rest is productive.",
    "I am the best mother for my baby.",
];

const Maternity = () => {
    // Growth State
    const [week, setWeek] = useState(20);
    const currentSize = BABY_SIZES.reduce((prev, curr) =>
        (Math.abs(curr.week - week) < Math.abs(prev.week - week) ? curr : prev)
    );

    // Kick Counter State
    const [kicks, setKicks] = useState(0);
    const [lastKick, setLastKick] = useState(null);

    // Affirmation State
    const [quoteIndex, setQuoteIndex] = useState(0);

    // Contraction Timer State
    const [showTimer, setShowTimer] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [activeDuration, setActiveDuration] = useState(0);
    const [contractionLog, setContractionLog] = useState([]);
    const [startTimeRef, setStartTimeRef] = useState(null); // Timestamp of when contraction started

    React.useEffect(() => {
        let interval;
        if (isTracking) {
            interval = setInterval(() => {
                setActiveDuration(prev => prev + 1);
            }, 1000);
        } else {
            setActiveDuration(0);
        }
        return () => clearInterval(interval);
    }, [isTracking]);

    const toggleTimer = () => {
        if (!isTracking) {
            // Start
            setIsTracking(true);
            setStartTimeRef(Date.now());
        } else {
            // Stop
            setIsTracking(false);
            const endTime = Date.now();
            const duration = Math.floor((endTime - startTimeRef) / 1000);
            const nowStr = new Date(startTimeRef).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Calculate frequency (Time since LAST start)
            let freq = null;
            if (contractionLog.length > 0) {
                const lastStart = contractionLog[0].rawTime; // Assuming we store rawTime
                const diffMins = Math.floor((startTimeRef - lastStart) / 60000);
                freq = `${diffMins}m`;
            }

            setContractionLog(prev => [{
                startTime: nowStr,
                duration: duration,
                freq: freq,
                rawTime: startTimeRef
            }, ...prev]);
        }
    };

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleKick = () => {
        setKicks(prev => prev + 1);
        setLastKick(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <div className="maternity-container">
            <header className="maternity-header">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Heart className="inline-icon" style={{ color: '#db2777', marginRight: '0.5rem' }} />
                    Maternity Space
                </motion.h1>
                <p>Nurturing you, while you nurture them.</p>
            </header>

            <div className="maternity-grid">
                {/* 1. Baby Growth Viz */}
                <motion.div
                    className="mom-card growth-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3><Baby size={24} /> Baby Growth</h3>
                    <div className="growth-viz">
                        <div className="week-selector">
                            <button className="week-btn" onClick={() => setWeek(w => Math.max(4, w - 1))}>
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#831843' }}>Week {week}</span>
                            <button className="week-btn" onClick={() => setWeek(w => Math.min(40, w + 1))}>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSize.week}
                                className="fruit-display"
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 20 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {currentSize.fruit}
                            </motion.div>
                        </AnimatePresence>

                        <div className="fruit-label">Size of a {currentSize.label}</div>
                        <p style={{ color: '#9d174d', marginTop: '0.5rem' }}>{currentSize.desc}</p>
                    </div>
                </motion.div>

                {/* 2. Kick Counter */}
                <motion.div
                    className="mom-card kick-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3><Footprints size={24} /> Kick Counter</h3>
                    <div className="kick-display">
                        <div style={{ fontSize: '0.9rem', color: '#9d174d', marginBottom: '0.5rem' }}>TODAY'S KICKS</div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={kicks}
                                className="kick-count"
                                initial={{ scale: 1.5, color: '#fbcfe8' }}
                                animate={{ scale: 1, color: '#be185d' }}
                            >
                                {kicks}
                            </motion.div>
                        </AnimatePresence>
                        {lastKick && <div style={{ fontSize: '0.8rem', color: '#db2777', marginTop: '0.5rem' }}>Last kick at {lastKick}</div>}
                    </div>
                    <button className="kick-btn" onClick={handleKick}>
                        <Footprints size={20} /> Log a Kick
                    </button>
                    <button
                        style={{ background: 'none', border: 'none', color: '#db2777', fontSize: '0.8rem', width: '100%', marginTop: '1rem', cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => { setKicks(0); setLastKick(null); }}
                    >
                        Reset Counter
                    </button>
                </motion.div>

                {/* 3. Empathy Corner */}
                <motion.div
                    className="mom-card empathy-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3><Sparkles size={24} /> For You, Mama</h3>
                    <div className="mom-quote">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={quoteIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                "{MOM_AFFIRMATIONS[quoteIndex]}"
                            </motion.p>
                        </AnimatePresence>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <button className="gentle-btn" onClick={() => setQuoteIndex(i => (i + 1) % MOM_AFFIRMATIONS.length)}>
                            New Affirmation
                        </button>
                    </div>
                </motion.div>

                {/* 4. Contraction Timer Stub */}
                <motion.div
                    className="mom-card timer-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3><Timer size={24} /> Contraction Timer</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Track frequency and duration when the time comes.</p>
                    <button className="gentle-btn" style={{ width: '100%' }} onClick={() => setShowTimer(true)}>
                        Open Timer
                    </button>
                </motion.div>
            </div>

            {/* Contraction Timer Modal */}

            {/* Contraction Timer Modal */}
            <AnimatePresence>
                {showTimer && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="timer-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="timer-header">
                                <h2><Timer className="inline-icon" /> Contraction Timer</h2>
                                <button className="close-btn" onClick={() => setShowTimer(false)}>Close</button>
                            </div>

                            <div className="timer-display">
                                <div className="time-circle" style={{ borderColor: isTracking ? '#ef4444' : '#f472b6' }}>
                                    {formatTime(activeDuration)}
                                </div>
                                <p style={{ color: '#fbcfe8', marginTop: '1rem' }}>
                                    {isTracking ? 'Contraction in progress...' : 'Ready to track'}
                                </p>
                            </div>

                            <button
                                className={`main-action-btn ${isTracking ? 'stop-btn' : 'start-btn'}`}
                                onClick={toggleTimer}
                            >
                                {isTracking ? 'Stop Contraction' : 'Start Contraction'}
                            </button>

                            <div className="history-log">
                                <h4>Last 5 Contractions</h4>
                                {contractionLog.length === 0 ? (
                                    <p className="no-data">No logs yet.</p>
                                ) : (
                                    <ul className="log-list">
                                        {contractionLog.slice(0, 5).map((log, i) => (
                                            <li key={i} className="log-item">
                                                <span>{log.startTime}</span>
                                                <span className="duration-pill">{log.duration}s</span>
                                                <span className="freq-pill">{log.freq ? `Freq: ${log.freq}` : '-'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {contractionLog.length > 0 && (
                                    <button className="clear-link" onClick={() => setContractionLog([])}>Clear History</button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Maternity;
