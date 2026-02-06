import React, { useState } from 'react';
import { Utensils, Coffee, Sun, Moon, ChefHat, RefreshCw } from 'lucide-react';
import './DietPlanner.css';

const MEAL_PLANS = {
    loss: [
        { type: 'Breakfast', time: '8:00 AM', name: 'Oatmeal with Berries', cal: 350, icon: <Coffee size={20} /> },
        { type: 'Lunch', time: '1:00 PM', name: 'Grilled Chicken Salad', cal: 450, icon: <Sun size={20} /> },
        { type: 'Snack', time: '4:00 PM', name: 'Greek Yogurt & Almonds', cal: 150, icon: <Utensils size={20} /> },
        { type: 'Dinner', time: '8:00 PM', name: 'Steamed Fish & Veggies', cal: 400, icon: <Moon size={20} /> }
    ],
    gain: [
        { type: 'Breakfast', time: '8:00 AM', name: '3 Eggs & Avocado Toast', cal: 600, icon: <Coffee size={20} /> },
        { type: 'Lunch', time: '1:00 PM', name: 'Rice, Chicken & Beans', cal: 800, icon: <Sun size={20} /> },
        { type: 'Snack', time: '4:00 PM', name: 'Peanut Butter Smoothie', cal: 400, icon: <Utensils size={20} /> },
        { type: 'Dinner', time: '8:00 PM', name: 'Pasta with Meat Sauce', cal: 700, icon: <Moon size={20} /> }
    ]
};

const DietPlanner = () => {
    const [goal, setGoal] = useState('loss');
    const [dietType, setDietType] = useState('Vegetarian');
    const [allergies, setAllergies] = useState([]);
    const [deficiencies, setDeficiencies] = useState([]);
    const [generated, setGenerated] = useState(false);

    const handleGenerate = () => {
        setGenerated(false);
        setTimeout(() => setGenerated(true), 800);
    };

    return (
        <div className="diet-container fade-in">
            <div className="diet-header glass-panel">
                <div className="header-icon">
                    <ChefHat size={32} />
                </div>
                <div>
                    <h1>Smart Diet Planner</h1>
                    <p>Personalized meal plans based on your health goals.</p>
                </div>
            </div>

            <div className="controls-section glass-panel">
                <h3>1. What is your primary goal?</h3>
                <div className="goal-selector">
                    <button
                        className={`goal-btn ${goal === 'loss' ? 'active' : ''}`}
                        onClick={() => setGoal('loss')}
                    >
                        Weight Loss
                    </button>
                    <button
                        className={`goal-btn ${goal === 'gain' ? 'active' : ''}`}
                        onClick={() => setGoal('gain')}
                    >
                        Muscle Gain
                    </button>
                    <button
                        className={`goal-btn ${goal === 'maintain' ? 'active' : ''}`}
                        onClick={() => setGoal('maintain')}
                    >
                        Maintain
                    </button>
                </div>

                <div className="diet-filters-section" style={{ marginTop: '2rem' }}>
                    <h3>2. Dietary Preferences</h3>
                    <div className="goal-selector" style={{ marginBottom: '1.5rem' }}>
                        {['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto'].map(type => (
                            <button
                                key={type}
                                className={`goal-btn ${dietType === type ? 'active' : ''}`}
                                onClick={() => setDietType(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <h3>3. Allergies / Restrictions</h3>
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



                <button className="generate-btn" onClick={handleGenerate} style={{ marginTop: '2rem' }}>
                    <RefreshCw size={18} /> Generate Plan
                </button>
            </div>

            {generated && (
                <div className="meal-plan-grid fade-in">
                    {(MEAL_PLANS[goal] || MEAL_PLANS.loss).map((meal, index) => (
                        <div key={index} className="meal-card glass-panel" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="meal-header">
                                <span className="meal-type">{meal.type}</span>
                                <span className="meal-time">{meal.time}</span>
                            </div>
                            <div className="meal-body">
                                <div className="meal-icon">{meal.icon}</div>
                                <h4>{meal.name}</h4>
                                <div className="meal-cal">{meal.cal} kcal</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DietPlanner;
