import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();
const API = 'http://127.0.0.1:8000';

// Simple password hash (for demo — in production use bcrypt on backend)
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const UserProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [user, setUser] = useState({
        name: 'Guest', email: '', phone: '', address: '',
        age: '', bloodGroup: '', height: '', weight: '',
        height_cm: '', weight_kg: '', goal: '', preference: '',
        allergies: '', activity_level: '', medical_conditions: '',
    });

    // ── Persist login across page refresh ──
    useEffect(() => {
        const saved = localStorage.getItem('swasth_user');
        const savedAuth = localStorage.getItem('swasth_auth');
        if (saved && savedAuth === 'true') {
            setUser(JSON.parse(saved));
            setIsAuthenticated(true);
        }
    }, []);

    // ── Appointments ──
    const [appointments, setAppointments] = useState([]);
    const addAppointment    = (appt) => setAppointments(prev => [...prev, { ...appt, id: Date.now() }]);
    const deleteAppointment = (id)   => setAppointments(prev => prev.filter(a => a.id !== id));

    // ── Health Metrics ──
    const [healthMetrics, setHealthMetrics] = useState({
        waterGlasses: 0, sleepHours: 0, mood: '', foodLog: [], calGoal: 2000,
    });
    const updateHealthMetrics = (data) => setHealthMetrics(prev => ({ ...prev, ...data }));
    const addFoodEntry  = (entry) => setHealthMetrics(prev => ({ ...prev, foodLog: [...prev.foodLog, { ...entry, id: Date.now() }] }));
    const removeFoodEntry = (id)  => setHealthMetrics(prev => ({ ...prev, foodLog: prev.foodLog.filter(f => f.id !== id) }));

    // ── LOGIN ──
    const login = async (userData) => {
        try {
            const res = await fetch(`${API}/user/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: userData.email, name: userData.name }),
            });

            if (res.ok) {
                const backendUser = await res.json();
                const merged = {
                    ...userData,
                    ...backendUser,
                    height: backendUser.height_cm || userData.height || '',
                    weight: backendUser.weight_kg || userData.weight || '',
                };
                setUser(merged);

                // Check if profile is complete — if not, show onboarding
                const needsProfile = !backendUser.age || !backendUser.weight_kg || !backendUser.height_cm;
                setNeedsOnboarding(needsProfile);

                // Persist to localStorage
                localStorage.setItem('swasth_user', JSON.stringify(merged));
                localStorage.setItem('swasth_auth', 'true');
            } else {
                setUser(prev => ({ ...prev, ...userData }));
                setNeedsOnboarding(true);
                localStorage.setItem('swasth_user', JSON.stringify({ ...user, ...userData }));
                localStorage.setItem('swasth_auth', 'true');
            }
        } catch (err) {
            console.warn('Backend unavailable:', err.message);
            setUser(prev => ({ ...prev, ...userData }));
            setNeedsOnboarding(true);
            localStorage.setItem('swasth_user', JSON.stringify({ ...user, ...userData }));
            localStorage.setItem('swasth_auth', 'true');
        }
        setIsAuthenticated(true);
    };

    // ── COMPLETE ONBOARDING ──
    const completeOnboarding = async (profileData) => {
        const updated = { ...user, ...profileData };
        setUser(updated);
        setNeedsOnboarding(false);
        localStorage.setItem('swasth_user', JSON.stringify(updated));

        // Save to backend
        if (updated.email) {
            try {
                await fetch(`${API}/user/profile`, {
                    method:  'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        email:              updated.email,
                        name:               updated.name,
                        age:                parseInt(updated.age)         || null,
                        weight_kg:          parseFloat(updated.weight_kg || updated.weight) || null,
                        height_cm:          parseFloat(updated.height_cm || updated.height) || null,
                        goal:               updated.goal               || null,
                        preference:         updated.preference         || null,
                        activity_level:     updated.activity_level     || null,
                        allergies:          updated.allergies          || null,
                        medical_conditions: updated.medical_conditions || null,
                    }),
                });
            } catch (err) {
                console.warn('Could not save profile to backend:', err.message);
            }
        }
    };

    // ── LOGOUT ──
    const logout = () => {
        setIsAuthenticated(false);
        setNeedsOnboarding(false);
        setUser({ name:'Guest', email:'', phone:'', address:'', age:'', bloodGroup:'', height:'', weight:'', height_cm:'', weight_kg:'', goal:'', preference:'', allergies:'', activity_level:'', medical_conditions:'' });
        setAppointments([]);
        setHealthMetrics({ waterGlasses:0, sleepHours:0, mood:'', foodLog:[], calGoal:2000 });
        localStorage.removeItem('swasth_user');
        localStorage.removeItem('swasth_auth');
    };

    // ── UPDATE USER ──
    const updateUser = async (newUserData) => {
        const updated = { ...user, ...newUserData };
        setUser(updated);
        localStorage.setItem('swasth_user', JSON.stringify(updated));

        const email = newUserData.email || user.email;
        if (!email) return;
        try {
            await fetch(`${API}/user/profile`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    email,
                    name:               updated.name,
                    age:                parseInt(updated.age)                              || null,
                    weight_kg:          parseFloat(updated.weight_kg || updated.weight)    || null,
                    height_cm:          parseFloat(updated.height_cm || updated.height)    || null,
                    goal:               updated.goal               || null,
                    preference:         updated.preference         || null,
                    activity_level:     updated.activity_level     || null,
                    allergies:          updated.allergies          || null,
                    medical_conditions: updated.medical_conditions || null,
                }),
            });
        } catch (err) {
            console.warn('Could not sync profile:', err.message);
        }
    };

    return (
        <UserContext.Provider value={{
            user, isAuthenticated, needsOnboarding,
            login, logout, updateUser, completeOnboarding,
            appointments, addAppointment, deleteAppointment,
            healthMetrics, updateHealthMetrics, addFoodEntry, removeFoodEntry,
            API,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);