// client/src/auth/AuthContext.jsx

import { createContext, useContext } from 'react';

// 1. Define the context object
export const AuthContext = createContext(null);

// 2. Define the hook for convenience
export const useAuth = () => useContext(AuthContext);