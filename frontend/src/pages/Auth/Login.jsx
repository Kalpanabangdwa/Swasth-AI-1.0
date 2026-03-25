import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Iridescence from '../../components/Iridescence/Iridescence';
import ScrollStack, { ScrollStackItem } from '../../components/ScrollStack/ScrollStack';
import SplitText from '../../components/SplitText/SplitText';

/* ── Styles (identical to original) ── */
const LandingStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#05100d;--s1:#081a14;--s2:#0c2219;--card:#0f2a1f;--border:rgba(0,220,130,.13);--border2:rgba(0,220,130,.22);--accent:#00dc82;--accent-dim:#00b368;--glow:rgba(0,220,130,.18);--text:#edf7f2;--sub:#7aad92;--muted:#3d6b52;--ff:'Outfit',sans-serif;--fs:'Crimson Pro',serif}
    .landing-root{background:var(--bg);color:var(--text);font-family:var(--ff);min-height:100vh;overflow-x:hidden}
    .landing-root *{box-sizing:border-box}
    html:has(.landing-root){scroll-behavior:smooth}
    .landing-root ::-webkit-scrollbar{width:3px}
    .landing-root ::-webkit-scrollbar-track{background:var(--bg)}
    .landing-root ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes shimText{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes drift{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(30px,-25px) scale(1.04)}70%{transform:translate(-18px,18px) scale(.97)}}
    @keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes slideUp{from{opacity:0;transform:translateY(40px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes overlayShow{from{opacity:0}to{opacity:1}}
    @keyframes navIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    .landing-root .fu{animation:fadeUp .65s cubic-bezier(.22,1,.36,1) both}
    .landing-root .fi{animation:fadeIn .5s ease both}
    .landing-root .d1{animation-delay:.08s}.landing-root .d2{animation-delay:.18s}.landing-root .d3{animation-delay:.3s}.landing-root .d4{animation-delay:.44s}.landing-root .d5{animation-delay:.6s}
    .landing-root .nav{position:fixed;top:0;left:0;right:0;z-index:90;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(5,16,13,.82);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);animation:navIn .5s ease both}
    .landing-root .nav-logo{display:flex;align-items:center;gap:9px;cursor:pointer;text-decoration:none;color:inherit}
    .landing-root .nav-logo-icon{color:var(--accent);display:flex}
    .landing-root .nav-logo-text{font-size:1.1rem;font-weight:700;color:var(--text)}
    .landing-root .nav-right{display:flex;align-items:center;gap:10px}
    .landing-root .nav-sign-btn{background:transparent;border:1px solid var(--border2);border-radius:8px;padding:7px 18px;font-family:var(--ff);font-size:.82rem;font-weight:600;color:var(--text);cursor:pointer;transition:background .2s,border-color .2s}
    .landing-root .nav-sign-btn:hover{background:rgba(0,220,130,.08);border-color:var(--accent)}
    .landing-root .nav-login-btn{background:var(--accent);color:#03120d;border:none;border-radius:8px;padding:8px 20px;font-family:var(--ff);font-size:.83rem;font-weight:700;cursor:pointer;box-shadow:0 2px 18px rgba(0,220,130,.28);transition:transform .15s,box-shadow .2s}
    .landing-root .nav-login-btn:hover{transform:translateY(-1px);box-shadow:0 4px 28px rgba(0,220,130,.45)}
    .landing-root .modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(2,9,7,.72);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px;animation:overlayShow .3s ease both}
    .landing-root .modal-overlay.out{animation:overlayShow .25s ease reverse both;pointer-events:none}
    .landing-root .modal{background:var(--s1);border:1px solid var(--border2);border-radius:20px;width:min(460px,100%);padding:40px 36px 36px;box-shadow:0 32px 80px rgba(0,0,0,.7);animation:slideUp .45s cubic-bezier(.22,1,.36,1) both;position:relative;max-height:90vh;overflow-y:auto}
    .landing-root .modal-close{position:absolute;top:16px;right:16px;background:rgba(0,220,130,.06);border:1px solid var(--border);border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--sub);cursor:pointer;font-size:1rem;transition:background .2s,color .2s}
    .landing-root .modal-close:hover{background:rgba(0,220,130,.12);color:var(--text)}
    .landing-root .modal-logo{display:flex;align-items:center;gap:8px;margin-bottom:24px}
    .landing-root .modal-logo svg{color:var(--accent)}
    .landing-root .modal-logo span{font-size:1rem;font-weight:700}
    .landing-root .modal-tabs{display:flex;background:rgba(0,0,0,.25);border-radius:9px;padding:3px;margin-bottom:24px;border:1px solid var(--border)}
    .landing-root .mtab{flex:1;padding:8px;border:none;border-radius:7px;font-family:var(--ff);font-size:.8rem;font-weight:700;cursor:pointer;transition:all .2s;background:transparent;color:var(--muted)}
    .landing-root .mtab.active{background:var(--accent);color:#03120d}
    .landing-root .modal-title{font-size:1.35rem;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
    .landing-root .modal-sub{font-size:.82rem;color:var(--sub);margin-bottom:22px;line-height:1.5}
    .landing-root .m-err{background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.22);border-radius:8px;padding:9px 13px;font-size:.8rem;color:#ff9090;margin-bottom:14px}
    .landing-root .m-success{background:rgba(0,220,130,.08);border:1px solid rgba(0,220,130,.22);border-radius:8px;padding:9px 13px;font-size:.8rem;color:#00dc82;margin-bottom:14px}
    .landing-root .mfg{margin-bottom:14px}
    .landing-root .mfl{display:block;font-size:.72rem;font-weight:700;color:var(--sub);letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px}
    .landing-root .mfi{width:100%;background:rgba(0,0,0,.28);border:1px solid var(--border);border-radius:9px;padding:11px 14px;color:var(--text);font-family:var(--ff);font-size:.88rem;outline:none;transition:border-color .2s,box-shadow .2s}
    .landing-root .mfi::placeholder{color:var(--muted)}
    .landing-root .mfi:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,220,130,.1)}
    .landing-root .mfi:disabled{opacity:.5;cursor:not-allowed}
    .landing-root select.mfi option{background:var(--s1);color:var(--text)}
    .landing-root .pw-row{position:relative}
    .landing-root .pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;display:flex;align-items:center;padding:0;transition:color .2s}
    .landing-root .pw-eye:hover{color:var(--accent)}
    .landing-root .modal-submit{width:100%;background:var(--accent);color:#03120d;border:none;border-radius:10px;padding:13px;font-family:var(--ff);font-size:.9rem;font-weight:800;cursor:pointer;margin-top:6px;box-shadow:0 4px 22px rgba(0,220,130,.28);transition:transform .18s,box-shadow .2s,opacity .2s;display:flex;align-items:center;justify-content:center;gap:6px}
    .landing-root .modal-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,220,130,.45)}
    .landing-root .modal-submit:disabled{opacity:.55;cursor:not-allowed}
    .landing-root .modal-divider{display:flex;align-items:center;gap:10px;margin:16px 0}
    .landing-root .modal-divider span{font-size:.72rem;color:var(--muted);white-space:nowrap}
    .landing-root .modal-divider::before,.landing-root .modal-divider::after{content:'';flex:1;height:1px;background:var(--border)}
    .landing-root .modal-guest{width:100%;background:transparent;border:1px solid var(--border);border-radius:10px;padding:11px;color:var(--sub);font-family:var(--ff);font-size:.85rem;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
    .landing-root .modal-guest:hover{border-color:var(--accent);color:var(--text);background:rgba(0,220,130,.05)}
    .landing-root .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .landing-root .step-dots{display:flex;gap:6px;justify-content:center;margin-bottom:20px}
    .landing-root .step-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:background .3s}
    .landing-root .step-dot.active{background:var(--accent)}
    .landing-root .hero{min-height:100vh;display:flex;align-items:center;position:relative;overflow:hidden;padding-top:64px}
    .landing-root .hero-vignette{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse 70% 70% at 50% 50%,transparent 30%,rgba(5,16,13,.6) 100%)}
    .landing-root .orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px)}
    .landing-root .orb-a{width:560px;height:560px;background:radial-gradient(circle,rgba(0,220,130,.11),transparent 70%);top:-60px;right:-80px;animation:drift 16s ease-in-out infinite}
    .landing-root .orb-b{width:380px;height:380px;background:radial-gradient(circle,rgba(0,140,80,.09),transparent 70%);bottom:-40px;left:-40px;animation:drift 21s ease-in-out infinite reverse}
    .landing-root .hero-inner{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:56px;max-width:1160px;width:100%;margin:0 auto;padding:0 44px}
    .landing-root .hero-kicker{display:inline-flex;align-items:center;gap:7px;background:rgba(0,220,130,.07);border:1px solid rgba(0,220,130,.18);border-radius:100px;padding:5px 13px;font-size:.74rem;font-weight:600;letter-spacing:.08em;color:var(--accent);text-transform:uppercase;margin-bottom:20px}
    .landing-root .kicker-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:blink 2s ease infinite}
    .landing-root .hero-h1{font-size:clamp(3.0rem,5.5vw,4.8rem);font-weight:800;line-height:1.07;letter-spacing:-.03em;color:var(--text);margin-bottom:24px}
    .landing-root .hero-h1 .hl{background:linear-gradient(110deg,var(--accent) 0%,#00b368 40%,#5effc5 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200%;animation:shimText 5s linear infinite}
    .landing-root .hero-desc{font-family:var(--fs);font-size:1.35rem;font-style:italic;color:#ffffff;line-height:1.68;max-width:560px;margin-bottom:38px;font-weight:400;text-shadow:0 0 10px rgba(255,255,255,0.8),0 0 20px rgba(0,220,130,0.5)}
    .landing-root .hero-btns{display:flex;gap:16px;flex-wrap:wrap}
    .landing-root .btn-main{background:var(--accent);color:#03120d;border:none;border-radius:12px;padding:14px 32px;font-family:var(--ff);font-size:1rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 22px rgba(0,220,130,.3);transition:transform .18s,box-shadow .2s}
    .landing-root .btn-main:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,220,130,.45)}
    .landing-root .btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border2);border-radius:12px;padding:14px 32px;font-family:var(--ff);font-size:1rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:background .2s,border-color .2s}
    .landing-root .btn-ghost:hover{background:rgba(0,220,130,.06);border-color:var(--accent)}
    .landing-root .hero-pills{display:flex;gap:12px;flex-wrap:wrap;margin-top:34px}
    .landing-root .pill{background:rgba(0,220,130,.15);border:1px solid rgba(0,220,130,.5);border-radius:100px;padding:8px 16px;font-size:.85rem;font-weight:600;color:#ffffff;display:flex;align-items:center;gap:8px;box-shadow:0 0 15px rgba(0,220,130,.4)}
    .landing-root .cta-wrap{background:var(--s1);border-top:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;overflow:hidden}
    .landing-root .cta-inner{max-width:700px;margin:0 auto;padding:88px 44px;text-align:center;position:relative;z-index:1}
    .landing-root .cta-title{font-size:clamp(1.9rem,3vw,2.8rem);font-weight:800;letter-spacing:-.025em;margin-bottom:14px}
    .landing-root .cta-sub{color:var(--sub);font-size:.97rem;line-height:1.65;margin-bottom:32px}
    .landing-root footer{padding:28px 44px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border)}
    .landing-root .foot-brand{display:flex;align-items:center;gap:8px}
    .landing-root .foot-brand span{font-size:.92rem;font-weight:700}
    .landing-root .foot-copy{font-size:.76rem;color:var(--muted)}
    .landing-root .features-wrap{background:var(--s1);position:relative;overflow:hidden}
    .landing-root .features-inner{max-width:1160px;margin:0 auto;padding:88px 44px}
    .landing-root .section-tag{font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
    .landing-root .section-title{font-size:clamp(1.7rem,2.8vw,2.5rem);font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-bottom:12px}
    .landing-root .section-sub{color:var(--sub);font-size:.95rem;line-height:1.65;max-width:480px}
    .landing-root .split-parent.text-5xl,.landing-root .split-parent.text-7xl{color:#ffffff;text-shadow:0 0 25px rgba(0,220,130,0.6),0 0 60px rgba(0,220,130,0.3)}
    .landing-root .split-parent.text-xl,.landing-root .split-parent.text-2xl{color:rgba(180,255,220,0.95);text-shadow:0 0 10px rgba(0,220,130,0.7)}
    @media(max-width:860px){.landing-root .hero-inner{grid-template-columns:1fr}.landing-root .nav{padding:0 18px}.landing-root .features-inner,.landing-root .cta-inner{padding:60px 20px}.landing-root footer{flex-direction:column;gap:12px;text-align:center}}
    @media(max-width:520px){.landing-root .modal{padding:32px 22px}.landing-root .form-row{grid-template-columns:1fr}}
  `}</style>
);

const IconPulse = ({ s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ── Stored users (localStorage simulation of a simple user DB) ──
const getStoredUsers = () => JSON.parse(localStorage.getItem('swasth_users') || '{}');
const saveStoredUser = (email, data) => {
    const users = getStoredUsers();
    users[email] = data;
    localStorage.setItem('swasth_users', JSON.stringify(users));
};

// ── ONBOARDING MODAL ──
function OnboardingModal({ userName, onComplete }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        age: '', weight_kg: '', height_cm: '', goal: 'maintenance',
        preference: 'vegetarian', activity_level: 'moderate',
        allergies: '', medical_conditions: '',
    });
    const [busy, setBusy] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleComplete = async () => {
        setBusy(true);
        await onComplete(form);
        setBusy(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-logo"><IconPulse s={18} /><span>Swasth AI</span></div>

                <div className="step-dots">
                    {[1, 2].map(i => <div key={i} className={`step-dot ${step >= i ? 'active' : ''}`} />)}
                </div>

                <div className="modal-title">
                    {step === 1 ? `Welcome, ${userName}! 👋` : 'Diet & Health Info'}
                </div>
                <div className="modal-sub">
                    {step === 1
                        ? 'Help us personalise your health plan. This takes 30 seconds.'
                        : 'This helps us generate accurate diet plans for you.'}
                </div>

                {step === 1 && (
                    <>
                        <div className="form-row">
                            <div className="mfg">
                                <label className="mfl">Age</label>
                                <input className="mfi" type="number" placeholder="25" value={form.age} onChange={e => set('age', e.target.value)} />
                            </div>
                            <div className="mfg">
                                <label className="mfl">Activity Level</label>
                                <select className="mfi" value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                                    <option value="sedentary">Sedentary</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="mfg">
                                <label className="mfl">Weight (kg)</label>
                                <input className="mfi" type="number" placeholder="70" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
                            </div>
                            <div className="mfg">
                                <label className="mfl">Height (cm)</label>
                                <input className="mfi" type="number" placeholder="170" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
                            </div>
                        </div>
                        <div className="mfg">
                            <label className="mfl">Primary Goal</label>
                            <select className="mfi" value={form.goal} onChange={e => set('goal', e.target.value)}>
                                <option value="weight_loss">⚡ Weight Loss</option>
                                <option value="weight_gain">💪 Muscle Gain</option>
                                <option value="maintenance">⚖️ Maintenance</option>
                            </select>
                        </div>
                        <button type="button" className="modal-submit" onClick={() => setStep(2)}>
                            Next →
                        </button>
                        <div className="modal-divider"><span>or</span></div>
                        <button type="button" className="modal-guest" onClick={() => onComplete({})}>
                            Skip for now
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="mfg">
                            <label className="mfl">Diet Preference</label>
                            <select className="mfi" value={form.preference} onChange={e => set('preference', e.target.value)}>
                                <option value="vegetarian">🥦 Vegetarian</option>
                                <option value="non-vegetarian">🍗 Non-Vegetarian</option>
                                <option value="vegan">🌱 Vegan</option>
                            </select>
                        </div>
                        <div className="mfg">
                            <label className="mfl">Allergies (comma separated)</label>
                            <input className="mfi" placeholder="e.g. nuts, dairy, gluten" value={form.allergies} onChange={e => set('allergies', e.target.value)} />
                        </div>
                        <div className="mfg">
                            <label className="mfl">Medical Conditions (if any)</label>
                            <input className="mfi" placeholder="e.g. diabetes, hypertension" value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                            <button type="button" className="modal-guest" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                            <button type="button" className="modal-submit" style={{ flex: 2 }} onClick={handleComplete} disabled={busy}>
                                {busy ? 'Saving…' : '✅ Complete Setup'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── LOGIN / SIGNUP MODAL ──
function LoginModal({ onClose }) {
    const [tab, setTab]         = useState('login');
    const [name, setName]       = useState('');
    const [email, setEmail]     = useState('');
    const [pw, setPw]           = useState('');
    const [pw2, setPw2]         = useState('');
    const [showPw, setShowPw]   = useState(false);
    const [err, setErr]         = useState('');
    const [success, setSuccess] = useState('');
    const [busy, setBusy]       = useState(false);
    const [hiding, setHiding]   = useState(false);

    const dismiss = (userData) => {
        setHiding(true);
        setTimeout(() => onClose(userData || null), 280);
    };

    const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const submit = () => {
        setErr(''); setSuccess('');

        if (tab === 'signup') {
            if (!name.trim())             { setErr('Please enter your full name.'); return; }
            if (!validateEmail(email))    { setErr('Enter a valid email address.'); return; }
            if (pw.length < 6)            { setErr('Password must be at least 6 characters.'); return; }
            if (pw !== pw2)               { setErr('Passwords do not match.'); return; }

            // Check if user already exists
            const users = getStoredUsers();
            if (users[email]) { setErr('An account with this email already exists. Please sign in.'); return; }

            setBusy(true);
            // Save user credentials locally
            saveStoredUser(email, { name: name.trim(), email, passwordHash: btoa(pw) });
            setTimeout(() => {
                setBusy(false);
                dismiss({ name: name.trim(), email });
            }, 600);

        } else {
            // Login
            if (!validateEmail(email))    { setErr('Enter a valid email address.'); return; }
            if (!pw)                      { setErr('Please enter your password.'); return; }

            const users = getStoredUsers();
            const stored = users[email];

            if (!stored) {
                setErr('No account found with this email. Please sign up first.');
                return;
            }
            if (btoa(pw) !== stored.passwordHash) {
                setErr('Incorrect password. Please try again.');
                return;
            }

            setBusy(true);
            setTimeout(() => {
                setBusy(false);
                dismiss({ name: stored.name, email });
            }, 600);
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') submit(); };

    return (
        <div className={`modal-overlay${hiding ? ' out' : ''}`} onClick={e => e.target === e.currentTarget && dismiss()}>
            <div className="modal">
                <button type="button" className="modal-close" onClick={() => dismiss()}>✕</button>
                <div className="modal-logo"><IconPulse s={18} /><span>Swasth AI</span></div>

                <div className="modal-tabs">
                    <button type="button" className={`mtab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>Sign In</button>
                    <button type="button" className={`mtab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setErr(''); }}>Sign Up</button>
                </div>

                <div className="modal-title">{tab === 'login' ? 'Welcome back' : 'Create account'}</div>
                <div className="modal-sub">{tab === 'login' ? 'Sign in to your Swasth AI account' : 'Start your AI health journey today'}</div>

                {err     && <div className="m-err">{err}</div>}
                {success && <div className="m-success">{success}</div>}

                {tab === 'signup' && (
                    <div className="mfg">
                        <label className="mfl">Full Name</label>
                        <input className="mfi" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} />
                    </div>
                )}

                <div className="mfg">
                    <label className="mfl">Email</label>
                    <input className="mfi" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
                </div>

                <div className="mfg">
                    <label className="mfl">Password</label>
                    <div className="pw-row">
                        <input className="mfi" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={handleKeyDown} style={{ paddingRight: 38 }} />
                        <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)}>
                            {showPw ? <IconEye /> : <IconEyeOff />}
                        </button>
                    </div>
                </div>

                {tab === 'signup' && (
                    <div className="mfg">
                        <label className="mfl">Confirm Password</label>
                        <input className="mfi" type="password" placeholder="••••••••" value={pw2} onChange={e => setPw2(e.target.value)} onKeyDown={handleKeyDown} />
                    </div>
                )}

                <button type="button" className="modal-submit" onClick={submit} disabled={busy}>
                    {busy ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
                </button>

                {tab === 'login' && (
                    <>
                        <div className="modal-divider"><span>or</span></div>
                        <button type="button" className="modal-guest" onClick={() => dismiss({ name: 'Guest', email: 'guest@swasthai.com' })}>
                            Continue as Guest
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── FEATURES DATA ──
const FEATURES = [
    { icon: '🩺', title: 'Early Detection',  desc: 'AI analyses your symptoms and flags potential conditions before they become serious.',   tag: 'AI-Powered' },
    { icon: '🧠', title: 'Mental Wellness',   desc: '24/7 empathetic support, mood tracking, and guided mindfulness sessions.',              tag: 'Always On' },
    { icon: '🥗', title: 'Smart Diet',        desc: 'Personalised 7-day nutrition plans built around your goals, allergies, and medical reports.', tag: 'Personalised' },
    { icon: '🔬', title: 'Lab Report AI',     desc: 'Upload any medical report and receive a plain-language breakdown instantly.',           tag: 'Instant' },
];

// ── MAIN EXPORT ──
export default function Login() {
    const [showLogin, setShowLogin]           = useState(false);
    const [scrolled, setScrolled]             = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [pendingUser, setPendingUser]       = useState(null);

    const { login, completeOnboarding, needsOnboarding } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);

    // If user is already logged in and needs onboarding, show it
    useEffect(() => {
        if (needsOnboarding && !showOnboarding) {
            setShowOnboarding(true);
        }
    }, [needsOnboarding]);

    const handleLoginClose = async (userData) => {
        setShowLogin(false);
        if (!userData) return;

        await login(userData);
        setPendingUser(userData);

        // Check if we need onboarding
        const users = JSON.parse(localStorage.getItem('swasth_users') || '{}');
        const stored = users[userData.email];
        if (!stored?.onboardingComplete && userData.email !== 'guest@swasthai.com') {
            setShowOnboarding(true);
        } else {
            navigate('/');
        }
    };

    const handleOnboardingComplete = async (profileData) => {
        await completeOnboarding(profileData);

        // Mark onboarding complete
        if (pendingUser?.email) {
            const users = getStoredUsers();
            if (users[pendingUser.email]) {
                users[pendingUser.email].onboardingComplete = true;
                localStorage.setItem('swasth_users', JSON.stringify(users));
            }
        }
        setShowOnboarding(false);
        navigate('/');
    };

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="landing-root">
            <LandingStyles />

            {showLogin    && <LoginModal onClose={handleLoginClose} />}
            {showOnboarding && <OnboardingModal userName={pendingUser?.name || 'there'} onComplete={handleOnboardingComplete} />}

            {/* ── NAV ── */}
            <nav className={`nav${scrolled ? ' solid' : ''}`}>
                <a href="#top" className="nav-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top:0, behavior:'smooth' }); }}>
                    <span className="nav-logo-icon"><IconPulse /></span>
                    <span className="nav-logo-text">Swasth AI</span>
                </a>
                <div className="nav-right">
                    <button type="button" className="nav-sign-btn"  onClick={() => setShowLogin(true)}>Sign In</button>
                    <button type="button" className="nav-login-btn" onClick={() => setShowLogin(true)}>Get Started</button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="hero" id="top">
                <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:0 }}>
                    <Iridescence color={[0.1, 0.6, 0.4]} speed={1.0} amplitude={0.1} />
                </div>
                <div className="hero-vignette" />
                <div className="orb orb-a" /><div className="orb orb-b" />

                <div className="hero-inner">
                    <div>
                        <div className="hero-kicker fu d1"><span className="kicker-dot" />Next-Gen Healthcare</div>
                        <h1 className="hero-h1 fu d2">Your Health,<br /><span className="hl">Illuminated</span> by AI.</h1>
                        <p className="hero-desc fu d3">The comprehensive health companion that travels with you — from early disease detection to personalised diet plans.</p>
                        <div className="hero-btns fu d4">
                            <button type="button" className="btn-main" onClick={() => setShowLogin(true)}>Get Started Free <IconArrow /></button>
                            <button type="button" className="btn-ghost" onClick={() => scrollTo('features')}>See How It Works</button>
                        </div>
                        <div className="hero-pills fu d5">
                            {['99% Accuracy', '24/7 Availability', 'HIPAA Compliant'].map(t => (
                                <span key={t} className="pill">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <div className="features-wrap pt-20" id="features">
                <div className="features-inner !px-4 md:!px-12 relative z-10">
                    <div className="text-center mb-32">
                        <div className="section-tag">What We Offer</div>
                        <div className="section-title">Holistic Health Services</div>
                        <p className="section-sub mx-auto">Everything you need for a healthier life, powered by AI.</p>
                    </div>
                    <ScrollStack itemDistance={200} itemStackDistance={30} stackPosition="20%" scaleEndPosition="10%" baseScale={0.85} scaleDuration={0.5} rotationAmount={0} blurAmount={0} useWindowScroll={true}>
                        {FEATURES.map((f, i) => (
                            <ScrollStackItem key={f.title} itemClassName={i%2===0 ? 'bg-emerald-950/90 border-2 border-emerald-400 shadow-[0_0_40px_rgba(0,220,130,0.5)] min-h-[400px]' : 'bg-[#04150e]/90 border-2 border-emerald-400 shadow-[0_0_40px_rgba(0,220,130,0.5)] min-h-[400px]'}>
                                <div className="flex flex-col h-full gap-8">
                                    <div className="space-y-6">
                                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/80">{f.tag}</span>
                                        <h3 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight" style={{textShadow:'0 0 15px rgba(255,255,255,0.8),0 0 30px rgba(0,220,130,0.6)'}}>
                                            {f.icon} {f.title}
                                        </h3>
                                        <p className="text-xl md:text-2xl text-white max-w-3xl leading-relaxed font-medium mt-4" style={{textShadow:'0 0 10px rgba(0,220,130,0.8)'}}>{f.desc}</p>
                                    </div>
                                </div>
                            </ScrollStackItem>
                        ))}
                    </ScrollStack>
                </div>
            </div>

            {/* ── SCIENCE SECTION ── */}
            <div className="py-28 px-4 md:px-20 flex flex-col items-center justify-center text-center" id="science" style={{background:'radial-gradient(ellipse at center,rgba(0,220,130,0.07) 0%,transparent 70%)'}}>
                <div className="section-tag mb-6">Our Technology</div>
                <div className="w-full max-w-5xl mx-auto mb-6">
                    <SplitText text="Powered by Advanced Science" tag="h2" splitType="chars" delay={50} duration={1.25} from={{opacity:0,y:50}} to={{opacity:1,y:0}} textAlign="center" className="text-5xl md:text-7xl font-extrabold" />
                </div>
                <div className="w-full max-w-4xl mx-auto mb-10">
                    <SplitText text="We combine cutting-edge medical research with state-of-the-art machine learning to provide accurate, timely, and life-saving insights." tag="p" splitType="words" delay={20} duration={1.0} from={{opacity:0,y:20}} to={{opacity:1,y:0}} textAlign="center" className="text-xl md:text-2xl font-medium" />
                </div>
            </div>

            {/* ── CTA ── */}
            <div className="cta-wrap">
                <div className="cta-inner">
                    <h2 className="cta-title">Ready to take control of your health?</h2>
                    <p className="cta-sub">Join thousands of users who trust Swasth AI for smarter health decisions.</p>
                    <button type="button" className="btn-main" onClick={() => setShowLogin(true)}>Get Started Free <IconArrow /></button>
                </div>
            </div>

            <footer>
                <div className="foot-brand"><IconPulse s={18} /><span>Swasth AI</span></div>
                <p className="foot-copy">© 2026 Swasth AI. All rights reserved.</p>
            </footer>
        </div>
    );
}