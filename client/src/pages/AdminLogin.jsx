import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

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
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        username,
        password
      });

      if (response.data.token) {
        login(response.data.token);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Invalid credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">
            Admin Login
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure access to the AI SRS platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-indigo-600 transition"
          >
            ← Back to chatbot
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;




// client/src/pages/AdminLogin.jsx

// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../auth/AuthContext.jsx'; // Path depends on where AuthContext is placed

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const AdminLogin = () => {
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const { login } = useAuth();
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');

//         if (!username || !password) {
//             setError('Username and password are required.');
//             return;
//         }

//         try {
//             // Call the Flask login endpoint
//             const response = await axios.post(`${API_BASE_URL}/admin/login`, {
//                 username,
//                 password,
//             });

//             // If login successful, save the token and redirect
//             if (response.data.token) {
//                 login(response.data.token);
//                 navigate('/admin/dashboard', { replace: true });
//             }
//         } catch (err) {
//             console.error("Login failed:", err);
//             // Show generic error message for security
//             setError('Invalid credentials. Access denied.');
//         }
//     };

//     return (
//         <div className="login-wrapper">
//             <div className="login-container">
//                 <h2>Admin Panel Login</h2>
//                 <p className="login-tip">Use credentials from your server/.env file (default: admin/securepassword)</p>
//                 <form onSubmit={handleSubmit}>
//                     {error && <p className="error-message">{error}</p>}
//                     <input
//                         type="text"
//                         placeholder="Username"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                     />
//                     <input
//                         type="password"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                     />
//                     <button type="submit">Log In</button>
//                 </form>
//                 <button className="back-button" onClick={() => navigate('/')}>
//                     ← Back to Chatbot
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default AdminLogin;