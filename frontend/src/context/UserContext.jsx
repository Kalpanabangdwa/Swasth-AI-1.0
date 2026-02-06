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

    const login = (userData) => {
        setUser((prev) => ({ ...prev, ...userData }));
        setIsAuthenticated(true);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser({ name: 'Guest' }); // Reset or keep basic defaults
    };

    const updateUser = (newUserData) => {
        setUser((prev) => ({ ...prev, ...newUserData }));
    };

    return (
        <UserContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
