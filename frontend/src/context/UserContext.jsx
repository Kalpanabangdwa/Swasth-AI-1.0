import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({
        name: 'Guest',
        email: '',
        phone: '',
        address: '',
        age: '',
        bloodGroup: '',
        height: '',
        weight: ''
    });

    // ── Shared Appointments State ──
    const [appointments, setAppointments] = useState([]);

    const addAppointment = (appt) => {
        setAppointments(prev => [...prev, { ...appt, id: Date.now() }]);
    };

    const deleteAppointment = (id) => {
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    // ── Shared Health Metrics State ──
    const [healthMetrics, setHealthMetrics] = useState({
        waterGlasses: 0,
        sleepHours: 0,
        mood: '',          // "Great" | "Good" | "Okay" | "Poor"
        foodLog: [],       // [{ name, calories }]
        calGoal: 2000,
    });

    const updateHealthMetrics = (data) => {
        setHealthMetrics(prev => ({ ...prev, ...data }));
    };

    const addFoodEntry = (entry) => {
        setHealthMetrics(prev => ({
            ...prev,
            foodLog: [...prev.foodLog, { ...entry, id: Date.now() }]
        }));
    };

    const removeFoodEntry = (id) => {
        setHealthMetrics(prev => ({
            ...prev,
            foodLog: prev.foodLog.filter(f => f.id !== id)
        }));
    };

    // ── Auth ──
    const login = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
        setIsAuthenticated(true);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser({ name: 'Guest' });
        setAppointments([]);
        setHealthMetrics({ waterGlasses: 0, sleepHours: 0, mood: '', foodLog: [], calGoal: 2000 });
    };

    const updateUser = (newUserData) => {
        setUser(prev => ({ ...prev, ...newUserData }));
    };

    return (
        <UserContext.Provider value={{
            user, isAuthenticated, login, logout, updateUser,
            appointments, addAppointment, deleteAppointment,
            healthMetrics, updateHealthMetrics, addFoodEntry, removeFoodEntry
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
