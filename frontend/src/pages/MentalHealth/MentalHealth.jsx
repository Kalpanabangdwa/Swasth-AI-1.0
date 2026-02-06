import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Heart, Wind, MessageCircle, Play, Pause, Shield, Gamepad2 } from 'lucide-react';
import './MentalHealth.css';

const MOODS = [
    { label: 'Happy', emoji: '😊', color: '#4ade80' },
    { label: 'Calm', emoji: '😌', color: '#60a5fa' },
    { label: 'Anxious', emoji: '😰', color: '#fb923c' },
    { label: 'Sad', emoji: '😔', color: '#94a3b8' },
    { label: 'Stressed', emoji: '😫', color: '#f87171' },
];

const MentalHealth = () => {
    const [selectedMood, setSelectedMood] = useState(null);
    const [isBreathing, setIsBreathing] = useState(false);
    const [breathText, setBreathText] = useState('Ready?');

    // Breathing Animation Variants
    const circleVariants = {
        idle: { scale: 1, opacity: 0.5 },
        inhale: { scale: 1.5, opacity: 0.8, transition: { duration: 4, ease: "easeInOut" } },
        hold: { scale: 1.5, opacity: 1, transition: { duration: 2 } },
        exhale: { scale: 1, opacity: 0.5, transition: { duration: 4, ease: "easeInOut" } },
    };

    const [breathState, setBreathState] = useState('idle');

    useEffect(() => {
        let timer;
        if (isBreathing) {
            const cycle = async () => {
                setBreathState('inhale');
                setBreathText('Inhale...');
                await new Promise(r => setTimeout(r, 4000));

                setBreathState('hold');
                setBreathText('Hold...');
                await new Promise(r => setTimeout(r, 2000));

                setBreathState('exhale');
                setBreathText('Exhale...');
                await new Promise(r => setTimeout(r, 4000));
            };
            cycle();
            timer = setInterval(cycle, 10000); // 4+2+4 = 10s cycle
        } else {
            setBreathState('idle');
            setBreathText('Ready?');
        }
        return () => clearInterval(timer);
    }, [isBreathing]);

    return (
        <div className="mental-health-container fade-in">
            <header className="zen-header">
                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    Mental Wellness Space
                </motion.h1>
                <p>Take a moment to breathe, reflect, and reset.</p>
            </header>

            {/* Mood Tracker */}
            <section className="mood-section">
                <h3>How are you feeling today?</h3>
                <div className="mood-grid">
                    {MOODS.map((mood) => (
                        <motion.button
                            key={mood.label}
                            className={`mood-btn ${selectedMood === mood.label ? 'active' : ''}`}
                            onClick={() => setSelectedMood(mood.label)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="mood-emoji">{mood.emoji}</span>
                            <span className="mood-label">{mood.label}</span>
                        </motion.button>
                    ))}
                </div>
                {selectedMood && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mood-feedback"
                    >
                        Thanks for checking in. Tracking your mood helps explore patterns over time.
                    </motion.p>
                )}
            </section>

            {/* Anxiety Shield Section */}
            <section className="anxiety-shield">
                <div className="shield-header">
                    <h2><Shield className="inline-icon" /> Anxiety Shield</h2>
                    <p>Micro-tools to ground you in the present moment.</p>
                </div>

                <div className="shield-grid">
                    <GroundingWizard />
                    <BubblePopper />
                    <AffirmationCard />
                </div>
            </section>

            {/* Mindful Games Section */}
            <section className="games-section">
                <div className="shield-header">
                    <h2><Gamepad2 className="inline-icon" /> Mindful Arcade</h2>
                    <p>Play to distract. Focus to calm.</p>
                </div>

                <div className="games-grid">
                    <CosmicFlow />
                    <SoundwaveSurfer />
                </div>
            </section>

            <div className="zen-card">
                <h3><Wind className="inline-icon" /> Box Breathing</h3>
                <p>Calm your nervous system with rhythmic breathing.</p>

                <div className="breathing-box">
                    <motion.div
                        className="circle-outer"
                        variants={circleVariants}
                        animate={breathState}
                    />
                    <div className="circle-inner">
                        {isBreathing ? (
                            <Pause size={32} style={{ cursor: 'pointer' }} onClick={() => setIsBreathing(false)} />
                        ) : (
                            <Play size={32} style={{ cursor: 'pointer' }} onClick={() => setIsBreathing(true)} />
                        )}
                    </div>
                </div>
                <div className="breath-instruction">{breathText}</div>
            </div>

            {/* Integration Resources */}
            <div className="zen-card">
                <h3><Heart className="inline-icon" /> Support Resources</h3>
                <div className="resources-list">
                    <div className="resource-item">
                        <div className="res-icon"><Phone size={20} /></div>
                        <div className="res-info">
                            <h4>Emergency Helpline</h4>
                            <p>1-800-273-TALK (Available 24/7)</p>
                        </div>
                    </div>
                    <div className="resource-item">
                        <div className="res-icon"><MessageCircle size={20} /></div>
                        <div className="res-info">
                            <h4>Chat with a Counselor</h4>
                            <p>Instant text support for anxiety.</p>
                        </div>
                    </div>
                    <div className="resource-item" style={{ marginTop: 'auto', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--success)' }}>
                        <div className="res-icon" style={{ background: 'transparent', color: 'var(--success)' }}>
                            <Wind size={20} />
                        </div>
                        <div className="res-info">
                            <h4>Daily Meditation</h4>
                            <p>Start a 5-minute guided session.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Micro-Components */

const GroundingWizard = () => {
    const [started, setStarted] = useState(false);
    const [step, setStep] = useState(0);
    const steps = [
        { count: 5, text: "Things you can SEE", color: "#fca5a5" },
        { count: 4, text: "Things you can TOUCH", color: "#fdba74" },
        { count: 3, text: "Things you can HEAR", color: "#fde047" },
        { count: 2, text: "Things you can SMELL", color: "#86efac" },
        { count: 1, text: "Thing you can TASTE", color: "#93c5fd" },
    ];

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else {
            setStarted(false);
            setStep(0);
        }
    };

    if (!started) {
        return (
            <div className="tool-card grounding-card">
                <h3>5-4-3-2-1 Grounding</h3>
                <div className="wizard-content">
                    <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Use your senses to anchor yourself in the present.</p>
                    <button className="new-quote-btn" onClick={() => setStarted(true)}>Start Exercise</button>
                </div>
            </div>
        );
    }

    return (
        <div className="tool-card grounding-card">
            <h3 style={{ fontSize: '1rem', opacity: 0.7 }}>Grounding...</h3>
            <div className="wizard-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="wizard-step"
                    >
                        <div className="step-number" style={{ color: steps[step].color }}>{steps[step].count}</div>
                        <p>{steps[step].text}</p>
                    </motion.div>
                </AnimatePresence>
                <button className="next-btn" onClick={handleNext}>
                    {step === steps.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    );
};

/* Sound Engine */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playPopSound = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Bubble "Bloop" Sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
};

const playFairySound = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const playNote = (freq, delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + delay + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.8);

        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.8);
    };

    // Magical Major 7th Arpeggio (C#)
    playNote(554.37, 0);    // C#5
    playNote(698.46, 0.1);  // F5
    playNote(830.61, 0.2);  // G#5
    playNote(1108.73, 0.3); // C#6
    playNote(1396.91, 0.4); // F6
};


const BubblePopper = () => {
    const [bubbles, setBubbles] = useState(Array(16).fill(false));

    const popBubble = (idx) => {
        if (bubbles[idx]) return;

        playPopSound();

        const newBubbles = [...bubbles];
        newBubbles[idx] = true;
        setBubbles(newBubbles);

        if (navigator.vibrate) navigator.vibrate(20);

        if (newBubbles.every(b => b)) {
            setTimeout(() => {
                setBubbles(Array(16).fill(false));
                playFairySound(); // Celebrate clearing the board
            }, 800);
        }
    };

    return (
        <div className="tool-card popper-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Pop It!</h3>
                <button
                    onClick={() => setBubbles(Array(16).fill(false))}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                    Reset
                </button>
            </div>
            <div className="bubble-grid">
                {bubbles.map((isPopped, idx) => (
                    <motion.div
                        key={idx}
                        className={`bubble ${isPopped ? 'popped' : ''}`}
                        onClick={() => popBubble(idx)}
                        whileTap={{ scale: 0.7 }}
                        animate={isPopped ? { scale: 0.9 } : { scale: 1 }}
                    />
                ))}
            </div>
        </div>
    );
};

const AffirmationCard = () => {
    const affirmations = [
        "I am safe right now.",
        "This feeling will pass.",
        "I am stronger than my anxiety.",
        "I trust myself.",
        "I breathe in calm, I breathe out stress.",
        "I am enough.",
        "One step at a time.",
    ];
    const [index, setIndex] = useState(0);

    const nextAffirmation = () => {
        playFairySound();
        setIndex((prev) => (prev + 1) % affirmations.length);
    };

    return (
        <div className="tool-card affirmation-card">
            <h3>Instant Calm</h3>
            <div className="affirmation-text">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="quote"
                    >
                        "{affirmations[index]}"
                    </motion.p>
                </AnimatePresence>
            </div>
            <button className="new-quote-btn" onClick={nextAffirmation}>
                Need Strength ✨
            </button>
        </div>
    );
};

const playTwinkleSound = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Random sparkly frequencies
    const freqs = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};

const CosmicFlow = () => {
    const canvasRef = useRef(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Set canvas size
        const resize = () => {
            if (canvas) {
                // Use parent size
                const parent = canvas.parentElement;
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        // Particles
        let particles = [];
        let hue = 0;

        const mouse = { x: undefined, y: undefined };

        const handleMove = (x, y) => {
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(x, y));
            }
            // Continuous sparkling (30% chance per move event = dense audio trail)
            if (Math.random() < 0.3) {
                playTwinkleSound();
            }
        }

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            handleMove(e.clientX - rect.left, e.clientY - rect.top);
        });

        canvas.addEventListener('touchmove', (e) => {
            const rect = canvas.getBoundingClientRect();
            handleMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        });


        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 3 + 1;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 - 1;
                this.color = `hsl(${hue}, 100%, 70%)`;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.1) this.size -= 0.05;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const animate = () => {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // Long trails
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].size <= 0.1) {
                    particles.splice(i, 1);
                    i--;
                }
            }
            hue += 5; // Fast color cycle
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive]);

    return (
        <div className="tool-card game-card" style={{ padding: 0, overflow: 'hidden', background: '#0f172a', position: 'relative', minHeight: '350px' }}>
            {!isActive && (
                <div className="game-overlay">
                    <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Cosmic Flow</h3>
                    <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Touch the void to create stardust.</p>
                    <button className="new-quote-btn" onClick={() => { setIsActive(true); playFairySound(); }}>
                        Enter Void ✨
                    </button>
                </div>
            )}
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
            />
        </div>
    );
};

/* Ocean Sound Engine */
let oceanNode = null;
let oceanGain = null;

const toggleOceanSound = (play) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (play) {
        if (oceanNode) return; // Already playing

        // Create Brown Noise (Rumble)
        const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (0 + (0.1 * white)) / 1.1; // Brown noise approx
            data[i] *= 3.5;
        }

        oceanNode = audioCtx.createBufferSource();
        oceanNode.buffer = buffer;
        oceanNode.loop = true;

        // Filter to make it watery
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        oceanGain = audioCtx.createGain();
        oceanGain.gain.setValueAtTime(0, audioCtx.currentTime);

        oceanNode.connect(filter);
        filter.connect(oceanGain);
        oceanGain.connect(audioCtx.destination);

        oceanNode.start();
    } else {
        if (oceanNode) {
            oceanGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
            setTimeout(() => {
                if (oceanNode) {
                    oceanNode.stop();
                    oceanNode.disconnect();
                    oceanNode = null;
                }
            }, 1000);
        }
    }
};

const SoundwaveSurfer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [phase, setPhase] = useState("Exhale"); // Inhale/Exhale

    // Game Loop
    useEffect(() => {
        let interval;
        if (isPlaying) {
            toggleOceanSound(true);

            // Cycle is 6 seconds (3s In, 3s Out)
            const CYCLE = 6000;

            // Modulate Volume for "Wave" effect
            const waveLoop = () => {
                if (!oceanGain) return;
                const now = audioCtx.currentTime;
                // Swell up (Inhale)
                oceanGain.gain.linearRampToValueAtTime(0.8, now + 3);
                // Swell down (Exhale)
                oceanGain.gain.linearRampToValueAtTime(0.1, now + 6);
            };

            // Initial Start
            waveLoop(); // Immediate
            setPhase("Inhale");

            // Interval
            interval = setInterval(() => {
                waveLoop();
                setPhase("Inhale");
                setTimeout(() => setPhase("Exhale"), 3000);
            }, CYCLE);

        } else {
            toggleOceanSound(false);
            setPhase("Exhale");
        }

        return () => {
            clearInterval(interval);
            toggleOceanSound(false);
        };
    }, [isPlaying]);

    const handleTap = () => {
        if (!isPlaying) return;

        // We want to tap at the "peaks" (Transition points)
        // Since we are using CSS/Framer animation, getting exact sync is tricky without a shared clock.
        // For this "Zen" version, we will just use the visual feedback and play a harmonious sound.

        // Play "Harmonious Bell"
        playFairySound();
        setScore(prev => prev + 1);
        setFeedback("🌊 Flow");
        setTimeout(() => setFeedback(""), 1000);

        // Visual Ripple
    };

    return (
        <div className="tool-card game-card surfer-card"
            style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {!isPlaying ? (
                <div className="game-overlay">
                    <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Soundwave Surfer</h3>
                    <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Sync your breath. Tap with the tide.</p>
                    <button className="new-quote-btn" onClick={() => setIsPlaying(true)}>
                        Start Waves 🌊
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ position: 'absolute', top: 20, left: 20, color: '#94a3b8', zIndex: 10 }}>
                        Sync: {score}
                    </div>

                    <div style={{ position: 'absolute', top: '20%', fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}>
                        {phase}
                    </div>

                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{ position: 'absolute', top: '35%', color: '#60a5fa', fontWeight: 'bold' }}
                            >
                                {feedback}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* The Wave Visualization */}
                    <motion.div
                        className="ocean-wave"
                        animate={{
                            y: phase === "Inhale" ? [100, -50] : [-50, 100],
                            backgroundColor: phase === "Inhale" ? "#3b82f6" : "#1e40af"
                        }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '60%',
                            opacity: 0.4,
                            borderRadius: '50% 50% 0 0',
                            scale: 1.5
                        }}
                    />

                    {/* The Tap Trigger */}
                    <button
                        onClick={handleTap}
                        className="surfer-btn"
                        style={{
                            zIndex: 20,
                            marginTop: 'auto',
                            marginBottom: '2rem',
                            padding: '1rem 3rem',
                            borderRadius: '50px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(5px)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Tap with Wave
                    </button>
                </>
            )}
        </div>
    );
};

export default MentalHealth;
