import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Droplets, Moon, Flame, Calendar, ArrowRight,
    AlertCircle, FileText, Utensils, Brain, Heart, Zap,
    TrendingUp, MessageSquare, ChevronRight, Sparkles,
    Plus, X, Smile
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import CalorieAI from '../../components/CalorieAI/CalorieAI';
import './Dashboard.css';

/* ── helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return { day: d.getDate(), month: MONTHS[d.getMonth()] };
}
function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

/* ── Animated Ring Component ── */
function Ring({ value, max, color, size = 80, strokeWidth = 7, label, icon }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    const [progress, setProgress] = useState(0);
    useEffect(() => { const t = setTimeout(() => setProgress(pct), 200); return () => clearTimeout(t); }, [pct]);
    return (
        <div className="ring-wrap">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color})` }} />
            </svg>
            <div className="ring-center"><span className="ring-icon">{icon}</span></div>
            <div className="ring-label">{label}</div>
            <div className="ring-value">{value}<span>/ {max}</span></div>
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, unit, color, sub }) {
    return (
        <div className="stat-card glass-panel" style={{ '--c': color }}>
            <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
            <div className="stat-body">
                <div className="stat-val">{value}<span className="stat-unit">{unit}</span></div>
                <div className="stat-label">{label}</div>
                {sub && <div className="stat-sub">{sub}</div>}
            </div>
        </div>
    );
}

/* ── AI Insight Card ── */
function InsightCard({ emoji, title, desc, color }) {
    return (
        <div className="insight-card" style={{ '--c': color }}>
            <div className="insight-emoji">{emoji}</div>
            <div>
                <div className="insight-title">{title}</div>
                <div className="insight-desc">{desc}</div>
            </div>
        </div>
    );
}

/* ── Weekly Bar Chart ── */
function WeeklyGraph({ data }) {
    const max = Math.max(...data.map(d => d.cal), 1);
    return (
        <div className="weekly-graph">
            {data.map((d, i) => (
                <div key={i} className="bar-col">
                    <div className="bar-wrap">
                        <div className="bar-fill" style={{ height: `${(d.cal / max) * 100}%` }} title={`${d.cal} kcal`} />
                    </div>
                    <div className="bar-day">{d.day}</div>
                </div>
            ))}
        </div>
    );
}

/* ── Quick Action Button ── */
function QuickAction({ icon, label, to, color, navigate }) {
    return (
        <button className="quick-action" onClick={() => navigate(to)} style={{ '--c': color }}>
            <div className="qa-icon" style={{ background: `${color}22`, color }}>{icon}</div>
            <span>{label}</span>
            <ChevronRight size={16} className="qa-arrow" />
        </button>
    );
}

/* ════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════ */
const MOOD_OPTIONS = ['😄 Great', '🙂 Good', '😐 Okay', '😔 Poor'];

const Dashboard = () => {
    const { user, appointments, healthMetrics, updateHealthMetrics, addFoodEntry, removeFoodEntry } = useUser();
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];

    // upcoming appointments (sorted by date, closest first)
    const upcomingAppts = [...appointments]
        .filter(a => a.date >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    // Calorie calculations from food log
    const calConsumed = healthMetrics.foodLog.reduce((s, f) => s + Number(f.calories || 0), 0);
    const calGoal = healthMetrics.calGoal || 2000;
    const calRemaining = Math.max(calGoal - calConsumed, 0);

    // Weekly dummy graph showing today's progress
    const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon
    const weeklyData = WEEK_DAYS.map((day, i) => ({
        day,
        cal: i === todayIdx ? calConsumed : 0
    }));

    // Food log modal — uses CalorieAI (automatic AI calorie estimation via Claude API)
    const [showFood, setShowFood] = useState(false);

    const handleCalorieAIAdd = (entry) => {
        addFoodEntry({ name: entry.name, calories: entry.kcal });
    };


    // AI insights based on actual data
    const insights = [
        healthMetrics.waterGlasses < 8
            ? { emoji: '💧', title: 'Hydration Alert', desc: `You've had ${healthMetrics.waterGlasses} glasses today. Drink ${8 - healthMetrics.waterGlasses} more to hit your goal!`, color: '#38bdf8' }
            : { emoji: '💧', title: 'Hydrated!', desc: 'Great job! You\'ve hit your water goal for today.', color: '#38bdf8' },
        calRemaining > 0
            ? { emoji: '🥗', title: 'Calorie Tip', desc: `You still have ${calRemaining} kcal remaining today. Log your meals to stay on track.`, color: '#34d399' }
            : { emoji: '🔥', title: 'Goal Reached!', desc: 'You\'ve hit your daily calorie goal! Great job staying on track.', color: '#f59e0b' },
        healthMetrics.sleepHours < 7
            ? { emoji: '😴', title: 'Sleep Quality', desc: `You logged ${healthMetrics.sleepHours} hrs of sleep. Aim for 7-8 hrs tonight!`, color: '#a78bfa' }
            : { emoji: '😴', title: 'Well Rested!', desc: `${healthMetrics.sleepHours} hrs of sleep — you\'re well rested!`, color: '#a78bfa' },
        upcomingAppts.length > 0
            ? { emoji: '🏥', title: 'Appointment Reminder', desc: `You have an appointment with ${upcomingAppts[0].doctor} on ${fmtDate(upcomingAppts[0].date).day} ${fmtDate(upcomingAppts[0].date).month}.`, color: '#f43f5e' }
            : { emoji: '📅', title: 'No Upcoming Visits', desc: 'No appointments scheduled. Book one if you need a checkup!', color: '#f43f5e' },
    ];

    return (
        <div className="dashboard-container fade-in">
            {/* ── Welcome Banner ── */}
            <section className="welcome-banner glass-panel">
                <div className="welcome-left">
                    <div className="greeting-chip"><Sparkles size={14}/><span>AI Health Insights Active</span></div>
                    <h1>{getGreeting()}, {user.name.split(' ')[0]}! 👋</h1>
                    <p style={{ color: '#64748b' }}>Track your health, log your meals, and stay on top of appointments.</p>
                </div>
            </section>

            {/* ── Calorie Tracker ── */}
            <section className="section-label-row">
                <Flame size={18} className="accent-icon" />
                <h2 className="section-label">Today's Calorie Tracker</h2>
                <button className="inline-add-btn" onClick={() => setShowFood(true)}>
                    <Plus size={14} /> Log Food
                </button>
            </section>

            {/* Food Log Modal */}
            {showFood && (
                <div className="modal-overlay fade-in" onClick={e => e.target === e.currentTarget && setShowFood(false)}>
                    <div className="date-picker-modal glass-panel" style={{ maxWidth: 480 }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                            <h3>Log Food — AI Calorie Calculator</h3>
                            <button className="more-btn" onClick={() => setShowFood(false)}><X size={18}/></button>
                        </div>
                        <CalorieAI onAddEntry={handleCalorieAIAdd} hideLog />
                        {healthMetrics.foodLog.length > 0 && (
                            <div style={{ marginTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'1rem' }}>
                                <div style={{ fontSize:'0.8rem', color:'#64748b', marginBottom:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Today's Log</div>
                                {healthMetrics.foodLog.map(f => (
                                    <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ color:'#e2e8f0', fontSize:'0.9rem' }}>{f.name}</span>
                                        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                                            <span style={{ color:'#34d399', fontWeight:700, fontSize:'0.88rem' }}>{f.calories} kcal</span>
                                            <button className="more-btn" onClick={() => removeFoodEntry(f.id)} style={{ color:'#ef4444' }}><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="calorie-grid">
                <div className="cal-card consumed glass-panel">
                    <div className="cal-top"><span className="cal-icon">🍽️</span><span className="cal-tag">Consumed</span></div>
                    <div className="cal-value">{calConsumed.toLocaleString()}</div>
                    <div className="cal-unit">kcal</div>
                    <div className="cal-bar-wrap"><div className="cal-bar" style={{ width:`${Math.min(calConsumed/calGoal,1)*100}%`, background:'#f59e0b' }} /></div>
                </div>
                <div className="cal-card remaining glass-panel">
                    <div className="cal-top"><span className="cal-icon">✅</span><span className="cal-tag">Remaining</span></div>
                    <div className="cal-value">{calRemaining.toLocaleString()}</div>
                    <div className="cal-unit">kcal</div>
                    <div className="cal-bar-wrap"><div className="cal-bar" style={{ width:`${Math.min(calRemaining/calGoal,1)*100}%`, background:'#34d399' }} /></div>
                </div>
                <div className="cal-card goal glass-panel">
                    <div className="cal-top"><span className="cal-icon">🎯</span><span className="cal-tag">Daily Goal</span></div>
                    <div className="cal-value">{calGoal.toLocaleString()}</div>
                    <div className="cal-unit">kcal</div>
                    <div className="cal-bar-wrap"><div className="cal-bar" style={{ width:'100%', background:'rgba(52,211,153,0.3)' }} /></div>
                </div>
                <div className="cal-card meals glass-panel">
                    <div className="cal-top"><span className="cal-icon">📝</span><span className="cal-tag">Meals Logged</span></div>
                    <div className="cal-value">{healthMetrics.foodLog.length}</div>
                    <div className="cal-unit">items</div>
                    <div className="cal-bar-wrap"><div className="cal-bar" style={{ width:`${Math.min(healthMetrics.foodLog.length/5,1)*100}%`, background:'#a78bfa' }} /></div>
                </div>
            </div>

            {/* ── Activity Rings – user input ── */}
            <section className="section-label-row">
                <Activity size={18} className="accent-icon"/>
                <h2 className="section-label">Activity Rings</h2>
            </section>
            <div className="rings-card glass-panel">
                <Ring value={calConsumed} max={calGoal} color="#f59e0b" label="Calories" icon={<Flame size={18}/>} size={96}/>
                <Ring value={healthMetrics.waterGlasses} max={8} color="#38bdf8" label="Water" icon={<Droplets size={18}/>} size={96}/>
                <Ring value={Math.min(healthMetrics.sleepHours, 8)} max={8} color="#a78bfa" label="Sleep" icon={<Moon size={18}/>} size={96}/>
                <Ring value={healthMetrics.foodLog.length} max={5} color="#34d399" label="Meals" icon={<Utensils size={18}/>} size={96}/>
            </div>

            {/* ── Today's Health Stats – user input ── */}
            <section className="section-label-row">
                <TrendingUp size={18} className="accent-icon"/>
                <h2 className="section-label">Today's Health Stats</h2>
                <button className="inline-add-btn" onClick={() => {
                    const w = prompt('Glasses of water today?'); if(w!==null && !isNaN(w)) updateHealthMetrics({waterGlasses:Number(w)});
                }}>💧 Log Water</button>
                <button className="inline-add-btn" onClick={() => {
                    const s = prompt('Hours of sleep last night?'); if(s!==null && !isNaN(s)) updateHealthMetrics({sleepHours:Number(s)});
                }}>😴 Log Sleep</button>
                <button className="inline-add-btn" onClick={() => {
                    const m = prompt('How are you feeling? (Great/Good/Okay/Poor)'); if(m) updateHealthMetrics({mood:m});
                }}>😊 Log Mood</button>
            </section>
            <div className="stats-grid">
                <StatCard icon={<Droplets size={20}/>} label="Water" value={healthMetrics.waterGlasses} unit=" glasses" color="#38bdf8" sub={`${Math.max(8-healthMetrics.waterGlasses,0)} more to go`}/>
                <StatCard icon={<Moon size={20}/>} label="Sleep" value={healthMetrics.sleepHours} unit=" hrs" color="#a78bfa" sub={healthMetrics.sleepHours >= 7 ? 'Great sleep!' : 'Below target'}/>
                <StatCard icon={<Smile size={20}/>} label="Mood" value={healthMetrics.mood || '—'} unit="" color="#f59e0b" sub="How are you feeling?"/>
                <StatCard icon={<Heart size={20}/>} label="Meals Logged" value={healthMetrics.foodLog.length} unit=" items" color="#f43f5e" sub={`${calConsumed} kcal total`}/>
            </div>

            {/* ── AI Health Insights ── */}
            <section className="section-label-row">
                <Brain size={18} className="accent-icon"/>
                <h2 className="section-label">AI Health Insights</h2>
                <span className="badge-live">Live</span>
            </section>
            <div className="insights-grid glass-panel">
                {insights.map((ins, i) => <InsightCard key={i} {...ins}/>)}
            </div>

            {/* ── Weekly Graph + Appointments ── */}
            <div className="bottom-grid">
                <div className="glass-panel graph-card">
                    <div className="section-header">
                        <h2>Weekly Calorie Trends</h2>
                        <span className="week-avg">{calConsumed.toLocaleString()} kcal today</span>
                    </div>
                    <WeeklyGraph data={weeklyData}/>
                </div>

                {/* Upcoming Appointments – user input only */}
                <div className="glass-panel appointments-card">
                    <div className="section-header">
                        <h2>Upcoming Appointments</h2>
                        <button className="view-all" onClick={() => navigate('/appointments')}>View All</button>
                    </div>
                    {upcomingAppts.length > 0 ? (
                        <div className="appointment-list" style={{ marginTop:'1.5rem' }}>
                            {upcomingAppts.map((a, i) => {
                                const { day, month } = fmtDate(a.date);
                                return (
                                    <div className="appointment-item" key={i} onClick={() => navigate('/appointments')}>
                                        <div className="date-box">
                                            <span className="day">{day}</span>
                                            <span className="month">{month}</span>
                                        </div>
                                        <div className="appt-details">
                                            <h4>{a.doctor}</h4>
                                            <p>{a.specialty}</p>
                                        </div>
                                        <div className="time-badge">{fmtTime(a.time) || a.time}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem', paddingTop:'2rem', color:'#475569', textAlign:'center' }}>
                            <Calendar size={36} style={{ color:'#334155' }}/>
                            <p style={{ fontSize:'0.9rem' }}>No upcoming appointments.<br/>Schedule one to see it here.</p>
                        </div>
                    )}
                    <button className="action-btn" onClick={() => navigate('/appointments')}>
                        <Calendar size={18}/> Schedule Appointment
                    </button>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <section className="section-label-row">
                <Zap size={18} className="accent-icon"/>
                <h2 className="section-label">Quick Actions</h2>
            </section>
            <div className="quick-actions-grid">
                <QuickAction navigate={navigate} icon={<AlertCircle size={22}/>} label="Check Symptoms" to="/symptoms" color="#f59e0b"/>
                <QuickAction navigate={navigate} icon={<Utensils size={22}/>} label="Diet Planner" to="/diet" color="#34d399"/>
                <QuickAction navigate={navigate} icon={<FileText size={22}/>} label="Scan Report" to="/reports" color="#38bdf8"/>
                <QuickAction navigate={navigate} icon={<MessageSquare size={22}/>} label="AI Chat" to="/chat" color="#a78bfa"/>
                <QuickAction navigate={navigate} icon={<Calendar size={22}/>} label="Book Appointment" to="/appointments" color="#f43f5e"/>
                <QuickAction navigate={navigate} icon={<Heart size={22}/>} label="Mental Health" to="/mental-health" color="#ec4899"/>
            </div>
        </div>
    );
};

export default Dashboard;
