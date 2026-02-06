import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, ShieldCheck, FileText, Utensils, HeartPulse, Brain, Stethoscope } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './Login.css';

// Import Assets
import TestTubeImg from '../../assets/test_tube.jpg';
import BrainScanImg from '../../assets/brain_scan.jpg';
import AbstractWavesImg from '../../assets/abstract_waves.jpg';

const Login = () => {
    const [name, setName] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            login({ name: name, email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com` });
            navigate('/');
        }
    };

    // Scroll Animation Logic Removed for Stability
    // const observerRef = useRef(null);
    // useEffect(() => {
    //     const sections = document.querySelectorAll('.reveal-section');

    //     observerRef.current = new IntersectionObserver((entries) => {
    //         entries.forEach(entry => {
    //             if (entry.isIntersecting) {
    //                 entry.target.classList.add('visible');
    //             }
    //         });
    //     }, { threshold: 0.1 }); // Lower threshold

    //     sections.forEach(sec => observerRef.current.observe(sec));

    //     // Safety Fallback: Force visible after 1s if something goes wrong
    //     const safetyTimeout = setTimeout(() => {
    //         sections.forEach(sec => sec.classList.add('visible'));
    //     }, 1000);

    //     return () => {
    //         if (observerRef.current) observerRef.current.disconnect();
    //         clearTimeout(safetyTimeout);
    //     }
    // }, []);

    return (
        <div className="landing-container">
            {/* Header / Nav */}
            <header className="landing-header glass-panel">
                <div className="logo-section">
                    <Activity size={32} className="logo-icon-sm" />
                    <h2>Swasth AI</h2>
                </div>

                {/* Login Widget (Top Right) */}
                <div className="header-login">
                    <form onSubmit={handleSubmit} className="compact-login-form">
                        <input
                            type="text"
                            placeholder="Enter Name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-btn-sm">
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </header>

            {/* Main Content */}
            <main className="landing-content-scroll">

                {/* Section 1: Hero (Image Right) */}
                <section className="landing-section hero-section reveal-section">
                    <div className="text-half">
                        <span className="badge">Next-Gen Healthcare</span>
                        <h1>Your Health,<br /><span>Illuminated by AI.</span></h1>
                        <p className="hero-sub">
                            The comprehensive health companion that travels with you.
                            From early disease detection to personalized diet plans.
                        </p>
                        <button className="cta-btn" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                            Explore Features
                        </button>
                    </div>
                    <div className="visual-half">
                        <div className="half-image-right">
                            <img src={BrainScanImg} alt="AI Brain Scan" />
                        </div>
                    </div>
                </section>

                {/* Section 2: Features (Image Left) */}
                <section id="features" className="landing-section features-section-zigzag reveal-section">
                    <div className="visual-half">
                        <div className="half-image-left">
                            <img src={AbstractWavesImg} alt="Abstract AI Waves" />
                        </div>
                    </div>
                    <div className="text-half">
                        <h2>Holistic Health Services</h2>
                        <p className="section-sub">Everything you need for a healthier life, in one place.</p>

                        <div className="features-showcase-grid-compact">
                            <div className="feature-row">
                                <div className="icon-box-sm"><Stethoscope size={20} /></div>
                                <div><strong>Early Detection</strong><br /><span className="text-muted-sm">AI Symptom Analysis</span></div>
                            </div>
                            <div className="feature-row">
                                <div className="icon-box-sm"><Brain size={20} /></div>
                                <div><strong>Mental Wellness</strong><br /><span className="text-muted-sm">24/7 Empathetic Support</span></div>
                            </div>
                            <div className="feature-row">
                                <div className="icon-box-sm"><Utensils size={20} /></div>
                                <div><strong>Smart Diet</strong><br /><span className="text-muted-sm">Personalized Nutrition</span></div>
                            </div>
                            <div className="feature-row">
                                <div className="icon-box-sm"><ShieldCheck size={20} /></div>
                                <div><strong>Maternity Care</strong><br /><span className="text-muted-sm">Mother & Child Health</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Tech/Mission (Image Right) */}
                <section className="landing-section mission-section reveal-section">
                    <div className="text-half">
                        <h2>Powered by Advanced Science</h2>
                        <p className="hero-sub">
                            We combine cutting-edge medical research with state-of-the-art Machine Learning
                            to provide accurate, timely, and life-saving insights from your medical reports.
                        </p>
                        <div className="stats-row">
                            <div className="stat">
                                <h3>99%</h3>
                                <span>Accuracy</span>
                            </div>
                            <div className="stat">
                                <h3>24/7</h3>
                                <span>Availability</span>
                            </div>
                        </div>
                    </div>
                    <div className="visual-half">
                        <div className="half-image-right">
                            <img src={TestTubeImg} alt="Medical Research" />
                        </div>
                    </div>
                </section>

                <footer className="landing-footer">
                    <p>© 2026 Swasth AI. All rights reserved.</p>
                </footer>

            </main>
        </div>
    );
};

export default Login;
