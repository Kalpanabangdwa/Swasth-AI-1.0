import React, { useState } from 'react';
import { Utensils, Coffee, Sun, Moon, ChefHat, RefreshCw, Flame, Zap, Droplets, Wheat, Calendar, TrendingUp, Award, Target } from 'lucide-react';
import './DietPlanner.css';

// ────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────
const PLANS = {
    loss: {
        calories: 1600,
        protein: 130,
        carbs: 160,
        fat: 50,
        meals: [
            {
                type: 'Breakfast', emoji: '🥣', time: '8:00 AM', color: '#f59e0b',
                name: 'Oatmeal with Mixed Berries',
                foods: ['½ cup rolled oats', '1 cup almond milk', '½ cup blueberries', '1 tbsp chia seeds'],
                cal: 350, protein: 12, carbs: 55, fat: 8,
            },
            {
                type: 'Lunch', emoji: '🥗', time: '1:00 PM', color: '#10b981',
                name: 'Grilled Chicken Salad',
                foods: ['150g grilled chicken', 'Mixed greens', '½ avocado', 'Olive oil dressing'],
                cal: 450, protein: 42, carbs: 18, fat: 22,
            },
            {
                type: 'Snack', emoji: '🍎', time: '4:00 PM', color: '#8b5cf6',
                name: 'Greek Yogurt & Almonds',
                foods: ['1 cup Greek yogurt', '15 almonds', '1 tsp honey'],
                cal: 200, protein: 18, carbs: 14, fat: 9,
            },
            {
                type: 'Dinner', emoji: '🐟', time: '8:00 PM', color: '#3b82f6',
                name: 'Steamed Salmon & Vegetables',
                foods: ['180g salmon fillet', 'Steamed broccoli', 'Brown rice ½ cup', 'Lemon & herbs'],
                cal: 520, protein: 42, carbs: 38, fat: 18,
            },
        ],
        weekly: [
            { day: 'Mon', breakfast: 'Oatmeal & Berries', lunch: 'Chicken Salad', dinner: 'Salmon & Veggies', emoji: '🥣' },
            { day: 'Tue', breakfast: 'Green Smoothie', lunch: 'Lentil Soup', dinner: 'Turkey Stir-Fry', emoji: '🥤' },
            { day: 'Wed', breakfast: 'Chia Pudding', lunch: 'Grilled Shrimp Bowl', dinner: 'Baked Cod', emoji: '🍮' },
            { day: 'Thu', breakfast: 'Egg White Omelette', lunch: 'Quinoa Bowl', dinner: 'Chicken Curry', emoji: '🍳' },
            { day: 'Fri', breakfast: 'Avocado Toast', lunch: 'Tuna Wrap', dinner: 'Veggie Pasta', emoji: '🥑' },
            { day: 'Sat', breakfast: 'Protein Pancakes', lunch: 'Salmon Salad', dinner: 'Grilled Steak', emoji: '🥞' },
            { day: 'Sun', breakfast: 'Acai Bowl', lunch: 'Buddha Bowl', dinner: 'Roast Chicken', emoji: '🫐' },
        ]
    },
    gain: {
        calories: 3000,
        protein: 200,
        carbs: 350,
        fat: 80,
        meals: [
            {
                type: 'Breakfast', emoji: '🥚', time: '7:30 AM', color: '#f59e0b',
                name: '3 Eggs & Avocado Toast',
                foods: ['3 whole eggs', '2 slices whole wheat toast', '1 avocado', '200ml whole milk'],
                cal: 680, protein: 35, carbs: 55, fat: 32,
            },
            {
                type: 'Lunch', emoji: '🍗', time: '1:00 PM', color: '#10b981',
                name: 'Rice, Chicken & Beans',
                foods: ['200g chicken breast', '1.5 cups brown rice', '½ cup black beans', 'Sweet potato'],
                cal: 850, protein: 65, carbs: 110, fat: 15,
            },
            {
                type: 'Snack', emoji: '🥛', time: '4:00 PM', color: '#8b5cf6',
                name: 'Peanut Butter Protein Shake',
                foods: ['2 scoops protein powder', '2 tbsp peanut butter', '1 banana', '300ml whole milk'],
                cal: 580, protein: 48, carbs: 55, fat: 18,
            },
            {
                type: 'Dinner', emoji: '🍝', time: '8:30 PM', color: '#3b82f6',
                name: 'Pasta with Meat Sauce',
                foods: ['200g pasta', '200g ground beef', 'Tomato sauce', '30g parmesan cheese'],
                cal: 820, protein: 52, carbs: 95, fat: 22,
            },
        ],
        weekly: [
            { day: 'Mon', breakfast: 'Eggs & Toast', lunch: 'Rice & Chicken', dinner: 'Pasta & Beef', emoji: '🥚' },
            { day: 'Tue', breakfast: 'Overnight Oats', lunch: 'Tuna Rice Bowl', dinner: 'Steak & Potatoes', emoji: '🥣' },
            { day: 'Wed', breakfast: 'Banana Pancakes', lunch: 'Burrito Bowl', dinner: 'Salmon & Rice', emoji: '🥞' },
            { day: 'Thu', breakfast: 'Omelet & Toast', lunch: 'Chicken Pasta', dinner: 'BBQ Chicken', emoji: '🍳' },
            { day: 'Fri', breakfast: 'Granola & Milk', lunch: 'Beef Stir-Fry', dinner: 'Pizza Night', emoji: '🥛' },
            { day: 'Sat', breakfast: 'French Toast', lunch: 'Shrimp Fried Rice', dinner: 'Turkey Burger', emoji: '🍞' },
            { day: 'Sun', breakfast: 'Protein Waffles', lunch: 'Chicken Wrap', dinner: 'Roast Beef & Vegs', emoji: '🧇' },
        ]
    },
    maintain: {
        calories: 2200,
        protein: 150,
        carbs: 250,
        fat: 65,
        meals: [
            {
                type: 'Breakfast', emoji: '🫐', time: '8:00 AM', color: '#f59e0b',
                name: 'Berry Smoothie Bowl',
                foods: ['1 cup mixed berries', '1 cup Greek yogurt', '¼ cup granola', '1 tbsp flaxseed'],
                cal: 420, protein: 22, carbs: 60, fat: 12,
            },
            {
                type: 'Lunch', emoji: '🌮', time: '1:00 PM', color: '#10b981',
                name: 'Turkey & Veggie Wrap',
                foods: ['120g sliced turkey', 'Whole wheat wrap', 'Mixed veggies', 'Hummus spread'],
                cal: 550, protein: 38, carbs: 58, fat: 18,
            },
            {
                type: 'Snack', emoji: '🧀', time: '4:30 PM', color: '#8b5cf6',
                name: 'Cheese & Whole Grain Crackers',
                foods: ['30g Gouda cheese', '10 whole grain crackers', '1 apple'],
                cal: 280, protein: 12, carbs: 38, fat: 10,
            },
            {
                type: 'Dinner', emoji: '🥘', time: '8:00 PM', color: '#3b82f6',
                name: 'Chicken & Quinoa Bowl',
                foods: ['160g grilled chicken', '¾ cup cooked quinoa', 'Roasted vegetables', 'Tahini drizzle'],
                cal: 620, protein: 48, carbs: 62, fat: 18,
            },
        ],
        weekly: [
            { day: 'Mon', breakfast: 'Smoothie Bowl', lunch: 'Turkey Wrap', dinner: 'Chicken Quinoa', emoji: '🫐' },
            { day: 'Tue', breakfast: 'Yogurt Parfait', lunch: 'Veggie Soup', dinner: 'Fish Tacos', emoji: '🥣' },
            { day: 'Wed', breakfast: 'Whole Grain Toast', lunch: 'Salad & Soup', dinner: 'Chicken Stir-Fry', emoji: '🍞' },
            { day: 'Thu', breakfast: 'Oatmeal & Fruit', lunch: 'Grain Bowl', dinner: 'Baked Salmon', emoji: '🥣' },
            { day: 'Fri', breakfast: 'Egg Muffins', lunch: 'Poke Bowl', dinner: 'Pasta Primavera', emoji: '🍳' },
            { day: 'Sat', breakfast: 'Avocado Toast', lunch: 'Grilled Sandwich', dinner: 'BBQ Shrimp', emoji: '🥑' },
            { day: 'Sun', breakfast: 'Pancakes', lunch: 'Chicken Caesar', dinner: 'Veggie Curry', emoji: '🥞' },
        ]
    }
};

// ────────────────────────────────────────────────
// MACRO PIE CHART (SVG)
// ────────────────────────────────────────────────
const MacroPieChart = ({ protein, carbs, fat }) => {
    const total = protein * 4 + carbs * 4 + fat * 9;
    const proteinPct = ((protein * 4) / total) * 100;
    const carbsPct = ((carbs * 4) / total) * 100;
    const fatPct = ((fat * 9) / total) * 100;

    const segments = [
        { pct: proteinPct, color: '#10b981', label: 'Protein' },
        { pct: carbsPct, color: '#f59e0b', label: 'Carbs' },
        { pct: fatPct, color: '#3b82f6', label: 'Fat' },
    ];

    let cumulative = 0;
    const radius = 40;
    const cx = 60;
    const cy = 60;
    const circumference = 2 * Math.PI * radius;

    const arcs = segments.map((seg) => {
        const offset = circumference - (seg.pct / 100) * circumference;
        const rotation = (cumulative / 100) * 360 - 90;
        cumulative += seg.pct;
        return { ...seg, offset, rotation };
    });

    return (
        <div className="macro-chart-wrapper">
            <svg viewBox="0 0 120 120" className="macro-donut">
                {arcs.map((arc, i) => (
                    <circle
                        key={i}
                        cx={cx} cy={cy} r={radius}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth="18"
                        strokeDasharray={`${(arc.pct / 100) * circumference} ${circumference}`}
                        strokeDashoffset="0"
                        transform={`rotate(${arc.rotation} ${cx} ${cy})`}
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                ))}
                <circle cx={cx} cy={cy} r="29" fill="rgba(15,23,42,0.9)" />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Macros</text>
                <text x={cx} y={cy + 9} textAnchor="middle" fill="#94a3b8" fontSize="8">Split</text>
            </svg>
            <div className="macro-legend">
                {[
                    { label: 'Protein', val: protein, unit: 'g', color: '#10b981', pct: Math.round(proteinPct) },
                    { label: 'Carbs', val: carbs, unit: 'g', color: '#f59e0b', pct: Math.round(carbsPct) },
                    { label: 'Fat', val: fat, unit: 'g', color: '#3b82f6', pct: Math.round(fatPct) },
                ].map(m => (
                    <div key={m.label} className="legend-item">
                        <span className="legend-dot" style={{ background: m.color }} />
                        <span className="legend-label">{m.label}</span>
                        <span className="legend-val">{m.val}g</span>
                        <span className="legend-pct" style={{ color: m.color }}>{m.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// CALORIE RING
// ────────────────────────────────────────────────
const CalorieRing = ({ calories, goal }) => {
    const max = goal === 'gain' ? 3500 : goal === 'maintain' ? 2500 : 2000;
    const pct = Math.min((calories / max) * 100, 100);
    const r = 52;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = goal === 'gain' ? '#f59e0b' : goal === 'maintain' ? '#10b981' : '#3b82f6';

    return (
        <div className="calorie-ring-wrap">
            <svg viewBox="0 0 120 120" className="calorie-ring-svg">
                <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle
                    cx="60" cy="60" r={r} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
                />
                <text x="60" y="54" textAnchor="middle" fill="white" fontSize="16" fontWeight="800">{calories.toLocaleString()}</text>
                <text x="60" y="68" textAnchor="middle" fill="#94a3b8" fontSize="9">kcal / day</text>
            </svg>
            <div className="cal-ring-label" style={{ color }}>Daily Goal</div>
        </div>
    );
};

// ────────────────────────────────────────────────
// MEAL CARD
// ────────────────────────────────────────────────
const MealCard = ({ meal, index }) => {
    const [open, setOpen] = useState(false);
    return (
        <div
            className={`meal-card-v2 ${open ? 'expanded' : ''}`}
            style={{ animationDelay: `${index * 0.1}s`, '--meal-color': meal.color }}
            onClick={() => setOpen(o => !o)}
        >
            <div className="mc-top">
                <div className="mc-emoji">{meal.emoji}</div>
                <div className="mc-info">
                    <div className="mc-type" style={{ color: meal.color }}>{meal.type}</div>
                    <div className="mc-name">{meal.name}</div>
                    <div className="mc-time">⏰ {meal.time}</div>
                </div>
                <div className="mc-cal-badge">
                    <span className="mc-cal-num">{meal.cal}</span>
                    <span className="mc-cal-unit">kcal</span>
                </div>
            </div>
            <div className="mc-macros">
                <div className="mc-macro"><span style={{ color: '#10b981' }}>P</span>{meal.protein}g</div>
                <div className="mc-macro"><span style={{ color: '#f59e0b' }}>C</span>{meal.carbs}g</div>
                <div className="mc-macro"><span style={{ color: '#3b82f6' }}>F</span>{meal.fat}g</div>
            </div>
            {open && (
                <div className="mc-foods-list fade-in">
                    <div className="mc-foods-title">🛒 Ingredients</div>
                    <ul>
                        {meal.foods.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                </div>
            )}
            <div className="mc-expand-hint">{open ? 'Click to collapse ▲' : 'Click to see foods ▼'}</div>
        </div>
    );
};

// ────────────────────────────────────────────────
// WEEKLY SCHEDULE
// ────────────────────────────────────────────────
const WeeklySchedule = ({ weekly }) => {
    const today = new Date().getDay(); // 0=Sun
    const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    const todayIdx = dayMap[today];

    return (
        <div className="weekly-section">
            <div className="weekly-header">
                <Calendar size={20} color="#8b5cf6" />
                <h3>Weekly Meal Schedule</h3>
            </div>
            <div className="weekly-grid">
                {weekly.map((d, i) => (
                    <div key={d.day} className={`weekly-card ${i === todayIdx ? 'today' : ''}`}>
                        <div className="weekly-day">{d.day}</div>
                        {i === todayIdx && <div className="today-badge">Today</div>}
                        <div className="weekly-emoji">{d.emoji}</div>
                        <div className="weekly-meal-row">
                            <span className="wm-label">🌅</span>
                            <span className="wm-text">{d.breakfast}</span>
                        </div>
                        <div className="weekly-meal-row">
                            <span className="wm-label">☀️</span>
                            <span className="wm-text">{d.lunch}</span>
                        </div>
                        <div className="weekly-meal-row">
                            <span className="wm-label">🌙</span>
                            <span className="wm-text">{d.dinner}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────
const DietPlanner = () => {
    const [goal, setGoal] = useState('loss');
    const [dietType, setDietType] = useState('Vegetarian');
    const [allergies, setAllergies] = useState([]);
    const [generated, setGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showWeekly, setShowWeekly] = useState(false);

    const handleGenerate = () => {
        setGenerated(false);
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setGenerated(true);
        }, 1200);
    };

    const plan = PLANS[goal] || PLANS.loss;
    const goalLabels = { loss: 'Weight Loss', gain: 'Muscle Gain', maintain: 'Maintenance' };
    const goalColors = { loss: '#3b82f6', gain: '#f59e0b', maintain: '#10b981' };

    return (
        <div className="diet-container fade-in">
            {/* ── HEADER ── */}
            <div className="diet-header-v2">
                <div className="diet-header-left">
                    <div className="diet-header-icon">🥗</div>
                    <div>
                        <h1>Smart Diet Planner</h1>
                        <p>AI-powered meal plans tailored to your health goals</p>
                    </div>
                </div>
                <div className="diet-header-badges">
                    <div className="hbadge"><Award size={14} /> AI-Powered</div>
                    <div className="hbadge"><TrendingUp size={14} /> Personalized</div>
                </div>
            </div>

            {/* ── CONTROLS ── */}
            <div className="controls-section glass-panel">
                <div className="controls-grid">
                    <div className="control-block">
                        <h3><Target size={16} /> Primary Goal</h3>
                        <div className="goal-selector">
                            {['loss', 'gain', 'maintain'].map(g => (
                                <button
                                    key={g}
                                    className={`goal-btn ${goal === g ? 'active' : ''}`}
                                    style={goal === g ? { background: goalColors[g], borderColor: goalColors[g] } : {}}
                                    onClick={() => setGoal(g)}
                                >
                                    {g === 'loss' ? '⚡ Weight Loss' : g === 'gain' ? '💪 Muscle Gain' : '⚖️ Maintain'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="control-block">
                        <h3><Utensils size={16} /> Dietary Preference</h3>
                        <div className="goal-selector">
                            {['Vegetarian', 'Non-Veg', 'Vegan', 'Keto'].map(type => (
                                <button
                                    key={type}
                                    className={`goal-btn ${dietType === type ? 'active' : ''}`}
                                    onClick={() => setDietType(type)}
                                >{type}</button>
                            ))}
                        </div>
                    </div>
                    <div className="control-block">
                        <h3><Zap size={16} /> Allergies / Restrictions</h3>
                        <div className="filters-grid">
                            {['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Soy', 'Eggs'].map(item => (
                                <label key={item} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={allergies.includes(item)}
                                        onChange={(e) => {
                                            if (e.target.checked) setAllergies([...allergies, item]);
                                            else setAllergies(allergies.filter(a => a !== item));
                                        }}
                                    />
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <button className={`generate-btn ${loading ? 'loading' : ''}`} onClick={handleGenerate} disabled={loading}>
                    {loading ? <span className="spinner" /> : <RefreshCw size={18} />}
                    {loading ? 'Generating your AI plan…' : '✨ Generate My Diet Plan'}
                </button>
            </div>

            {/* ── AI DASHBOARD ── */}
            {generated && (
                <div className="ai-dashboard fade-in">
                    {/* Dashboard Header */}
                    <div className="dash-title-row">
                        <div className="dash-title">
                            <span className="dash-badge" style={{ background: goalColors[goal] }}>
                                {goalLabels[goal]}
                            </span>
                            <h2>Your AI Diet Dashboard</h2>
                            <p>Personalized plan for {dietType} diet{allergies.length > 0 ? ` · Avoiding: ${allergies.join(', ')}` : ''}</p>
                        </div>
                        <button className="weekly-toggle-btn" onClick={() => setShowWeekly(v => !v)}>
                            <Calendar size={16} />
                            {showWeekly ? 'Hide Weekly View' : 'Show Weekly Schedule'}
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="dash-stats-row">
                        <div className="dash-stat-card">
                            <Flame size={22} color="#ef4444" />
                            <div>
                                <div className="ds-num">{plan.calories.toLocaleString()}</div>
                                <div className="ds-label">Daily Calories</div>
                            </div>
                        </div>
                        <div className="dash-stat-card">
                            <Zap size={22} color="#10b981" />
                            <div>
                                <div className="ds-num">{plan.protein}g</div>
                                <div className="ds-label">Protein</div>
                            </div>
                        </div>
                        <div className="dash-stat-card">
                            <Wheat size={22} color="#f59e0b" />
                            <div>
                                <div className="ds-num">{plan.carbs}g</div>
                                <div className="ds-label">Carbohydrates</div>
                            </div>
                        </div>
                        <div className="dash-stat-card">
                            <Droplets size={22} color="#3b82f6" />
                            <div>
                                <div className="ds-num">{plan.fat}g</div>
                                <div className="ds-label">Healthy Fats</div>
                            </div>
                        </div>
                    </div>

                    {/* Nutrition Overview */}
                    <div className="nutrition-overview">
                        <div className="nutrition-chart-card glass-panel">
                            <h3>📊 Calorie Goal</h3>
                            <CalorieRing calories={plan.calories} goal={goal} />
                            <div className="cal-breakdown">
                                {plan.meals.map(m => (
                                    <div key={m.type} className="cal-row">
                                        <span className="cal-meal-emoji">{m.emoji}</span>
                                        <span className="cal-meal-label">{m.type}</span>
                                        <div className="cal-bar-wrap">
                                            <div
                                                className="cal-bar"
                                                style={{
                                                    width: `${(m.cal / plan.calories) * 100}%`,
                                                    background: m.color
                                                }}
                                            />
                                        </div>
                                        <span className="cal-meal-num">{m.cal} kcal</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="nutrition-chart-card glass-panel">
                            <h3>🥦 Macronutrient Breakdown</h3>
                            <MacroPieChart protein={plan.protein} carbs={plan.carbs} fat={plan.fat} />
                            <div className="macro-bars">
                                {[
                                    { label: 'Protein', val: plan.protein, max: 250, color: '#10b981', icon: '💪' },
                                    { label: 'Carbs', val: plan.carbs, max: 400, color: '#f59e0b', icon: '⚡' },
                                    { label: 'Fat', val: plan.fat, max: 120, color: '#3b82f6', icon: '🫧' },
                                ].map(m => (
                                    <div key={m.label} className="mbar-row">
                                        <span className="mbar-icon">{m.icon}</span>
                                        <span className="mbar-label">{m.label}</span>
                                        <div className="mbar-track">
                                            <div
                                                className="mbar-fill"
                                                style={{ width: `${(m.val / m.max) * 100}%`, background: m.color }}
                                            />
                                        </div>
                                        <span className="mbar-val">{m.val}g</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Meal Cards */}
                    <div className="meals-section">
                        <div className="meals-section-header">
                            <h3>🍽️ Today's Meal Plan</h3>
                            <span className="meals-count">{plan.meals.length} meals · {plan.calories} kcal</span>
                        </div>
                        <div className="meals-grid">
                            {plan.meals.map((meal, i) => (
                                <MealCard key={meal.type} meal={meal} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Weekly Schedule */}
                    {showWeekly && <WeeklySchedule weekly={plan.weekly} />}

                    {/* Tips */}
                    <div className="diet-tips glass-panel">
                        <h3>💡 AI Nutrition Tips</h3>
                        <div className="tips-grid">
                            {[
                                { icon: '💧', title: 'Hydration', text: 'Drink at least 2.5L of water daily to support your metabolism.' },
                                { icon: '⏰', title: 'Meal Timing', text: 'Eat every 3-4 hours to keep your metabolism active throughout the day.' },
                                { icon: '🌙', title: 'Night Routine', text: 'Avoid heavy meals 2-3 hours before bedtime for better sleep quality.' },
                                { icon: '🏃', title: 'Exercise Sync', text: 'Schedule your carb-heavy meals around your workout for optimal energy.' },
                            ].map(tip => (
                                <div key={tip.title} className="tip-card">
                                    <div className="tip-icon">{tip.icon}</div>
                                    <div>
                                        <div className="tip-title">{tip.title}</div>
                                        <div className="tip-text">{tip.text}</div>
                                    </div>
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
