import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
 
const STATUS_COLORS = {
  New:                   '#f5a623',
  Qualified:             '#5b8af5',
  Requirements_Gathering:'#a78bfa',
  SRS_Generated:         '#3ecf8e',
};
 
/* ─── custom tooltip ───────────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161e28',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: '0.78rem',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#eaf0f8',
    }}>
      {label && <div style={{ color: '#8b9ab0', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#f5a623' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};
 
const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/dashboard/summary`);
        setSummary(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchSummaryData();
    else navigate('/admin/login');
  }, [authToken, navigate]);
 
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', color: 'var(--text-md)',
      fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em',
    }}>
      LOADING DASHBOARD…
    </div>
  );
 
  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', color: 'var(--red-err)',
      fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
    }}>
      ✕ {error}
    </div>
  );
 
  if (!summary) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', color: 'var(--text-lo)',
      fontFamily: 'var(--font-mono)',
    }}>
      NO DATA AVAILABLE
    </div>
  );
 
  const statusData = summary.status_distribution
    .filter(d => d.count > 0)
    .map(item => ({
      name: item.status,
      value: item.count,
      color: STATUS_COLORS[item.status] || '#4a5668',
    }));
 
  const requirementMetrics = [
    { subject: 'Requirements', A: summary.total_requirements || 0 },
    { subject: 'Avg / Lead',   A: summary.avg_requirements_per_lead || 0 },
    { subject: 'SRS Docs',     A: summary.srs_documents_generated || 0 },
    {
      subject: 'Qualified %',
      A: (((summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0)
        / summary.total_leads) * 100) || 0,
    },
  ];
 
  const qualifiedCount = summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0;
  const qualRate = ((qualifiedCount / summary.total_leads) * 100).toFixed(1);
 
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      fontFamily: 'var(--font-ui)',
      padding: '0 0 48px',
    }}>
 
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header style={{
        background: 'rgba(8,11,16,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 28px',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--amber-dim)', border: '1px solid var(--amber-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--amber)',
            }}>⬡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-hi)' }}>
                AI Requirements Platform
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                ADMIN DASHBOARD
              </div>
            </div>
          </div>
 
          <div style={{ display: 'flex', gap: 10 }}>
            <HeaderBtn onClick={() => navigate('/admin/leads')} label="View Leads" />
            <HeaderBtn onClick={logout} label="Logout" accent />
          </div>
        </div>
      </header>
 
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 28px 0' }}>
 
        {/* ── KPI CARDS ─────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 36,
        }}>
          <KpiCard title="Total Projects"       value={summary.total_leads}                          />
          <KpiCard title="Total Requirements"   value={summary.total_requirements}
                   sub={`${summary.avg_requirements_per_lead?.toFixed(1)} per project`} />
          <KpiCard title="SRS Documents"        value={summary.srs_documents_generated}              />
          <KpiCard title="Qualification Rate"   value={`${qualRate}%`} accent                        />
        </div>
 
        {/* ── CHARTS ────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}>
 
          <ChartCard title="Project Status Distribution">
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={100}
                     strokeWidth={0} paddingAngle={3}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: 'var(--text-md)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
 
          <ChartCard title="Requirements Metrics">
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart data={requirementMetrics}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject"
                  tick={{ fill: 'var(--text-md)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                <PolarRadiusAxis tick={{ fill: 'var(--text-lo)', fontSize: 9 }} axisLine={false} />
                <Radar dataKey="A" stroke="#f5a623" fill="#f5a623" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
 
        </div>
 
        <ChartCard title="Requirements Growth Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={summary.volume_by_day || []}
              margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f5a623" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f5a623" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis dataKey="date"
                tick={{ fill: 'var(--text-lo)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis
                tick={{ fill: 'var(--text-lo)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="count" name="Requirements"
                stroke="#f5a623" strokeWidth={2}
                fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
 
      </div>
    </div>
  );
};
 
/* ─── Reusable pieces ───────────────────────────────────────────── */
 
const HeaderBtn = ({ onClick, label, accent }) => (
  <button
    onClick={onClick}
    style={{
      padding: '7px 16px',
      borderRadius: 7,
      border: accent ? 'none' : '1px solid var(--border-md)',
      background: accent ? 'linear-gradient(135deg,#f5a623,#e8960f)' : 'var(--bg-raised)',
      color: accent ? '#080b10' : 'var(--text-md)',
      fontSize: '0.8rem',
      fontWeight: 700,
      cursor: 'pointer',
      letterSpacing: '0.02em',
      transition: 'all 0.18s',
    }}
  >
    {label}
  </button>
);
 
const KpiCard = ({ title, value, sub, accent }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: `1px solid ${accent ? 'var(--amber-glow)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    padding: '22px 24px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  }}>
    {accent && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, var(--amber), transparent)',
      }} />
    )}
    <p style={{
      fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--text-lo)', marginBottom: 10,
    }}>{title}</p>
    <p style={{
      fontSize: '2rem', fontWeight: 800,
      color: accent ? 'var(--amber)' : 'var(--text-hi)',
      letterSpacing: '-0.03em', lineHeight: 1,
    }}>{value}</p>
    {sub && (
      <p style={{ fontSize: '0.72rem', color: 'var(--text-lo)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        {sub}
      </p>
    )}
  </div>
);
 
const ChartCard = ({ title, children }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '22px 24px',
  }}>
    <h2 style={{
      fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--text-md)', marginBottom: 20, fontWeight: 500,
    }}>{title}</h2>
    {children}
  </div>
);
 
export default AdminDashboard;










// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../auth/AuthContext.jsx';
// import { useNavigate } from 'react-router-dom';
// import {
//   PieChart,
//   Pie,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Cell,
//   AreaChart,
//   Area,
//   RadarChart,
//   Radar,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis
// } from 'recharts';

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const STATUS_COLORS = {
//   New: '#2563eb',
//   Qualified: '#16a34a',
//   Requirements_Gathering: '#ca8a04',
//   SRS_Generated: '#ea580c'
// };

// const AdminDashboard = () => {
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const { authToken, logout } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSummaryData = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/admin/dashboard/summary`
//         );
//         setSummary(response.data);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load dashboard data.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (authToken) fetchSummaryData();
//     else navigate('/admin/login');
//   }, [authToken, navigate]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
//         Loading dashboard…
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-red-500">
//         {error}
//       </div>
//     );
//   }

//   if (!summary) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-slate-400">
//         No data available.
//       </div>
//     );
//   }

//   const statusData = summary.status_distribution
//     .filter(d => d.count > 0)
//     .map(item => ({
//       name: item.status,
//       value: item.count,
//       color: STATUS_COLORS[item.status] || '#64748b'
//     }));

//   const requirementMetrics = [
//     { subject: 'Requirements', A: summary.total_requirements || 0 },
//     { subject: 'Avg / Lead', A: summary.avg_requirements_per_lead || 0 },
//     { subject: 'SRS Docs', A: summary.srs_documents_generated || 0 },
//     {
//       subject: 'Qualified %',
//       A:
//         ((summary.status_distribution.find(d => d.status === 'Qualified')
//           ?.count || 0) /
//           summary.total_leads) *
//           100 || 0
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 px-6 py-8">

//       {/* Header */}
//       <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
//         <div>
//           <h1 className="text-2xl font-semibold text-slate-800">
//             AI Requirements Platform
//           </h1>
//           <p className="text-sm text-slate-500 mt-1">
//             SRS generation & intelligent lead qualification
//           </p>
//         </div>

//         <div className="flex gap-3 mt-4 md:mt-0">
//           <button
//             onClick={() => navigate('/admin/leads')}
//             className="px-4 py-2 text-sm rounded-md border border-slate-300 bg-white hover:bg-slate-100 transition"
//           >
//             View Leads
//           </button>
//           <button
//             onClick={logout}
//             className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-grey hover:bg-indigo-500 transition"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       {/* KPI Cards */}
//       <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
//         <KpiCard title="Total Projects" value={summary.total_leads} />
//         <KpiCard
//           title="Total Requirements"
//           value={summary.total_requirements}
//           subtitle={`${summary.avg_requirements_per_lead?.toFixed(1)} per project`}
//         />
//         <KpiCard
//           title="SRS Documents"
//           value={summary.srs_documents_generated}
//         />
//         <KpiCard
//           title="Qualification Rate"
//           value={`${(
//             ((summary.status_distribution.find(d => d.status === 'Qualified')
//               ?.count || 0) /
//               summary.total_leads) *
//             100
//           ).toFixed(1)}%`}
//         />
//       </section>

//       {/* Charts */}
//       <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">

//         <ChartCard title="Project Status Distribution">
//           <ResponsiveContainer width="100%" height={280}>
//             <PieChart>
//               <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={100}>
//                 {statusData.map((entry, index) => (
//                   <Cell key={index} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <ChartCard title="Requirements Metrics">
//           <ResponsiveContainer width="100%" height={280}>
//             <RadarChart data={requirementMetrics}>
//               <PolarGrid />
//               <PolarAngleAxis dataKey="subject" />
//               <PolarRadiusAxis />
//               <Radar
//                 dataKey="A"
//                 stroke="#4f46e5"
//                 fill="#4f46e5"
//                 fillOpacity={0.35}
//               />
//               <Tooltip />
//             </RadarChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <div className="xl:col-span-2">
//           <ChartCard title="Requirements Growth">
//             <ResponsiveContainer width="100%" height={300}>
//               <AreaChart data={summary.volume_by_day || []}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Area
//                   type="monotone"
//                   dataKey="count"
//                   stroke="#4f46e5"
//                   fill="#4f46e5"
//                   fillOpacity={0.25}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </ChartCard>
//         </div>

//       </section>
//     </div>
//   );
// };

// /* ---------- Reusable Components ---------- */

// const KpiCard = ({ title, value, subtitle }) => (
//   <div className="bg-white rounded-lg border border-slate-200 p-5 transition hover:shadow-sm">
//     <p className="text-sm text-slate-500">{title}</p>
//     <p className="text-3xl font-semibold text-slate-800 mt-2">{value}</p>
//     {subtitle && (
//       <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
//     )}
//   </div>
// );

// const ChartCard = ({ title, children }) => (
//   <div className="bg-white rounded-lg border border-slate-200 p-6">
//     <h2 className="text-sm font-medium text-slate-700 mb-4">{title}</h2>
//     {children}
//   </div>
// );

// export default AdminDashboard;



// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../auth/AuthContext.jsx';
// import { useNavigate } from 'react-router-dom';
// import {
//   PieChart,
//   Pie,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   Cell,
//   AreaChart,
//   Area,
//   RadarChart,
//   Radar,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis
// } from 'recharts';

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const STATUS_COLORS = {
//   New: '#3b82f6',
//   Qualified: '#22c55e',
//   Requirements_Gathering: '#facc15',
//   SRS_Generated: '#f97316'
// };

// const AdminDashboard = () => {
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const { authToken, logout } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchSummaryData = async () => {
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/admin/dashboard/summary`
//         );
//         setSummary(response.data);
//       } catch (err) {
//         console.error('Failed to fetch dashboard summary:', err);
//         setError('Failed to load dashboard data. Check network or server logs.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (authToken) {
//       fetchSummaryData();
//     } else {
//       navigate('/admin/login');
//     }
//   }, [authToken, navigate]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
//         🚀 Loading SRS Platform Dashboard…
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-red-400">
//         {error}
//       </div>
//     );
//   }

//   if (!summary) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-slate-400">
//         No dashboard data available.
//       </div>
//     );
//   }

//   const statusData = summary.status_distribution
//     .filter(d => d.count > 0)
//     .map(item => ({
//       name: item.status,
//       value: item.count,
//       color: STATUS_COLORS[item.status] || '#8884D8'
//     }));

//   const requirementMetrics = [
//     { subject: 'Requirements', A: summary.total_requirements || 0 },
//     { subject: 'Avg / Lead', A: summary.avg_requirements_per_lead || 0 },
//     { subject: 'SRS Docs', A: summary.srs_documents_generated || 0 },
//     {
//       subject: 'Qualified %',
//       A:
//         ((summary.status_distribution.find(d => d.status === 'Qualified')
//           ?.count || 0) /
//           summary.total_leads) *
//           100 || 0
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">

//       {/* Header */}
//       <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">
//             AI Requirements Engineering Platform
//           </h1>
//           <p className="text-slate-400 mt-1">
//             Complete SRS generation & lead qualification
//           </p>
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={() => navigate('/admin/leads')}
//             className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm"
//           >
//             📋 View Leads
//           </button>
//           <button
//             onClick={logout}
//             className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 transition text-sm"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       {/* KPI Cards */}
//       <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
//         <KpiCard title="Total Projects" value={summary.total_leads} icon="📈" />
//         <KpiCard
//           title="Requirements"
//           value={summary.total_requirements}
//           subtitle={`${summary.avg_requirements_per_lead?.toFixed(1)} per project`}
//           icon="📋"
//         />
//         <KpiCard
//           title="SRS Generated"
//           value={summary.srs_documents_generated}
//           icon="📄"
//         />
//         <KpiCard
//           title="Qualification Rate"
//           value={`${(
//             ((summary.status_distribution.find(d => d.status === 'Qualified')
//               ?.count || 0) /
//               summary.total_leads) *
//             100
//           ).toFixed(1)}%`}
//           icon="✅"
//         />
//       </section>

//       {/* Charts */}
//       <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">

//         <ChartCard
//           title="Project Status Distribution"
//           subtitle="Lead qualification funnel"
//         >
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={statusData}
//                 dataKey="value"
//                 nameKey="name"
//                 innerRadius={60}
//                 outerRadius={100}
//               >
//                 {statusData.map((entry, index) => (
//                   <Cell key={index} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <ChartCard
//           title="Requirements Metrics"
//           subtitle="Platform performance indicators"
//         >
//           <ResponsiveContainer width="100%" height={300}>
//             <RadarChart data={requirementMetrics}>
//               <PolarGrid />
//               <PolarAngleAxis dataKey="subject" />
//               <PolarRadiusAxis />
//               <Radar
//                 dataKey="A"
//                 stroke="#8b5cf6"
//                 fill="#8b5cf6"
//                 fillOpacity={0.5}
//               />
//               <Tooltip />
//             </RadarChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         <div className="xl:col-span-2">
//           <ChartCard
//             title="Requirements Growth"
//             subtitle="Cumulative requirements over time"
//           >
//             <ResponsiveContainer width="100%" height={320}>
//               <AreaChart data={summary.volume_by_day || []}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Area
//                   type="monotone"
//                   dataKey="count"
//                   stroke="#8b5cf6"
//                   fill="#8b5cf6"
//                   fillOpacity={0.25}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </ChartCard>
//         </div>

//       </section>
//     </div>
//   );
// };

// const KpiCard = ({ title, value, subtitle, icon }) => (
//   <div className="bg-slate-800/70 backdrop-blur rounded-xl p-6 border border-slate-700 hover:border-violet-500/40 transition">
//     <div className="flex items-center justify-between">
//       <p className="text-slate-400 text-sm">{title}</p>
//       <span className="text-xl">{icon}</span>
//     </div>
//     <p className="text-3xl font-bold mt-2">{value}</p>
//     {subtitle && (
//       <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
//     )}
//   </div>
// );

// const ChartCard = ({ title, subtitle, children }) => (
//   <div className="bg-slate-800/70 backdrop-blur rounded-xl p-6 border border-slate-700">
//     <div className="mb-4">
//       <h2 className="font-semibold text-lg">{title}</h2>
//       <p className="text-slate-400 text-sm">{subtitle}</p>
//     </div>
//     {children}
//   </div>
// );

// export default AdminDashboard;



// client/src/pages/AdminDashboard.jsx (ENHANCED FOR SRS PLATFORM)

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../auth/AuthContext.jsx';
// import { useNavigate } from 'react-router-dom';
// import {
//     PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
//     ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area, 
//     RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
// } from 'recharts';

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// // Color palette
// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
// const STATUS_COLORS = {
//     'New': '#0088FE',
//     'Qualified': '#00C49F',
//     'Requirements_Gathering': '#FFBB28',
//     'SRS_Generated': '#FF8042'
// };

// const AdminDashboard = () => {
//     const [summary, setSummary] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const { authToken, logout } = useAuth();
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchSummaryData = async () => {
//             try {
//                 const response = await axios.get(`${API_BASE_URL}/admin/dashboard/summary`);
//                 setSummary(response.data);
//             } catch (err) {
//                 console.error("Failed to fetch dashboard summary:", err);
//                 setError("Failed to load dashboard data. Check network or server logs.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (authToken) {
//             fetchSummaryData();
//         } else {
//             navigate('/admin/login');
//         }
//     }, [authToken, navigate]);

//     const renderMetricCard = (title, value, subtitle = '', icon = '📊') => (
//         <div className="metric-card">
//             <div className="metric-icon">{icon}</div>
//             <div className="metric-content">
//                 <h3>{title}</h3>
//                 <p className="metric-value">{value}</p>
//                 {subtitle && <p className="metric-subtitle">{subtitle}</p>}
//             </div>
//         </div>
//     );

//     if (loading) return <div className="dashboard-loading">🚀 Loading SRS Platform Dashboard...</div>;
//     if (error) return <div className="dashboard-error">{error}</div>;
//     if (!summary) return <div className="dashboard-empty">No dashboard data available.</div>;

//     // Prepare chart data
//     const statusData = summary.status_distribution
//         .filter(d => d.count > 0)
//         .map(item => ({
//             name: item.status,
//             value: item.count,
//             color: STATUS_COLORS[item.status] || '#8884D8'
//         }));

//     // const recentLeads = summary.recent_leads || [];
    
//     // Requirements metrics
//     const requirementMetrics = [
//         { subject: 'Requirements', A: summary.total_requirements || 0, fullMark: 100 },
//         { subject: 'Avg/Lead', A: summary.avg_requirements_per_lead || 0, fullMark: 20 },
//         { subject: 'SRS Docs', A: summary.srs_documents_generated || 0, fullMark: 10 },
//         { subject: 'Qualified %', A: ((summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0) / summary.total_leads * 100) || 0, fullMark: 100 },
//     ];
//     return (
//         <div className="srs-dashboard-container">
            
//             {/* Header */}
//             <header className="dashboard-header">
//                 <div className="header-left">
//                     <h1>🤖 AI Requirements Engineering Platform</h1>
//                     <p className="subtitle">Complete SRS Generation & Management</p>
//                 </div>
//                 <nav>
//                     <button className="nav-button" onClick={() => navigate('/admin/leads')}>
//                         📋 View All Leads
//                     </button>
//                     {/* <button className="nav-button primary" onClick={() => navigate('/admin/requirements')}>
//                         📝 Requirements Hub
//                     </button> */}
//                     <button className="nav-button logout-button" onClick={logout}>
//                         🚪 Logout
//                     </button>
//                 </nav>
//             </header>

//             {/* Quick Stats Row */}
//             <div className="quick-stats-row">
//                 {renderMetricCard(
//                     "Total Projects", 
//                     summary.total_leads, 
//                     "Leads captured",
//                     "📈"
//                 )}
//                 {renderMetricCard(
//                     "Requirements", 
//                     summary.total_requirements, 
//                     `${summary.avg_requirements_per_lead?.toFixed(1)} per project`,
//                     "📋"
//                 )}
//                 {renderMetricCard(
//                     "SRS Generated", 
//                     summary.srs_documents_generated, 
//                     "Documents created",
//                     "📄"
//                 )}
//                 {renderMetricCard(
//                     "Qualification Rate", 
//                     `${((summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0) / summary.total_leads * 100).toFixed(1)}%`, 
//                     "Of total leads",
//                     "✅"
//                 )}
//             </div>

//             {/* Main Charts Grid */}
//             <div className="charts-grid">
                
//                 {/* Project Status Funnel */}
//                 <div className="chart-panel">
//                     <div className="chart-header">
//                         <h2>📊 Project Status Distribution</h2>
//                         <span className="chart-subtitle">Lead qualification funnel</span>
//                     </div>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                             <Pie
//                                 data={statusData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 cx="50%"
//                                 cy="50%"
//                                 innerRadius={60}
//                                 outerRadius={100}
//                                 paddingAngle={5}
//                                 label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                             >
//                                 {statusData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={entry.color} />
//                                 ))}
//                             </Pie>
//                             <Tooltip formatter={(value, name) => [`${value} projects`, name]} />
//                             <Legend />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* Requirements Metrics Radar */}
//                 <div className="chart-panel">
//                     <div className="chart-header">
//                         <h2>📈 Requirements Metrics</h2>
//                         <span className="chart-subtitle">Platform performance indicators</span>
//                     </div>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <RadarChart data={requirementMetrics}>
//                             <PolarGrid />
//                             <PolarAngleAxis dataKey="subject" />
//                             <PolarRadiusAxis angle={30} domain={[0, 150]} />
//                             <Radar 
//                                 name="Metrics" 
//                                 dataKey="A" 
//                                 stroke="#8884d8" 
//                                 fill="#8884d8" 
//                                 fillOpacity={0.6} 
//                             />
//                             <Tooltip />
//                             <Legend />
//                         </RadarChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* Requirements Growth */}
//                 <div className="chart-panel full-width">
//                     <div className="chart-header">
//                         <h2>📈 Requirements Growth</h2>
//                         <span className="chart-subtitle">Cumulative requirements over time</span>
//                     </div>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <AreaChart data={summary.volume_by_day || []}>
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="date" />
//                             <YAxis />
//                             <Tooltip />
//                             <Area 
//                                 type="monotone" 
//                                 dataKey="count" 
//                                 stroke="#8884d8" 
//                                 fill="#8884d8" 
//                                 fillOpacity={0.3} 
//                                 name="New Requirements"
//                             />
//                         </AreaChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>
//         </div>
//     );
// };
// export default AdminDashboard;









    









      


      

  


    
