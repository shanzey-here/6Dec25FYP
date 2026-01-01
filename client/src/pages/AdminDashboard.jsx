// // client/src/AdminDashboard.jsx

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../auth/AuthContext.jsx';
// import { useNavigate } from 'react-router-dom';
// import {
//     PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
// } from 'recharts';

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// const AdminDashboard = () => {
//     const [summary, setSummary] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const { authToken, logout } = useAuth();
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchSummaryData = async () => {
//             try {
//                 const config = {
//                     headers: {
//                         Authorization: `Bearer ${authToken}` // Though not implemented on backend, good practice
//                     }
//                 };
                
//                 const response = await axios.get(`${API_BASE_URL}/admin/dashboard/summary`, config);
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

//     const renderSummaryCard = (title, value) => (
//         <div className="summary-card">
//             <h3>{title}</h3>
//             <p className="summary-value">{value}</p>
//         </div>
//     );

//     if (loading) return <div className="dashboard-loading">Loading Dashboard...</div>;
//     if (error) return <div className="dashboard-error">{error}</div>;
//     if (!summary) return <div className="dashboard-empty">No summary data available.</div>;

//     // Prepare data for recharts
//     const statusData = summary.status_distribution.map(item => ({
//         name: item.status,
//         value: item.count
//     }));

//     const typeData = summary.project_type_distribution.map(item => ({
//         name: item.project_type || 'Unspecified', // Handle null project types
//         count: item.count
//     }));


//     return (
//         <div className="dashboard-container">
//             <header className="dashboard-header">
//                 <h1>📊 AI Lead Agent Dashboard</h1>
//                 <nav>
//                     <button className="nav-button" onClick={() => navigate('/admin/leads')}>View All Leads</button>
//                     <button className="nav-button logout-button" onClick={logout}>Logout</button>
//                 </nav>
//             </header>

//             <div className="summary-cards">
//                 {renderSummaryCard("Total Leads", summary.total_leads)}
//                 {renderSummaryCard("Qualified Leads", statusData.find(d => d.name === 'Qualified')?.value || 0)}
//                 {renderSummaryCard("New Leads", statusData.find(d => d.name === 'New')?.value || 0)}
//                 {renderSummaryCard("Avg. Seriousness Score", summary.average_seriousness_score)}
//             </div>

//             <div className="charts-grid">
                
//                 {/* Status Distribution Pie Chart */}
//                 <div className="chart-panel">
//                     <h2>Lead Status Distribution</h2>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                             <Pie
//                                 data={statusData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 cx="50%"
//                                 cy="50%"
//                                 outerRadius={100}
//                                 fill="#8884d8"
//                                 label
//                             >
//                                 {statusData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                             </Pie>
//                             <Tooltip />
//                             <Legend />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* Project Type Bar Chart */}
//                 <div className="chart-panel">
//                     <h2>Qualified Leads by Project Type</h2>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
//                             <YAxis allowDecimals={false} />
//                             <Tooltip />
//                             <Legend />
//                             <Bar dataKey="count" fill="#82ca9d" />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AdminDashboard;



// client/src/pages/AdminDashboard.jsx (FINAL CHART IMPLEMENTATION)

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../auth/AuthContext.jsx';
// import { useNavigate } from 'react-router-dom';
// import {
//     PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
//     ResponsiveContainer, Cell, LineChart, Line 
// } from 'recharts';
// // Assuming you created and linked this CSS file for basic styling:
// // import '../Admin.css'; 

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// // Colors for Pie and Bar charts
// const PIE_COLORS = ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600']; 
// const BAR_COLOR = '#4CAF50';
// const LINE_COLOR = '#007bff';

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

//     const renderSummaryCard = (title, value, unit = '') => (
//         <div className="summary-card">
//             <h3>{title}</h3>
//             <p className="summary-value">{value}{unit}</p>
//         </div>
//     );

//     if (loading) return <div className="dashboard-loading">Loading Dashboard...</div>;
//     if (error) return <div className="dashboard-error">{error}</div>;
//     if (!summary) return <div className="dashboard-empty">No summary data available.</div>;

//     // --- Prepare Data for Recharts ---
//     const qualifiedStatusCount = summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0;
//     const newStatusCount = summary.status_distribution.find(d => d.status === 'New')?.count || 0;

//     const statusData = [
//         { name: 'Qualified', value: qualifiedStatusCount },
//         { name: 'New', value: newStatusCount },
//         // Filter out statuses with 0 for cleaner visualization
//     ].filter(d => d.value > 0); 
    
//     // Project Type Data (Chart 2)
//     const typeData = summary.project_type_distribution
//         .map(item => ({
//             name: item.project_type || 'Unspecified', 
//             count: item.count
//         }))
//         .filter(d => d.count > 0); // Filter out empty projects

//     // Lead Volume Data (Chart 3)
//     const volumeData = summary.volume_by_day || [];


//     return (
//         <div className="dashboard-container">
            
//             <header className="dashboard-header">
//                 <h1>📊 AI Lead Agent Dashboard</h1>
//                 <nav>
//                     <button className="nav-button" onClick={() => navigate('/admin/leads')}>View All Leads</button>
//                     <button className="nav-button logout-button" onClick={logout}>Logout</button>
//                 </nav>
//             </header>

//             {/* CHART 4 (Card) & Summary Cards */}
//             <div className="summary-cards">
//                 {renderSummaryCard("Total Leads", summary.total_leads)}
//                 {renderSummaryCard("Qualified Leads", qualifiedStatusCount)}
//                 {renderSummaryCard("New Leads", newStatusCount)}
//                 {renderSummaryCard("Avg. Seriousness Score (0-10)", summary.average_seriousness_score, '/10')}
//             </div>

//             <div className="charts-grid">
                
//                 {/* CHART 1: Lead Status Distribution (Pie Chart) */}
//                 <div className="chart-panel chart-pie">
//                     <h2>1. Qualification Status</h2>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                             <Pie
//                                 data={statusData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 cx="50%"
//                                 cy="50%"
//                                 innerRadius={60} // Use inner radius for modern look
//                                 outerRadius={100}
//                                 fill="#8884d8"
//                                 label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
//                             >
//                                 {statusData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
//                                 ))}
//                             </Pie>
//                             <Tooltip formatter={(value) => [`${value} Leads`, 'Count']} />
//                             <Legend />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* CHART 2: Project Type Distribution (Bar Chart) */}
//                 <div className="chart-panel chart-bar">
//                     <h2>2. Qualified Leads by Project Demand</h2>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                             <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
//                             <YAxis allowDecimals={false} label={{ value: 'Leads Count', angle: -90, position: 'insideLeft' }} />
//                             <Tooltip formatter={(value) => [`${value} Leads`, 'Count']} />
//                             <Legend />
//                             <Bar dataKey="count" fill={BAR_COLOR} radius={[10, 10, 0, 0]} />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>
                
//                 {/* CHART 3: Lead Volume by Day (Line Chart) */}
//                 <div className="chart-panel chart-line col-span-2"> {/* Span two columns */}
//                     <h2>3. Lead Volume (Last 30 Days)</h2>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <LineChart data={volumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="date" />
//                             <YAxis allowDecimals={false} label={{ value: 'Daily Leads', angle: -90, position: 'insideLeft' }} />
//                             <Tooltip labelFormatter={(date) => `Date: ${date}`} formatter={(value) => [`${value} Leads`, 'Volume']} />
//                             <Legend />
//                             <Line type="monotone" dataKey="count" stroke={LINE_COLOR} strokeWidth={2} activeDot={{ r: 8 }} name="New Leads" />
//                         </LineChart>
//                     </ResponsiveContainer>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AdminDashboard;



// client/src/pages/AdminDashboard.jsx (ENHANCED FOR SRS PLATFORM)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area, 
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
const STATUS_COLORS = {
    'New': '#0088FE',
    'Qualified': '#00C49F',
    'Requirements_Gathering': '#FFBB28',
    'SRS_Generated': '#FF8042'
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
                console.error("Failed to fetch dashboard summary:", err);
                setError("Failed to load dashboard data. Check network or server logs.");
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchSummaryData();
        } else {
            navigate('/admin/login');
        }
    }, [authToken, navigate]);

    const renderMetricCard = (title, value, subtitle = '', icon = '📊') => (
        <div className="metric-card">
            <div className="metric-icon">{icon}</div>
            <div className="metric-content">
                <h3>{title}</h3>
                <p className="metric-value">{value}</p>
                {subtitle && <p className="metric-subtitle">{subtitle}</p>}
            </div>
        </div>
    );

    if (loading) return <div className="dashboard-loading">🚀 Loading SRS Platform Dashboard...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;
    if (!summary) return <div className="dashboard-empty">No dashboard data available.</div>;

    // Prepare chart data
    const statusData = summary.status_distribution
        .filter(d => d.count > 0)
        .map(item => ({
            name: item.status,
            value: item.count,
            color: STATUS_COLORS[item.status] || '#8884D8'
        }));

    // const recentLeads = summary.recent_leads || [];
    
    // Requirements metrics
    const requirementMetrics = [
        { subject: 'Requirements', A: summary.total_requirements || 0, fullMark: 100 },
        { subject: 'Avg/Lead', A: summary.avg_requirements_per_lead || 0, fullMark: 20 },
        { subject: 'SRS Docs', A: summary.srs_documents_generated || 0, fullMark: 10 },
        { subject: 'Qualified %', A: ((summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0) / summary.total_leads * 100) || 0, fullMark: 100 },
    ];









    return (
        <div className="srs-dashboard-container">
            
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>🤖 AI Requirements Engineering Platform</h1>
                    <p className="subtitle">Complete SRS Generation & Management</p>
                </div>
                <nav>
                    <button className="nav-button" onClick={() => navigate('/admin/leads')}>
                        📋 View All Leads
                    </button>
                    {/* <button className="nav-button primary" onClick={() => navigate('/admin/requirements')}>
                        📝 Requirements Hub
                    </button> */}
                    <button className="nav-button logout-button" onClick={logout}>
                        🚪 Logout
                    </button>
                </nav>
            </header>

            {/* Quick Stats Row */}
            <div className="quick-stats-row">
                {renderMetricCard(
                    "Total Projects", 
                    summary.total_leads, 
                    "Leads captured",
                    "📈"
                )}
                {renderMetricCard(
                    "Requirements", 
                    summary.total_requirements, 
                    `${summary.avg_requirements_per_lead?.toFixed(1)} per project`,
                    "📋"
                )}
                {renderMetricCard(
                    "SRS Generated", 
                    summary.srs_documents_generated, 
                    "Documents created",
                    "📄"
                )}
                {renderMetricCard(
                    "Qualification Rate", 
                    `${((summary.status_distribution.find(d => d.status === 'Qualified')?.count || 0) / summary.total_leads * 100).toFixed(1)}%`, 
                    "Of total leads",
                    "✅"
                )}
            </div>

            {/* Main Charts Grid */}
            <div className="charts-grid">
                
                {/* Project Status Funnel */}
                <div className="chart-panel">
                    <div className="chart-header">
                        <h2>📊 Project Status Distribution</h2>
                        <span className="chart-subtitle">Lead qualification funnel</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} projects`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Requirements Metrics Radar */}
                <div className="chart-panel">
                    <div className="chart-header">
                        <h2>📈 Requirements Metrics</h2>
                        <span className="chart-subtitle">Platform performance indicators</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={requirementMetrics}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} />
                            <Radar 
                                name="Metrics" 
                                dataKey="A" 
                                stroke="#8884d8" 
                                fill="#8884d8" 
                                fillOpacity={0.6} 
                            />
                            <Tooltip />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>



                {/* Requirements Growth */}
                <div className="chart-panel full-width">
                    <div className="chart-header">
                        <h2>📈 Requirements Growth</h2>
                        <span className="chart-subtitle">Cumulative requirements over time</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={summary.volume_by_day || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#8884d8" 
                                fill="#8884d8" 
                                fillOpacity={0.3} 
                                name="New Requirements"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

            </div>



        </div>
    );




  






    
};

export default AdminDashboard;