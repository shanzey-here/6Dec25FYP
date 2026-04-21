import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const formatTranscript = (transcript) => {
    // SQLite stores JSON as a string; we must parse it to an array before mapping
    const history = typeof transcript === 'string' ? JSON.parse(transcript) : transcript;
    
    if (!Array.isArray(history)) return "No history.";
    
    return history.map((msg, index) => {
        let displayBody = "Empty message";

        if (Array.isArray(msg.parts) && msg.parts.length > 0) {
            const part = msg.parts[0];
            // Extract text from object or use string directly
            displayBody = (typeof part === 'object' && part !== null) ? (part.text || JSON.stringify(part)) : part;
        } else {
            displayBody = msg.text || msg.content || "Unreadable message format";
        }

        return (
            <div 
                key={index} 
                style={{ 
                    marginBottom: '12px', padding: '12px', borderRadius: '8px', 
                    background: msg.role === 'user' ? '#f0f7ff' : '#f6f9f8', 
                    borderLeft: `4px solid ${msg.role === 'user' ? '#007bff' : '#28a745'}`,
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                }}
            >
                <strong style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>
                    {msg.role === 'user' ? 'CLIENT' : 'ASSISTANT'}
                </strong>
                <div style={{ marginTop: '4px' }}>{displayBody}</div>
            </div>
        );
    });
};

const LeadList = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null); 
    
    const { authToken, logout } = useAuth();
    const navigate = useNavigate();

    // Fetch Leads Function (Stabilized with useCallback to satisfy ESLint)
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` }
            };
            
            const response = await axios.get(`${API_BASE_URL}/admin/leads`, config);
            setLeads(response.data);
            setError('');
        } catch (err) {
            // Using 'err' to satisfy the no-unused-vars rule
            console.error("Failed to fetch leads:", err.message);
            
            if (err.response && err.response.status === 401) {
                logout();
                navigate('/admin/login');
            } else {
                 setError("Failed to load projects list.");
            }
        } finally {
            setLoading(false);
        }
    }, [authToken, logout, navigate]); 

    // Initial Load Effect
    useEffect(() => {
        if (authToken) {
            fetchLeads(); 
        } else {
            navigate('/admin/login');
        }
    }, [authToken, navigate, fetchLeads]); 

    const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString();
    };
    
    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDownloadReport = async (lead) => {
        // Blob-based download ensures metadata is preserved for .docx files
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/report/${lead.session_uuid}`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SRS_${lead.project_name || lead.session_uuid}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download error:", err);
            alert("Could not download the document. Please try again.");
        }
    };

    const handleGenerateSRS = async (lead) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/lead/${lead.session_uuid}/generate-srs`, null, {
                 headers: { Authorization: `Bearer ${authToken}` }
            });
            alert('SRS generation triggered! Status will update shortly.');
            fetchLeads(); 
        } catch (err) {
            console.error("Failed to generate SRS:", err.message);
            alert(`SRS Generation Failed: ${err.response?.data?.error || 'Check server logs.'}`); 
        }
    };
    
    const handleArrangeMeeting = (lead) => {
        // Check if data exists; if not, use a fallback so it's not "null"
        const recipient = lead.email || "client@example.com";
        const projectName = lead.project_name || "your software project";
    
        // Construct the plain text message
        const bodyText = `Dear Client,

    We have successfully generated the SRS for your project: "${projectName}".

    Our engineering team has reviewed the technical scope. We would like to invite you to our office in Faisalabad to discuss the development phase.

    Best regards,
    Shanzay Shafique
    Lead Developer`;

    // ONLY encode once here
        const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent("Meeting Proposal")}&body=${encodeURIComponent(bodyText)}`;
    
        window.location.href = mailtoUrl;

    };

    if (loading) return <div className="dashboard-loading" style={{textAlign: 'center', padding: '50px'}}>Loading Projects...</div>;
    if (error) return <div className="dashboard-error" style={{color: 'red', textAlign: 'center', padding: '50px'}}>{error}</div>;

    return (
        <div className="leadlist-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1>📋 Project Portfolio</h1>
                <nav>
                    <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
                    <button className="nav-button logout-button" onClick={logout} style={{ marginLeft: '10px', background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                </nav>
            </header>

            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <thead>
                        <tr style={{ background: '#007bff', color: 'white' }}>
                            <th style={{ width: '30px', padding: '12px' }}></th> 
                            <th style={{ padding: '12px', textAlign: 'left' }}>Project Name / Email</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Type / Budget</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <React.Fragment key={lead.id}>
                                <tr 
                                    style={{ 
                                        borderBottom: '1px solid #eee', 
                                        background: lead.status === 'SRS_Generated' ? '#f0fff0' : (lead.status === 'Qualified' ? '#f9f9f9' : 'white') 
                                    }}
                                >
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <button 
                                            onClick={() => toggleExpand(lead.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', transform: expandedId === lead.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                        >
                                            ^
                                        </button>
                                    </td>
                                    
                                    <td style={{ padding: '12px' }}>
                                        <strong>{lead.project_name || 'Unnamed Project'}</strong>
                                        <div style={{ fontSize: '0.9em', color: '#666' }}>{lead.email || 'N/A'}</div>
                                    </td>
                                    
                                    <td style={{ padding: '12px' }}>
                                        {lead.project_type || 'Unspecified'}
                                        <div style={{ fontWeight: 'bold' }}>{lead.budget || 'N/A'}</div>
                                    </td>

                                    <td style={{ padding: '12px' }}>
                                        <span style={{ fontWeight: 'bold', color: lead.status === 'SRS_Generated' ? '#4CAF50' : (lead.status === 'Qualified' ? '#2196F3' : '#FF9800') }}>
                                            {lead.status}
                                        </span>
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>{formatTime(lead.created_at)}</div>
                                    </td>
                                    
                                    <td style={{ padding: '12px' }}>
                                        {lead.seriousness_score || 'N/A'}/10
                                    </td>

                                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                        <button 
                                            onClick={() => handleDownloadReport(lead)}
                                            style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '0.9em' }}
                                        >
                                            📥 {lead.status === 'SRS_Generated' ? 'Download SRS' : 'Download Report'}
                                        </button>
                                        
                                        {lead.status !== 'SRS_Generated' && (
                                            <button 
                                                onClick={() => handleGenerateSRS(lead)}
                                                disabled={lead.status !== 'Qualified'} 
                                                style={{ background: lead.status === 'Qualified' ? '#FFC107' : '#ccc', color: '#333', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: lead.status === 'Qualified' ? 'pointer' : 'not-allowed', marginRight: '5px', fontSize: '0.9em' }}
                                            >
                                                📄 Generate SRS
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleArrangeMeeting(lead)}
                                            disabled={lead.status !== 'Qualified' && lead.status !== 'SRS_Generated'}
                                            style={{ background: lead.status === 'Qualified' || lead.status === 'SRS_Generated' ? '#28a745' : '#ccc', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: lead.status === 'Qualified' || lead.status === 'SRS_Generated' ? 'pointer' : 'not-allowed', fontSize: '0.9em' }}
                                        >
                                            📅 Meeting
                                        </button>
                                    </td>
                                </tr>
                                
                                {expandedId === lead.id && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '20px', background: '#f9f9f9', borderTop: '1px dashed #ddd' }}>
                                            <h4 style={{ marginBottom: '15px', color: '#007bff' }}>Full Conversation Transcript:</h4>
                                            <div className="transcript-summary" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #ddd', padding: '15px', borderRadius: '4px', backgroundColor: 'white' }}>
                                                {formatTranscript(lead.full_transcript)}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No leads have been recorded yet.</p>}
            </div>
        </div>
    );
};

export default LeadList;



