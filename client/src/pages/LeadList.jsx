// client/src/pages/LeadList.jsx - FINAL SIMPLIFIED AND STABLE VERSION
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Helper function to format the conversation transcript nicely
// const formatTranscript = (transcript) => {
//     if (!Array.isArray(transcript)) return "Transcript data not found.";
    
//     return transcript.map((msg, index) => {
//         // FIX: Add safety check to ensure msg.parts is an array before accessing [0]
//         const text = (Array.isArray(msg.parts) && msg.parts.length > 0) 
//                      ? msg.parts[0] 
//                      : msg.text || 'Error: Content Missing'; // Fallback for unexpected data
        
//         return (
//             <div 
//                 key={index} 
//                 style={{ 
//                     marginBottom: '8px', padding: '8px 12px', borderRadius: '4px', 
//                     background: msg.role === 'user' ? '#f0f8ff' : '#e6ffe6', 
//                     borderLeft: `4px solid ${msg.role === 'user' ? '#007bff' : '#28a745'}` 
//                 }}
//             >
//                 <strong style={{ display: 'block', marginBottom: '3px' }}>{msg.role === 'user' ? 'Client:' : 'Agent:'}</strong> 
//                 {text}
//             </div>
//         );
//     });
// };


// client/src/pages/LeadList.jsx - UPDATED formatTranscript

// const formatTranscript = (transcript) => {
//     if (!Array.isArray(transcript)) return "No conversation history found.";
    
//     return transcript.map((msg, index) => {
//         let text = "Empty message";

//         // --- NEW LOGIC TO EXTRACT TEXT FROM COMPLEX OBJECTS ---
//         if (msg.parts && Array.isArray(msg.parts)) {
//             const firstPart = msg.parts[0];
            
//             if (typeof firstPart === 'string') {
//                 text = firstPart;
//             } else if (typeof firstPart === 'object' && firstPart !== null) {
//                 // This handles the {extras, text, type} object causing the crash!
//                 text = firstPart.text || JSON.stringify(firstPart);
//             }
//         } else if (typeof msg.text === 'string') {
//             text = msg.text;
//         } else if (msg.content && typeof msg.content === 'string') {
//             text = msg.content;
//         }

//         return (
//             <div 
//                 key={index} 
//                 style={{ 
//                     marginBottom: '10px', 
//                     padding: '10px', 
//                     borderRadius: '5px', 
//                     background: msg.role === 'user' ? '#f0f4f8' : '#e7f3ef', 
//                     borderLeft: `4px solid ${msg.role === 'user' ? '#007bff' : '#28a745'}` 
//                 }}
//             >
//                 <strong style={{ display: 'block', fontSize: '0.85em', color: '#555', marginBottom: '4px' }}>
//                     {msg.role === 'user' ? 'CLIENT' : 'AI ASSISTANT'}
//                 </strong> 
//                 <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
//             </div>
//         );
//     });
// };


// client/src/pages/LeadList.jsx - UPDATED formatTranscript UI

// const formatTranscript = (transcript) => {
//     if (!Array.isArray(transcript)) return "No conversation history found.";
    
//     return transcript.map((msg, index) => {
//         let text = "Empty message";

//         if (msg.parts && Array.isArray(msg.parts)) {
//             const firstPart = msg.parts[0];
//             if (typeof firstPart === 'string') {
//                 text = firstPart;
//             } else if (typeof firstPart === 'object' && firstPart !== null) {
//                 // If it's the complex object causing the crash, extract the text
//                 text = firstPart.text || JSON.stringify(firstPart);
//             }
//         } else if (typeof msg.text === 'string') {
//             text = msg.text;
//         }

//         return (
//             <div 
//                 key={index} 
//                 style={{ 
//                     marginBottom: '10px', 
//                     padding: '12px', 
//                     borderRadius: '8px', 
//                     background: msg.role === 'user' ? '#f0f4f8' : '#e7f3ef', 
//                     borderLeft: `5px solid ${msg.role === 'user' ? '#007bff' : '#28a745'}`,
//                     // --- CRITICAL UI FIXES BELOW ---
//                     maxWidth: '100%',        // Prevents stretching wider than parent
//                     wordBreak: 'break-word', // Forces long signatures/hashes to wrap
//                     overflowWrap: 'anywhere', // Ensures text wraps even if no spaces exist
//                     boxSizing: 'border-box'
//                 }}
//             >
//                 <strong style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>
//                     {msg.role === 'user' ? '👤 Client' : '🤖 AI Assistant'}
//                 </strong> 
//                 <div style={{ fontSize: '0.95rem', lineHeight: '1.4', color: '#333' }}>
//                     {text}
//                 </div>
//             </div>
//         );
//     });
// };



// const formatTranscript = (transcript) => {
//     if (!Array.isArray(transcript)) return "No conversation history found.";
    
//     return transcript.map((msg, index) => {
//         let textDisplay = "Empty message";

//         // Handle different possible structures to extract ONLY text
//         if (msg.parts && Array.isArray(msg.parts)) {
//             const firstPart = msg.parts[0];
            
//             if (typeof firstPart === 'string') {
//                 textDisplay = firstPart;
//             } else if (typeof firstPart === 'object' && firstPart !== null) {
//                 // FIX: Look specifically for the 'text' key inside the signature object
//                 textDisplay = firstPart.text || "Technical data segment (No displayable text)";
//             }
//         } else if (typeof msg.text === 'string') {
//             textDisplay = msg.text;
//         }

//         return (
//             <div 
//                 key={index} 
//                 style={{ 
//                     marginBottom: '10px', 
//                     padding: '12px', 
//                     borderRadius: '8px', 
//                     background: msg.role === 'user' ? '#f0f4f8' : '#e7f3ef', 
//                     borderLeft: `5px solid ${msg.role === 'user' ? '#007bff' : '#28a745'}`,
//                     maxWidth: '100%',
//                     wordBreak: 'break-word', 
//                     overflowWrap: 'anywhere', 
//                     boxSizing: 'border-box'
//                 }}
//             >
//                 <strong style={{ display: 'block', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>
//                     {msg.role === 'user' ? '👤 Client' : '🤖 AI Assistant'}
//                 </strong> 
//                 <div style={{ fontSize: '0.95rem', lineHeight: '1.4', color: '#333', whiteSpace: 'pre-wrap' }}>
//                     {textDisplay}
//                 </div>
//             </div>
//         );
//     });
// };








const formatTranscript = (transcript) => {
    if (!Array.isArray(transcript)) return "No history.";
    
    return transcript.map((msg, index) => {
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
                    wordBreak: 'break-word', // Essential fix for the overflow
                    overflowWrap: 'anywhere'  // Essential fix for the overflow
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

    // Fetch Leads Function (Stabilized with useCallback)
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` }
            };
            
            const response = await axios.get(`${API_BASE_URL}/admin/leads`, config);
            setLeads(response.data);
            setLoading(false);
            setError('');
        } catch (err) {
            console.error("Failed to fetch leads:", err);
            setLoading(false);
            
            if (err.response && err.response.status === 401) {
                logout();
                navigate('/admin/login');
            } else {
                 setError("Failed to load projects list.");
            }
        }
    }, [authToken, logout, navigate]); 

    // Initial Load Effect (Stabilized)
    useEffect(() => {
        if (authToken) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const handleDownloadReport = (sessionUuid) => {
        // This button handles both the initial report and the final SRS download
        window.open(`${API_BASE_URL}/admin/report/${sessionUuid}`, '_blank');
    };

    const handleGenerateSRS = async (lead) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/lead/${lead.session_uuid}/generate-srs`, null, {
                 headers: { Authorization: `Bearer ${authToken}` }
            });
            alert('SRS generation triggered! Status will update shortly.');
            fetchLeads(); 
        } catch (err) {
            console.error("Failed to generate SRS:", err);
            // Updated Alert to reflect that the endpoint issue should be fixed
            alert(`SRS Generation Failed. Details: ${err.response?.data?.error || 'Check server logs for reason.'}`); 
        }
    };
    
    const handleArrangeMeeting = (lead) => {
        alert(`Automation initiated: Preparing to send meeting link to ${lead.email}...`);
    };

    if (loading) return <div className="dashboard-loading">Loading Projects...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;

    return (
        <div className="leadlist-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1>📋 Project Portfolio</h1>
                <nav>
                    {/* KEEP Dashboard for Summary, remove Requirements/Viewer links */}
                    <button className="nav-button" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
                    <button className="nav-button logout-button" onClick={logout} style={{ marginLeft: '10px', background: '#dc3545', color: 'white' }}>Logout</button>
                </nav>
            </header>

            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <thead>
                        <tr style={{ background: '#007bff', color: 'white' }}>
                            <th style={{ width: '30px', padding: '12px' }}></th> 
                            <th style={{ padding: '12px' }}>Project Name / Email</th>
                            <th style={{ padding: '12px' }}>Type / Budget</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Score</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <React.Fragment key={lead.id}>
                                <tr 
                                    className={lead.status === 'Qualified' ? 'qualified' : 'new'} 
                                    style={{ 
                                        borderBottom: '1px solid #eee', 
                                        background: lead.status === 'SRS_Generated' ? '#f0fff0' : (lead.status === 'Qualified' ? '#f9f9f9' : 'white') 
                                    }}
                                >
                                    
                                    {/* EXPAND BUTTON COLUMN */}
                                    <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                                        <button 
                                            onClick={() => toggleExpand(lead.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', transform: expandedId === lead.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', padding: '10px' }}
                                        >
                                            ^
                                        </button>
                                    </td>
                                    
                                    {/* Project Name / Email */}
                                    <td style={{ padding: '12px' }}>
                                        <strong>{lead.project_name || 'Unnamed Project'}</strong>
                                        <div style={{ fontSize: '0.9em', color: '#666' }}>{lead.email || 'N/A'}</div>
                                    </td>
                                    
                                    {/* Type / Budget */}
                                    <td style={{ padding: '12px' }}>
                                        {lead.project_type || 'Unspecified'}
                                        <div style={{ fontWeight: 'bold' }}>{lead.budget || 'N/A'}</div>
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ fontWeight: 'bold', color: lead.status === 'SRS_Generated' ? '#4CAF50' : (lead.status === 'Qualified' ? '#2196F3' : '#FF9800') }}>
                                            {lead.status}
                                        </span>
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>{formatTime(lead.created_at)}</div>
                                    </td>
                                    
                                    {/* Score */}
                                    <td style={{ padding: '12px' }}>
                                        {lead.seriousness_score || 'N/A'}/10
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                        <button 
                                            onClick={() => handleDownloadReport(lead.session_uuid)}
                                            style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '0.9em' }}
                                        >
                                            📥 {lead.srs_status === 'Generated' ? 'Download SRS' : 'Download Report'}
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
                                
                                {/* EXPANDED SUMMARY ROW (Full Transcript) */}
                                {expandedId === lead.id && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '20px', background: '#f9f9f9', borderTop: '1px dashed #ddd' }}>
                                            <h4 style={{ marginBottom: '15px', color: '#007bff' }}>Full Conversation Transcript:</h4>
                                            <div className="transcript-summary" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
                                                {/* This now uses the crash-proof formatTranscript function */}
                                                {formatTranscript(lead.full_transcript)}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && <p className="no-data" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No leads have been recorded yet.</p>}
            </div>
        </div>
    );
};

export default LeadList;
