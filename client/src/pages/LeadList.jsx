import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
 
/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_META = {
  New:                    { color: '#f5a623', bg: 'rgba(245,166,35,0.10)',  label: 'NEW' },
  Qualified:              { color: '#5b8af5', bg: 'rgba(91,138,245,0.10)', label: 'QUALIFIED' },
  Requirements_Gathering: { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',label: 'GATHERING' },
  SRS_Generated:          { color: '#3ecf8e', bg: 'rgba(62,207,142,0.10)', label: 'SRS DONE' },
};
 
const getStatus = (s) => STATUS_META[s] || { color: '#4a5668', bg: 'transparent', label: s };
 
/* ─── Transcript formatter ─────────────────────────────────────── */
const formatTranscript = (transcript) => {
  const history = typeof transcript === 'string' ? JSON.parse(transcript) : transcript;
  if (!Array.isArray(history)) return <p style={{ color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>No history.</p>;
 
  return history.map((msg, index) => {
    let displayBody = 'Empty message';
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      const part = msg.parts[0];
      displayBody = (typeof part === 'object' && part !== null) ? (part.text || JSON.stringify(part)) : part;
    } else {
      displayBody = msg.text || msg.content || 'Unreadable message format';
    }
 
    const isUser = msg.role === 'user';
    return (
      <div key={index} style={{
        marginBottom: 10,
        padding: '10px 14px',
        borderRadius: 8,
        background: isUser ? 'rgba(91,138,245,0.07)' : 'rgba(245,166,35,0.06)',
        borderLeft: `3px solid ${isUser ? '#5b8af5' : '#f5a623'}`,
        wordBreak: 'break-word',
      }}>
        <span style={{
          fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
          letterSpacing: '0.1em', fontWeight: 600,
          color: isUser ? '#5b8af5' : '#f5a623',
          display: 'block', marginBottom: 4,
        }}>
          {isUser ? 'CLIENT' : 'ASSISTANT'}
        </span>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-hi)', lineHeight: 1.55 }}>{displayBody}</div>
      </div>
    );
  });
};
 
/* ─── Main Component ─────────────────────────────────────────────── */
const LeadList = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
 
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();
 
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const response = await axios.get(`${API_BASE_URL}/admin/leads`, config);
      setLeads(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch leads:', err.message);
      if (err.response?.status === 401) { logout(); navigate('/admin/login'); }
      else setError('Failed to load projects list.');
    } finally { setLoading(false); }
  }, [authToken, logout, navigate]);
 
  useEffect(() => {
    if (authToken) fetchLeads();
    else navigate('/admin/login');
  }, [authToken, navigate, fetchLeads]);
 
  const formatTime = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
 
  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
 
  const handleDownloadReport = async (lead) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/report/${lead.session_uuid}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SRS_${lead.project_name || lead.session_uuid}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download the document. Please try again.');
    }
  };
 
  const handleGenerateSRS = async (lead) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/lead/${lead.session_uuid}/generate-srs`, null, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alert('SRS generation triggered! Status will update shortly.');
      fetchLeads();
    } catch (err) {
      console.error('Failed to generate SRS:', err.message);
      alert(`SRS Generation Failed: ${err.response?.data?.error || 'Check server logs.'}`);
    }
  };
 
  const handleArrangeMeeting = (lead) => {
    const recipient = lead.email || 'client@example.com';
    const projectName = lead.project_name || 'your software project';
    const bodyText = `Dear Client,\n\nWe have successfully generated the SRS for your project: "${projectName}".\n\nOur engineering team has reviewed the technical scope. We would like to invite you to our office in Faisalabad to discuss the development phase.\n\nBest regards,\nShanzay Shafique\nLead Developer`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent('Meeting Proposal')}&body=${encodeURIComponent(bodyText)}`;
  };

  const handleDeleteLead = async (lead) => {
    if (window.confirm(`Are you sure you want to delete the lead for "${lead.project_name || 'Unnamed Project'}"?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/lead/${lead.session_uuid}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        alert('Lead deleted successfully.');
        fetchLeads();
      } catch (err) {
        console.error('Failed to delete lead:', err.message);
        alert(`Delete Failed: ${err.response?.data?.error || 'Check server logs.'}`);
      }
    }
  };
 
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', color: 'var(--text-lo)',
      fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em',
    }}>LOADING PROJECTS…</div>
  );
 
  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', color: 'var(--red-err)',
      fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
    }}>✕ {error}</div>
  );
 
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', fontFamily: 'var(--font-ui)', paddingBottom: 60 }}>
 
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,11,16,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--amber-dim)', border: '1px solid var(--amber-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: 'var(--amber)',
            }}>⬡</div>
            <span style={{ fontWeight: 700, color: 'var(--text-hi)' }}>Project Portfolio</span>
            <span className="tag tag-grey">{leads.length} LEADS</span>
          </div>
 
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/admin/dashboard')}
              style={{
                padding: '7px 16px', borderRadius: 7,
                background: 'var(--bg-raised)', border: '1px solid var(--border-md)',
                color: 'var(--text-md)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >Dashboard</button>
            <button
              onClick={logout}
              style={{
                padding: '7px 16px', borderRadius: 7, border: 'none',
                background: 'linear-gradient(135deg,#f5a623,#e8960f)',
                color: '#080b10', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              }}
            >Logout</button>
          </div>
        </div>
      </header>
 
      {/* ── TABLE ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 28px' }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}>
 
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 1fr 140px 90px 260px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
          }}>
            {['', 'Project / Email', 'Type / Budget', 'Status', 'Score', 'Actions'].map((h, i) => (
              <span key={i} style={{
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--text-lo)', fontWeight: 500,
              }}>{h}</span>
            ))}
          </div>
 
          {leads.length === 0 && (
            <div style={{
              padding: '48px', textAlign: 'center',
              color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            }}>
              NO LEADS RECORDED YET
            </div>
          )}
 
          {leads.map((lead, rowIdx) => {
            const sm = getStatus(lead.status);
            const isExpanded = expandedId === lead.id;
            return (
              <React.Fragment key={lead.id}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 1fr 140px 90px 260px',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: isExpanded ? 'var(--bg-panel)' : rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-void)',
                  alignItems: 'center',
                  transition: 'background 0.2s',
                }}>
 
                  {/* Expand toggle */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => toggleExpand(lead.id)}
                      style={{
                        width: 26, height: 26, padding: 0, border: '1px solid var(--border-md)',
                        background: 'var(--bg-raised)', borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s', fontSize: 11,
                        color: 'var(--text-md)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >▾</button>
                  </div>
 
                  {/* Project name + email */}
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: '0.88rem', marginBottom: 2 }}>
                      {lead.project_name || 'Unnamed Project'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-lo)', fontFamily: 'var(--font-mono)' }}>
                      {lead.email || 'N/A'}
                    </div>
                  </div>
 
                  {/* Type + budget */}
                  <div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-md)' }}>{lead.project_type || 'Unspecified'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--amber)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {lead.budget || 'N/A'}
                    </div>
                  </div>
 
                  {/* Status badge */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 99,
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      background: sm.bg,
                      color: sm.color,
                      border: `1px solid ${sm.color}40`,
                    }}>
                      {sm.label}
                    </span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-lo)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                      {formatTime(lead.created_at)}
                    </div>
                  </div>
 
                  {/* Score */}
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: 'var(--text-hi)', fontSize: '0.88rem',
                  }}>
                    {lead.seriousness_score || '—'}<span style={{ color: 'var(--text-lo)', fontWeight: 400 }}>/10</span>
                  </div>
 
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <ActionBtn
                      onClick={() => handleDownloadReport(lead)}
                      label={lead.status === 'SRS_Generated' ? '↓ SRS' : '↓ Report'}
                      color="#5b8af5"
                    />
 
                    {lead.status !== 'SRS_Generated' && (
                      <ActionBtn
                        onClick={() => handleGenerateSRS(lead)}
                        label="⊞ SRS"
                        color={lead.status === 'Qualified' ? '#f5a623' : undefined}
                        disabled={lead.status !== 'Qualified'}
                      />
                    )}
 
                    <ActionBtn
                      onClick={() => handleArrangeMeeting(lead)}
                      label="✉ Meet"
                      color="#3ecf8e"
                      disabled={lead.status !== 'Qualified' && lead.status !== 'SRS_Generated'}
                    />
 
                    <ActionBtn
                      onClick={() => handleDeleteLead(lead)}
                      label="🗑 Del"
                      color="#f85a5a"
                    />
                  </div>
                </div>
 
                {/* Expanded transcript row */}
                {isExpanded && (
                  <div style={{
                    padding: '20px 64px 24px',
                    background: 'var(--bg-panel)',
                    borderBottom: '1px solid var(--border)',
                    animation: 'fadeUp 0.25s ease both',
                  }}>
                    <p style={{
                      fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--text-lo)', marginBottom: 14,
                    }}>CONVERSATION TRANSCRIPT</p>
                    <div style={{
                      maxHeight: 340, overflowY: 'auto',
                      padding: '4px 0',
                    }}>
                      {formatTranscript(lead.full_transcript)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
 
/* ─── Action Button ─────────────────────────────────────────────── */
const ActionBtn = ({ onClick, label, color, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      padding: '5px 10px',
      borderRadius: 6,
      border: disabled ? '1px solid var(--border)' : `1px solid ${color ? color + '40' : 'var(--border-md)'}`,
      background: disabled ? 'transparent' : color ? `${color}12` : 'var(--bg-raised)',
      color: disabled ? 'var(--text-lo)' : color || 'var(--text-md)',
      fontSize: '0.72rem',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      letterSpacing: '0.03em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.18s',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);
 
export default LeadList;








// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import { useAuth } from '../auth/AuthContext.jsx';
// import { useNavigate } from 'react-router-dom';

// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const formatTranscript = (transcript) => {
//     // SQLite stores JSON as a string; we must parse it to an array before mapping
//     const history = typeof transcript === 'string' ? JSON.parse(transcript) : transcript;
    
//     if (!Array.isArray(history)) return "No history.";
    
//     return history.map((msg, index) => {
//         let displayBody = "Empty message";

//         if (Array.isArray(msg.parts) && msg.parts.length > 0) {
//             const part = msg.parts[0];
//             // Extract text from object or use string directly
//             displayBody = (typeof part === 'object' && part !== null) ? (part.text || JSON.stringify(part)) : part;
//         } else {
//             displayBody = msg.text || msg.content || "Unreadable message format";
//         }

//         return (
//             <div 
//                 key={index} 
//                 style={{ 
//                     marginBottom: '12px', padding: '12px', borderRadius: '8px', 
//                     background: msg.role === 'user' ? '#f0f7ff' : '#f6f9f8', 
//                     borderLeft: `4px solid ${msg.role === 'user' ? '#007bff' : '#28a745'}`,
//                     wordBreak: 'break-word',
//                     overflowWrap: 'anywhere'
//                 }}
//             >
//                 <strong style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>
//                     {msg.role === 'user' ? 'CLIENT' : 'ASSISTANT'}
//                 </strong>
//                 <div style={{ marginTop: '4px' }}>{displayBody}</div>
//             </div>
//         );
//     });
// };

// const LeadList = () => {
//     const [leads, setLeads] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [expandedId, setExpandedId] = useState(null); 
    
//     const { authToken, logout } = useAuth();
//     const navigate = useNavigate();

//     // Fetch Leads Function (Stabilized with useCallback to satisfy ESLint)
//     const fetchLeads = useCallback(async () => {
//         setLoading(true);
//         try {
//             const config = {
//                 headers: { Authorization: `Bearer ${authToken}` }
//             };
            
//             const response = await axios.get(`${API_BASE_URL}/admin/leads`, config);
//             setLeads(response.data);
//             setError('');
//         } catch (err) {
//             // Using 'err' to satisfy the no-unused-vars rule
//             console.error("Failed to fetch leads:", err.message);
            
//             if (err.response && err.response.status === 401) {
//                 logout();
//                 navigate('/admin/login');
//             } else {
//                  setError("Failed to load projects list.");
//             }
//         } finally {
//             setLoading(false);
//         }
//     }, [authToken, logout, navigate]); 

//     // Initial Load Effect
//     useEffect(() => {
//         if (authToken) {
//             fetchLeads(); 
//         } else {
//             navigate('/admin/login');
//         }
//     }, [authToken, navigate, fetchLeads]); 

//     const formatTime = (isoString) => {
//         if (!isoString) return 'N/A';
//         return new Date(isoString).toLocaleString();
//     };
    
//     const toggleExpand = (id) => {
//         setExpandedId(expandedId === id ? null : id);
//     };

//     const handleDownloadReport = async (lead) => {
//         // Blob-based download ensures metadata is preserved for .docx files
//         try {
//             const response = await axios.get(`${API_BASE_URL}/admin/report/${lead.session_uuid}`, {
//                 responseType: 'blob',
//                 headers: { Authorization: `Bearer ${authToken}` }
//             });

//             const url = window.URL.createObjectURL(new Blob([response.data]));
//             const link = document.createElement('a');
//             link.href = url;
//             link.setAttribute('download', `SRS_${lead.project_name || lead.session_uuid}.docx`);
//             document.body.appendChild(link);
//             link.click();
//             link.remove();
//         } catch (err) {
//             console.error("Download error:", err);
//             alert("Could not download the document. Please try again.");
//         }
//     };

//     const handleGenerateSRS = async (lead) => {
//         try {
//             await axios.post(`${API_BASE_URL}/admin/lead/${lead.session_uuid}/generate-srs`, null, {
//                  headers: { Authorization: `Bearer ${authToken}` }
//             });
//             alert('SRS generation triggered! Status will update shortly.');
//             fetchLeads(); 
//         } catch (err) {
//             console.error("Failed to generate SRS:", err.message);
//             alert(`SRS Generation Failed: ${err.response?.data?.error || 'Check server logs.'}`); 
//         }
//     };
    
//     const handleArrangeMeeting = (lead) => {
//         // Check if data exists; if not, use a fallback so it's not "null"
//         const recipient = lead.email || "client@example.com";
//         const projectName = lead.project_name || "your software project";
    
//         // Construct the plain text message
//         const bodyText = `Dear Client,

//     We have successfully generated the SRS for your project: "${projectName}".

//     Our engineering team has reviewed the technical scope. We would like to invite you to our office in Faisalabad to discuss the development phase.

//     Best regards,
//     Shanzay Shafique
//     Lead Developer`;

//     // ONLY encode once here
//         const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent("Meeting Proposal")}&body=${encodeURIComponent(bodyText)}`;
    
//         window.location.href = mailtoUrl;

//     };

//     if (loading) return <div className="dashboard-loading" style={{textAlign: 'center', padding: '50px'}}>Loading Projects...</div>;
//     if (error) return <div className="dashboard-error" style={{color: 'red', textAlign: 'center', padding: '50px'}}>{error}</div>;

//     return (
//         <div className="leadlist-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
//             <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
//                 <h1>📋 Project Portfolio</h1>
//                 <nav>
//                     <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
//                     <button className="nav-button logout-button" onClick={logout} style={{ marginLeft: '10px', background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
//                 </nav>
//             </header>

//             <div className="table-responsive">
//                 <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
//                     <thead>
//                         <tr style={{ background: '#007bff', color: 'white' }}>
//                             <th style={{ width: '30px', padding: '12px' }}></th> 
//                             <th style={{ padding: '12px', textAlign: 'left' }}>Project Name / Email</th>
//                             <th style={{ padding: '12px', textAlign: 'left' }}>Type / Budget</th>
//                             <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
//                             <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
//                             <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {leads.map(lead => (
//                             <React.Fragment key={lead.id}>
//                                 <tr 
//                                     style={{ 
//                                         borderBottom: '1px solid #eee', 
//                                         background: lead.status === 'SRS_Generated' ? '#f0fff0' : (lead.status === 'Qualified' ? '#f9f9f9' : 'white') 
//                                     }}
//                                 >
//                                     <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
//                                         <button 
//                                             onClick={() => toggleExpand(lead.id)}
//                                             style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', transform: expandedId === lead.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
//                                         >
//                                             ^
//                                         </button>
//                                     </td>
                                    
//                                     <td style={{ padding: '12px' }}>
//                                         <strong>{lead.project_name || 'Unnamed Project'}</strong>
//                                         <div style={{ fontSize: '0.9em', color: '#666' }}>{lead.email || 'N/A'}</div>
//                                     </td>
                                    
//                                     <td style={{ padding: '12px' }}>
//                                         {lead.project_type || 'Unspecified'}
//                                         <div style={{ fontWeight: 'bold' }}>{lead.budget || 'N/A'}</div>
//                                     </td>

//                                     <td style={{ padding: '12px' }}>
//                                         <span style={{ fontWeight: 'bold', color: lead.status === 'SRS_Generated' ? '#4CAF50' : (lead.status === 'Qualified' ? '#2196F3' : '#FF9800') }}>
//                                             {lead.status}
//                                         </span>
//                                         <div style={{ fontSize: '0.8em', color: '#666' }}>{formatTime(lead.created_at)}</div>
//                                     </td>
                                    
//                                     <td style={{ padding: '12px' }}>
//                                         {lead.seriousness_score || 'N/A'}/10
//                                     </td>

//                                     <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
//                                         <button 
//                                             onClick={() => handleDownloadReport(lead)}
//                                             style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '0.9em' }}
//                                         >
//                                             📥 {lead.status === 'SRS_Generated' ? 'Download SRS' : 'Download Report'}
//                                         </button>
                                        
//                                         {lead.status !== 'SRS_Generated' && (
//                                             <button 
//                                                 onClick={() => handleGenerateSRS(lead)}
//                                                 disabled={lead.status !== 'Qualified'} 
//                                                 style={{ background: lead.status === 'Qualified' ? '#FFC107' : '#ccc', color: '#333', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: lead.status === 'Qualified' ? 'pointer' : 'not-allowed', marginRight: '5px', fontSize: '0.9em' }}
//                                             >
//                                                 📄 Generate SRS
//                                             </button>
//                                         )}
                                        
//                                         <button 
//                                             onClick={() => handleArrangeMeeting(lead)}
//                                             disabled={lead.status !== 'Qualified' && lead.status !== 'SRS_Generated'}
//                                             style={{ background: lead.status === 'Qualified' || lead.status === 'SRS_Generated' ? '#28a745' : '#ccc', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: lead.status === 'Qualified' || lead.status === 'SRS_Generated' ? 'pointer' : 'not-allowed', fontSize: '0.9em' }}
//                                         >
//                                             📅 Meeting
//                                         </button>
//                                     </td>
//                                 </tr>
                                
//                                 {expandedId === lead.id && (
//                                     <tr>
//                                         <td colSpan="6" style={{ padding: '20px', background: '#f9f9f9', borderTop: '1px dashed #ddd' }}>
//                                             <h4 style={{ marginBottom: '15px', color: '#007bff' }}>Full Conversation Transcript:</h4>
//                                             <div className="transcript-summary" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #ddd', padding: '15px', borderRadius: '4px', backgroundColor: 'white' }}>
//                                                 {formatTranscript(lead.full_transcript)}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 )}
//                             </React.Fragment>
//                         ))}
//                     </tbody>
//                 </table>
//                 {leads.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No leads have been recorded yet.</p>}
//             </div>
//         </div>
//     );
// };

// export default LeadList;



