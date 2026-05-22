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
      const response = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-void)',
      fontFamily: 'var(--font-ui)',
      padding: '16px',
    }}>
      {/* Glow orb behind card */}
      <div style={{
        position: 'fixed',
        top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
 
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.4s ease both',
        position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--amber), transparent)',
          borderRadius: 99,
        }} />
 
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            borderRadius: 12,
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, margin: '0 auto 16px',
          }}>⬡</div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-hi)', marginBottom: 4 }}>
            Admin Access
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-md)', fontFamily: 'var(--font-mono)' }}>
            AI SRS PLATFORM · SECURE ZONE
          </p>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit}>
 
          {error && (
            <div style={{
              marginBottom: 18,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245,101,101,0.08)',
              border: '1px solid rgba(245,101,101,0.25)',
              color: 'var(--red-err)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
            }}>
              ✕ {error}
            </div>
          )}
 
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-md)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 6,
            }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="admin"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
 
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-md)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 6,
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
 
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'linear-gradient(135deg, #f5a623, #e8960f)',
              color: '#080b10',
              fontWeight: 700,
              fontSize: '0.88rem',
              letterSpacing: '0.03em',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.15s',
              boxShadow: '0 0 20px rgba(245,166,35,0.25)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 28px rgba(245,166,35,0.45)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(245,166,35,0.25)'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Sign In
          </button>
        </form>
 
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-lo)',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--amber)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
          >
            ← BACK TO CHATBOT
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default AdminLogin;






// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../auth/AuthContext.jsx';

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const AdminLogin = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!username || !password) {
//       setError('Username and password are required.');
//       return;
//     }

//     try {
//       const response = await axios.post(`${API_BASE_URL}/admin/login`, {
//         username,
//         password
//       });

//       if (response.data.token) {
//         login(response.data.token);
//         navigate('/admin/dashboard', { replace: true });
//       }
//     } catch (err) {
//       console.error('Login failed:', err);
//       setError('Invalid credentials. Access denied.');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">

//       <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-8">

//         {/* Header */}
//         <div className="mb-6 text-center">
//           <h1 className="text-2xl font-semibold text-slate-800">
//             Admin Login
//           </h1>
//           <p className="text-sm text-slate-500 mt-1">
//             Secure access to the AI SRS platform
//           </p>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-4">

//           {error && (
//             <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
//               {error}
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-slate-600 mb-1">
//               Username
//             </label>
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               required
//               className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//               placeholder="admin"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-600 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
//               placeholder="••••••••"
//             />
//           </div>

//           <button
//             type="submit"
//             className="w-full mt-2 px-4 py-2 rounded-md bg-indigo-600 text-grey text-sm font-medium hover:bg-indigo-500 transition"
//           >
//             Sign In
//           </button>
//         </form>

//         {/* Footer */}
//         <div className="mt-6 text-center">
//           <button
//             onClick={() => navigate('/')}
//             className="text-sm text-slate-500 hover:text-indigo-600 transition"
//           >
//             ← Back to chatbot
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default AdminLogin;




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