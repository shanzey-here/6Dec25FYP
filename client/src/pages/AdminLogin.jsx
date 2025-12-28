// client/src/pages/AdminLogin.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx'; // Path depends on where AuthContext is placed

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Username and password are required.');
            return;
        }

        try {
            // Call the Flask login endpoint
            const response = await axios.post(`${API_BASE_URL}/admin/login`, {
                username,
                password,
            });

            // If login successful, save the token and redirect
            if (response.data.token) {
                login(response.data.token);
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err) {
            console.error("Login failed:", err);
            // Show generic error message for security
            setError('Invalid credentials. Access denied.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h2>Admin Panel Login</h2>
                <p className="login-tip">Use credentials from your server/.env file (default: admin/securepassword)</p>
                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Log In</button>
                </form>
                <button className="back-button" onClick={() => navigate('/')}>
                    ← Back to Chatbot
                </button>
            </div>
        </div>
    );
};

export default AdminLogin;