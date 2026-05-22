import React from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { Navigate, Outlet } from 'react-router-dom';
 
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};
 
export default ProtectedRoute;








// src/pages/ProtectedRoute.jsx

// import React from 'react';
// import { useAuth } from '../auth/AuthContext.jsx'; // Adjust path if AuthContext is in src/
// import { Navigate, Outlet } from 'react-router-dom';

// const ProtectedRoute = () => {
//     const { isAuthenticated } = useAuth();
    
//     // If authenticated, allow access (Outlet renders the child route, e.g., Dashboard)
//     // If not, redirect to the login page
//     return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
// };

// export default ProtectedRoute;