// client/src/auth/AuthProvider.jsx

import React, { useState } from 'react';
import { AuthContext, } from './AuthContext.jsx'; // Import definitions

// The AuthProvider component manages the state and provides values
export const AuthProvider = ({ children }) => {
    // State only for the token (the source of truth)
    const [authToken, setAuthToken] = useState(localStorage.getItem('adminToken'));

    // Derived State (The Fix from last step, eliminating unnecessary useEffect)
    const isAuthenticated = !!authToken; 

    const login = (token) => {
        localStorage.setItem('adminToken', token);
        setAuthToken(token);
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setAuthToken(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};