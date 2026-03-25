import React, { useState } from 'react';
import { Utensils, RefreshCw, Flame, Zap, Droplets, Wheat, Calendar, TrendingUp, Award, Target, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './DietPlanner.css';

// ── Static fallback plan (used when backend is unavailable) ───────────────
const FALLBACK_PLANS = {
    loss: { calories: 1600, protein: 130, carbs: 160, fat: 50,
        meals: [
            { type: 'Breakfast', emoji: '🥣', time: '8:00 AM',  color: '#f59e0b', name: 'Oatmeal with Mixed Berries',  foods: ['½ cup rolled oats', '1 cup almond milk', '½ cup blueberries', '1 tbsp chia seeds'], cal: 350, protein: 12, carbs: 55, fat: 8 },
            { type: 'Lunch',     emoji: '🥗', time: '1:00 PM',  color: '#10b981', name: 'Grilled Chicken Salad',       foods: ['150g grilled chicken', 'Mixed greens', '½ avocado', 'Olive oil dressing'],          cal: 450, protein: 42, carbs: 18, fat: 22 },
            { type: 'Snack',     emoji: '🍎', time: '4:00 PM',  color: '#8b5cf6', name: 'Greek Yogurt & Almonds',      foods: ['1 cup Greek yogurt', '15 almonds', '1 tsp honey'],                                   cal: 200, protein: 18, carbs: 14, fat: 9 },
            { type: 'Dinner',    emoji: '🐟', time: '8:00 PM',  color: '#3b82f6', name: 'Steamed Salmon & Vegetables', foods: ['180g salmon fillet', 'Steamed broccoli', 'Brown rice ½ cup', 'Lemon & herbs'],        cal: 520, protein: 42, carbs: 38, fat: 18 },
        ]},
    gain: { calories: 3000, protein: 200, carbs: 350, fat: 80,
        meals: [
            { type: 'Breakfast', emoji: '🥚', time: '7:30 AM', color: '#f59e0b', name: '3 Eggs & Avocado Toast',      foods: ['3 whole eggs', '2 slices whole wheat toast', '1 avocado', '200ml whole milk'],        cal: 680, protein: 35, carbs: 55, fat: 32 },
            { type: 'Lunch',     emoji: '🍗', time: '1:00 PM', color: '#10b981', name: 'Rice, Chicken & Beans',       foods: ['200g chicken breast', '1.5 cups brown rice', '½ cup black beans', 'Sweet potato'],   cal: 850, protein: 65, carbs: 110, fat: 15 },
            { type: 'Snack',     emoji: '🥛', time: '4:00 PM', color: '#8b5cf6', name: 'Peanut Butter Protein Shake', foods: ['2 scoops protein powder', '2 tbsp peanut butter', '1 banana', '300ml whole milk'],   cal: 580, protein: 48, carbs: 55, fat: 18 },
            { type: 'Dinner',    emoji: '🍝', time: '8:30 PM', color: '#3b82f6', name: 'Pasta with Meat Sauce',       foods: ['200g pasta', '200g ground beef', 'Tomato sauce', '30g parmesan cheese'],              cal: 820, protein: 52, carbs: 95, fat: 22 },
        ]},
    maintain: { calories: 2200, protein: 150, carbs: 250, fat: 65,
        meals: [
            { type: 'Breakfast', emoji: '🫐', time: '8:00 AM',  color: '#f59e0b', name: 'Berry Smoothie Bowl',          foods: ['1 cup mixed berries', '1 cup Greek yogurt', '¼ cup granola', '1 tbsp flaxseed'],    cal: 420, protein: 22, carbs: 60, fat: 12 },
            { type: 'Lunch',     emoji: '🌮', time: '1:00 PM',  color: '#10b981', name: 'Turkey & Veggie Wrap',          foods: ['120g sliced turkey', 'Whole wheat wrap', 'Mixed veggies', 'Hummus spread'],         cal: 550, protein: 38, carbs: 58, fat: 18 },
            { type: 'Snack',     emoji: '🧀', time: '4:30 PM',  color: '#8b5cf6', name: 'Cheese & Whole Grain Crackers', foods: ['30g Gouda cheese', '10 whole grain crackers', '1 apple'],                          cal: 280, protein: 12, carbs: 38, fat: 10 },
            { type: 'Dinner',    emoji: '🥘', time: '8:00 PM',  color: '#3b82f6', name: 'Chicken & Quinoa Bowl',         foods: ['160g grilled chicken', '¾ cup cooked quinoa', 'Roasted vegetables', 'Tahini'],      cal: 620, protein: 48, carbs: 62, fat: 18 },
        ]},
};

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };
const GOAL_MAP   = { loss:'weight_loss', gain:'weight_gain', maintain:'maintenance' };
const PREF_MAP   = { Vegetarian:'vegetarian', 'Non-Veg':'non-vegetarian', Vegan:'vegan', Keto:'vegetarian' };
const GOAL_COLORS = { loss:'#3b82f6', gain:'#f59e0b', maintain:'#10b981' };
const GOAL_LABELS = { loss:'Weight Loss', gain:'Muscle Gain', maintain:'Maintenance' };

// ── Mini components (unchanged visuals) ────────────────────────────────────
const MacroPieChart = ({ protein, carbs, fat }) => {
    const total = protein*4 + carbs*4 + fat*9 || 1;
    const pcts  = [(protein*4/total)*100, (carbs*4/total)*100, (fat*9/total)*100];
    const colors = ['#10b981','#f59e0b','#3b82f6'];
    const labels = ['Protein','Carbs','Fat'];
    const vals   = [protein, carbs, fat];
    const r = 40, cx = 60, cy = 60, circ = 2*Math.PI*r;
    let cum = 0;
    const arcs = pcts.map((pct,i) => { const rot = (cum/100)*360-90; cum+=pct; return { pct, color:colors[i], rot }; });
    return (
        <div className="macro-chart-wrapper">
            <svg viewBox="0 0 120 120" className="macro-donut">
                {arcs.map((a,i) => <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="18" strokeDasharray={`${(a.pct/100)*circ} ${circ}`} strokeDashoffset="0" transform={`rotate(${a.rot} ${cx} ${cy})`} style={{transition:'stroke-dasharray 1s ease'}} />)}
                <circle cx={cx} cy={cy} r="29" fill="rgba(15,23,42,0.9)" />
                <text x={cx} y={cy-6} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Macros</text>
                <text x={cx} y={cy+9} textAnchor="middle" fill="#94a3b8" fontSize="8">Split</text>
            </svg>
            <div className="macro-legend">
                {labels.map((l,i) => (
                    <div key={l} className="legend-item">
                        <span className="legend-dot" style={{background:colors[i]}} />
                        <span className="legend-label">{l}</span>
                        <span className="legend-val">{vals[i]}g</span>
                        <span className="legend-pct" style={{color:colors[i]}}>{Math.round(pcts[i])}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CalorieRing = ({ calories, goal }) => {
    const max    = goal==='gain' ? 3500 : goal==='maintain' ? 2500 : 2000;
    const pct    = Math.min((calories/max)*100,100);
    const r = 52, circ = 2*Math.PI*r;
    const color  = GOAL_COLORS[goal] || '#10b981';
    return (
        <div className="calorie-ring-wrap">
            <svg viewBox="0 0 120 120" className="calorie-ring-svg">
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}} />
                <text x="60" y="54" textAnchor="middle" fill="white" fontSize="16" fontWeight="800">{calories.toLocaleString()}</text>
                <text x="60" y="68" textAnchor="middle" fill="#94a3b8" fontSize="9">kcal / day</text>
            </svg>
            <div className="cal-ring-label" style={{color}}>Daily Goal</div>
        </div>
    );
};

const MealCard = ({ meal, index }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`meal-card-v2 ${open?'expanded':''}`}
            style={{animationDelay:`${index*0.1}s`,'--meal-color':meal.color}}
            onClick={() => setOpen(o=>!o)}>
            <div className="mc-top">
                <div className="mc-emoji">{meal.emoji}</div>
                <div className="mc-info">
                    <div className="mc-type" style={{color:meal.color}}>{meal.type}</div>
                    <div className="mc-name">{meal.name}</div>
                    <div className="mc-time">⏰ {meal.time}</div>
                </div>
                <div className="mc-cal-badge">
                    <span className="mc-cal-num">{meal.cal}</span>
                    <span className="mc-cal-unit">kcal</span>
                </div>
            </div>
            <div className="mc-macros">
                <div className="mc-macro"><span style={{color:'#10b981'}}>P</span>{meal.protein}g</div>
                <div className="mc-macro"><span style={{color:'#f59e0b'}}>C</span>{meal.carbs}g</div>
                <div className="mc-macro"><span style={{color:'#3b82f6'}}>F</span>{meal.fat}g</div>
            </div>
            {open && (
                <div className="mc-foods-list fade-in">
                    <div className="mc-foods-title">🛒 Ingredients</div>
                    <ul>{meal.foods.map((f,i)=><li key={i}>• {f}</li>)}</ul>
                </div>
            )}
            <div className="mc-expand-hint">{open ? 'Click to collapse ▲' : 'Click to see foods ▼'}</div>
        </div>
    );
};

// ── Weekly plan day card (backend plan) ────────────────────────────────────
const DayCard = ({ day, dayData, isToday }) => {
    const [open, setOpen] = useState(isToday);
    const slots = ['breakfast','mid_morning','lunch','snack','dinner'];
    return (
        <div className={`weekly-card ${isToday ? 'today' : ''}`} style={{cursor:'pointer'}} onClick={() => setOpen(o=>!o)}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div className="weekly-day">{DAY_LABELS[day]}</div>
                {isToday && <div className="today-badge">Today</div>}
                {open ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
            </div>
            <div className="weekly-emoji">{dayData?.breakfast?.emoji || '🌅'}</div>
            {open && slots.map(slot => {
                const meal = dayData?.[slot];
                if (!meal) return null;
                return (
                    <div key={slot} className="weekly-meal-row" style={{flexDirection:'column',alignItems:'flex-start',gap:2,marginBottom:6}}>
                        <span style={{fontSize:'0.65rem',color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                            {meal.emoji} {slot.replace('_',' ')} · {meal.time}
                        </span>
                        <span className="wm-text" style={{fontSize:'0.75rem'}}>{meal.name}</span>
                        {meal.deficiency_note && (
                            <span style={{fontSize:'0.65rem',color:'#10b981',background:'rgba(16,185,129,0.08)',borderRadius:4,padding:'1px 6px',marginTop:2}}>
                                {meal.deficiency_note}
                            </span>
                        )}
                    </div>
                );
            })}
            {!open && (
                <>
                    <div className="weekly-meal-row"><span className="wm-label">🌅</span><span className="wm-text">{dayData?.breakfast?.name}</span></div>
                    <div className="weekly-meal-row"><span className="wm-label">☀️</span><span className="wm-text">{dayData?.lunch?.name}</span></div>
                    <div className="weekly-meal-row"><span className="wm-label">🌙</span><span className="wm-text">{dayData?.dinner?.name}</span></div>
                </>
            )}
        </div>
    );
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
const DietPlanner = () => {
    const { user, API } = useUser();

    const [goal, setGoal]           = useState('loss');
    const [dietType, setDietType]   = useState('Vegetarian');
    const [allergies, setAllergies] = useState([]);
    const [generated, setGenerated] = useState(false);
    const [loading, setLoading]     = useState(false);
    const [showWeekly, setShowWeekly] = useState(true);

    // Backend response state
    const [backendData, setBackendData]   = useState(null);
    const [planSource, setPlanSource]     = useState('local');
    const [errorMsg, setErrorMsg]         = useState('');

    const todayIdx = [1,2,3,4,5,6,0][new Date().getDay()]; // Mon=0

    const handleGenerate = async () => {
        setGenerated(false);
        setLoading(true);
        setBackendData(null);
        setErrorMsg('');

        if (user?.email && user.email !== 'guest@example.com') {
            try {
                const res = await fetch(`${API}/diet/weekly-plan`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email:      user.email,
                        goal:       GOAL_MAP[goal],
                        preference: PREF_MAP[dietType] || 'vegetarian',
                        allergies:  allergies.join(', '),
                        age:        user.age        || undefined,
                        weight_kg:  user.weight_kg  || user.weight  || undefined,
                        height_cm:  user.height_cm  || user.height  || undefined,
                        activity_level: user.activity_level || 'moderate',
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setBackendData(data);
                    setPlanSource(data.plan_source || 'rule-based');
                } else {
                    const err = await res.json();
                    setErrorMsg(err.detail || 'Backend error. Showing local plan.');
                    setPlanSource('local');
                }
            } catch (e) {
                setErrorMsg('Backend unavailable. Showing a local sample plan.');
                setPlanSource('local');
            }
        } else {
            setErrorMsg('You are browsing as a guest. Log in with email to get a personalised plan from your profile & medical reports.');
            setPlanSource('local');
        }

        setTimeout(() => { setLoading(false); setGenerated(true); }, 1000);
    };

    const plan          = FALLBACK_PLANS[goal] || FALLBACK_PLANS.loss;
    const displayCal    = backendData?.calories?.target  || plan.calories;
    const displayProt   = backendData?.macros?.protein_g || plan.protein;
    const displayCarbs  = backendData?.macros?.carbs_g   || plan.carbs;
    const displayFat    = backendData?.macros?.fat_g     || plan.fat;
    const displayWater  = backendData?.water_ml ? `${(backendData.water_ml/1000).toFixed(1)}L` : '2.5L';

    return (
        <div className="diet-container fade-in">

            {/* ── Header ── */}
            <div className="diet-header-v2">
                <div className="diet-header-left">
                    <div className="diet-header-icon">🥗</div>
                    <div>
                        <h1>Smart Diet Planner</h1>
                        <p>AI-powered 7-day meal plans tailored to your health goals & medical reports</p>
                    </div>
                </div>
                <div className="diet-header-badges">
                    <div className="hbadge"><Award size={14} /> AI-Powered</div>
                    <div className="hbadge"><TrendingUp size={14} /> Report-Aware</div>
                </div>
            </div>

            {/* ── Controls ── */}
            <div className="controls-section glass-panel">
                <div className="controls-grid">
                    <div className="control-block">
                        <h3><Target size={16} /> Primary Goal</h3>
                        <div className="goal-selector">
                            {['loss','gain','maintain'].map(g => (
                                <button key={g} className={`goal-btn ${goal===g?'active':''}`}
                                    style={goal===g ? {background:GOAL_COLORS[g],borderColor:GOAL_COLORS[g]} : {}}
                                    onClick={() => setGoal(g)}>
                                    {g==='loss' ? '⚡ Weight Loss' : g==='gain' ? '💪 Muscle Gain' : '⚖️ Maintain'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="control-block">
                        <h3><Utensils size={16} /> Dietary Preference</h3>
                        <div className="goal-selector">
                            {['Vegetarian','Non-Veg','Vegan','Keto'].map(type => (
                                <button key={type} className={`goal-btn ${dietType===type?'active':''}`}
                                    onClick={() => setDietType(type)}>{type}</button>
                            ))}
                        </div>
                    </div>
                    <div className="control-block">
                        <h3><Zap size={16} /> Allergies / Restrictions</h3>
                        <div className="filters-grid">
                            {['Gluten','Dairy','Nuts','Shellfish','Soy','Eggs'].map(item => (
                                <label key={item} className="checkbox-label">
                                    <input type="checkbox" checked={allergies.includes(item)}
                                        onChange={(e) => {
                                            if (e.target.checked) setAllergies([...allergies,item]);
                                            else setAllergies(allergies.filter(a=>a!==item));
                                        }} />
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <button className={`generate-btn ${loading?'loading':''}`} onClick={handleGenerate} disabled={loading}>
                    {loading ? <span className="spinner" /> : <RefreshCw size={18} />}
                    {loading ? 'Generating your plan…' : '✨ Generate My 7-Day Diet Plan'}
                </button>
            </div>

            {/* ── Dashboard ── */}
            {generated && (
                <div className="ai-dashboard fade-in">

                    {/* Plan source + error banner */}
                    <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.72rem',padding:'3px 10px',borderRadius:20,background: planSource==='local' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: planSource==='local' ? '#f59e0b' : '#10b981', border:`1px solid ${planSource==='local' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`}}>
                            {planSource==='local' ? '📋 Sample Plan' : planSource==='ai-enhanced' ? '🤖 AI-Enhanced Plan' : '✅ Personalised Plan'}
                        </span>
                        {backendData?.deficiencies_from_report?.length > 0 && (
                            <span style={{fontSize:'0.72rem',padding:'3px 10px',borderRadius:20,background:'rgba(139,92,246,0.1)',color:'#8b5cf6',border:'1px solid rgba(139,92,246,0.3)'}}>
                                🩺 Report deficiencies applied: {backendData.deficiencies_from_report.join(', ')}
                            </span>
                        )}
                    </div>

                    {errorMsg && (
                        <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:10,padding:'10px 14px',fontSize:'0.82rem',color:'#fbbf24',marginBottom:14,display:'flex',gap:8,alignItems:'flex-start'}}>
                            <AlertTriangle size={16} style={{flexShrink:0,marginTop:2}} /> {errorMsg}
                        </div>
                    )}

                    {/* Allergen alerts */}
                    {backendData?.allergen_alerts?.length > 0 && (
                        <div style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                            <div style={{fontSize:'0.72rem',fontWeight:700,color:'#ef4444',marginBottom:6}}>⚠️ Allergen Substitutions Made</div>
                            {backendData.allergen_alerts.map((a,i) => <div key={i} style={{fontSize:'0.75rem',color:'#fca5a5'}}>• {a}</div>)}
                        </div>
                    )}

                    {/* Deficiency notes */}
                    {backendData?.deficiency_notes?.length > 0 && (
                        <div style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                            <div style={{fontSize:'0.72rem',fontWeight:700,color:'#8b5cf6',marginBottom:6}}>🩺 Deficiency-Aware Adjustments</div>
                            {backendData.deficiency_notes.map((n,i) => <div key={i} style={{fontSize:'0.75rem',color:'#c4b5fd'}}>• {n}</div>)}
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="dash-stats-row">
                        <div className="dash-stat-card"><Flame size={22} color="#ef4444" /><div><div className="ds-num">{displayCal.toLocaleString()}</div><div className="ds-label">Daily Calories</div></div></div>
                        <div className="dash-stat-card"><Zap size={22} color="#10b981" /><div><div className="ds-num">{displayProt}g</div><div className="ds-label">Protein</div></div></div>
                        <div className="dash-stat-card"><Wheat size={22} color="#f59e0b" /><div><div className="ds-num">{displayCarbs}g</div><div className="ds-label">Carbohydrates</div></div></div>
                        <div className="dash-stat-card"><Droplets size={22} color="#3b82f6" /><div><div className="ds-num">{displayWater}</div><div className="ds-label">Water / Day</div></div></div>
                    </div>

                    {/* Nutrition charts */}
                    <div className="nutrition-overview">
                        <div className="nutrition-chart-card glass-panel">
                            <h3>📊 Calorie Goal</h3>
                            <CalorieRing calories={displayCal} goal={goal} />
                        </div>
                        <div className="nutrition-chart-card glass-panel">
                            <h3>🥦 Macronutrient Breakdown</h3>
                            <MacroPieChart protein={displayProt} carbs={displayCarbs} fat={displayFat} />
                        </div>
                    </div>

                    {/* ── 7-Day weekly plan (backend) or today's meals (local) ── */}
                    {backendData?.weekly_plan ? (
                        <div className="weekly-section">
                            <div className="weekly-header">
                                <Calendar size={20} color="#8b5cf6" />
                                <h3>Your 7-Day Meal Plan</h3>
                                <span style={{fontSize:'0.72rem',color:'#64748b',marginLeft:'auto'}}>Click any day to expand</span>
                            </div>
                            <div className="weekly-grid">
                                {DAYS.map((day, idx) => (
                                    <DayCard key={day} day={day} dayData={backendData.weekly_plan[day]} isToday={idx === todayIdx} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="meals-section">
                            <div className="meals-section-header">
                                <h3>🍽️ Sample Meal Plan</h3>
                                <span className="meals-count">{plan.meals.length} meals · {plan.calories} kcal</span>
                            </div>
                            <div className="meals-grid">
                                {plan.meals.map((meal,i) => <MealCard key={meal.type} meal={meal} index={i} />)}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {(backendData?.general_notes?.length > 0) && (
                        <div className="diet-tips glass-panel">
                            <h3>💡 Personalised Tips</h3>
                            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
                                {backendData.general_notes.map((note,i) => (
                                    <div key={i} style={{fontSize:'0.83rem',color:'#cbd5e1',display:'flex',gap:8,alignItems:'flex-start'}}>
                                        <CheckCircle size={14} color="#10b981" style={{flexShrink:0,marginTop:2}} />
                                        {note}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Static tips always shown */}
                    <div className="diet-tips glass-panel" style={{marginTop:12}}>
                        <h3>💡 General Nutrition Tips</h3>
                        <div className="tips-grid">
                            {[
                                { icon:'💧', title:'Hydration',    text:`Drink at least ${displayWater} of water daily to support your metabolism.` },
                                { icon:'⏰', title:'Meal Timing',  text:'Eat every 3-4 hours to keep your metabolism active throughout the day.' },
                                { icon:'🌙', title:'Night Routine',text:'Avoid heavy meals 2-3 hours before bedtime for better sleep quality.' },
                                { icon:'🏃', title:'Exercise Sync',text:'Schedule your carb-heavy meals around your workout for optimal energy.' },
                            ].map(tip => (
                                <div key={tip.title} className="tip-card">
                                    <div className="tip-icon">{tip.icon}</div>
                                    <div><div className="tip-title">{tip.title}</div><div className="tip-text">{tip.text}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietPlanner;