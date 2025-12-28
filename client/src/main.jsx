// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )


// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx'; 
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import LeadList from './pages/LeadList.jsx';
import ProtectedRoute from './pages/ProtectedRoute.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Route: Chatbot Interface (Root path) */}
                    <Route path="/" element={<App />} /> 
                    
                    {/* Public Route: Admin Login */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/leads" element={<LeadList />} />


                    </Route>

                    {/* Catch-all for 404s */}
                    <Route path="*" element={<h1>404: Not Found</h1>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>,
);
