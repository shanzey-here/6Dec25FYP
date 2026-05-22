import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
 
// --- CONFIGURATION ---
const API_BASE_URL = 'http://127.0.0.1:5000/api';
const isDevelopment = import.meta.env.DEV;
 
function App() {
  const [messages, setMessages] = useState([]);
  const [sessionUuid, setSessionUuid] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQualified, setIsQualified] = useState(false);
  const [isSrsComplete, setIsSrsComplete] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const messagesEndRef = useRef(null);
 
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.text !== undefined) return String(value.text);
      if (value.content !== undefined) return String(value.content);
      if (value.message !== undefined) return String(value.message);
      if (value.output !== undefined) return String(value.output);
      for (const key in value) {
        if (typeof value[key] === 'string') return value[key];
      }
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
  };
 
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 
  useEffect(() => {
    let mounted = true;
    const startSession = async () => {
      if (!mounted) return;
      try {
        if (isDevelopment) await new Promise(r => setTimeout(r, 100));
        const response = await axios.post(`${API_BASE_URL}/session/start`);
        if (mounted) {
          setSessionUuid(response.data.session_uuid);
          setMessages([{ text: safeToString(response.data.ai_response), sender: 'ai' }]);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to start chat session:', error);
        setMessages([{ text: 'Connection error. Please refresh.', sender: 'system' }]);
      }
    };
    startSession();
    return () => { mounted = false; };
  }, []);
 
  useEffect(() => { scrollToBottom(); }, [messages]);
 
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !sessionUuid || quotaExceeded || isSrsComplete) return;
    const userMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        session_uuid: sessionUuid,
        user_message: userMsg
      });
      const { ai_response, is_qualified, is_srs_complete, quota_exceeded } = response.data;
      setMessages(prev => [...prev, { text: ai_response, sender: 'ai' }]);
      if (quota_exceeded) {
        setQuotaExceeded(true);
        setIsSrsComplete(true);
        setMessages(prev => [...prev, { text: '⚠️ Daily AI quota reached. You can continue chatting tomorrow.', sender: 'system' }]);
      }
      setIsQualified(is_qualified);
      if (is_srs_complete) setIsSrsComplete(true);
    } catch (error) {
      console.error('Chat error:', error);
      const errorData = error.response?.data || {};
      if (errorData.quota_exceeded || error.response?.status === 429 || error.message?.includes('quota')) {
        setQuotaExceeded(true);
        setIsSrsComplete(true);
        setMessages(prev => [...prev, { text: '⚠️ Daily AI quota reached. You can continue chatting tomorrow.', sender: 'system' }]);
      } else {
        setMessages(prev => [...prev, { text: errorData.error || 'Sorry, there was an error. Please try again.', sender: 'system' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  const getPhaseLabel = () => {
    if (quotaExceeded) return { label: 'QUOTA EXCEEDED', cls: 'tag-grey' };
    if (isSrsComplete) return { label: 'SRS COMPLETE', cls: 'tag-green' };
    if (isQualified) return { label: 'QUALIFIED', cls: 'tag-blue' };
    return { label: 'DISCOVERY', cls: 'tag-amber' };
  };
 
  const getPlaceholder = () => {
    if (!sessionUuid) return 'Establishing connection…';
    if (quotaExceeded) return 'Daily quota reached. Try again tomorrow.';
    if (isSrsComplete) return 'SRS gathering complete — thank you.';
    if (isQualified) return 'Continue with your requirements…';
    return 'Describe your project…';
  };
 
  const isSendDisabled = () =>
    !inputMessage.trim() || isLoading || !sessionUuid || isSrsComplete || quotaExceeded;
 
  const phase = getPhaseLabel();
  const progressPct = isSrsComplete ? 100 : isQualified ? 66 : 33;
 
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-void)',
      fontFamily: 'var(--font-ui)',
    }}>
 
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,11,16,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 880, margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
 
          {/* Logo + phase tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: 'var(--amber-dim)',
              border: '1px solid var(--amber-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>⬡</div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-hi)', letterSpacing: '-0.01em' }}>
              Lead Qualification
            </span>
            <span className={`tag ${phase.cls}`}>{phase.label}</span>
          </div>
 
          <Link
            to="/admin/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-md)',
              color: 'var(--text-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--amber)';
              e.currentTarget.style.borderColor = 'var(--amber-glow)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-md)';
              e.currentTarget.style.borderColor = 'var(--border-md)';
            }}
          >
            Admin →
          </Link>
        </div>
 
        {/* Progress bar */}
        <div style={{ height: 2, background: 'var(--bg-raised)', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progressPct}%`,
            background: isSrsComplete
              ? 'var(--green-ok)'
              : isQualified
                ? 'var(--blue-ice)'
                : 'var(--amber)',
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1), background 0.5s',
            boxShadow: isSrsComplete
              ? '0 0 8px rgba(62,207,142,0.5)'
              : isQualified
                ? '0 0 8px rgba(91,138,245,0.5)'
                : 'var(--glow-amber)',
          }} />
        </div>
      </header>
 
      {/* ── CHAT AREA ───────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{
          width: '100%', maxWidth: 880,
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}>
 
          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '28px 28px 8px',
            display: 'flex', flexDirection: 'column', gap: 20,
            minHeight: 400, maxHeight: 'calc(100vh - 280px)',
          }}>
            {!sessionUuid && (
              <div style={{ textAlign: 'center', color: 'var(--text-lo)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                ESTABLISHING CONNECTION…
              </div>
            )}
 
            {messages.map((msg, index) => {
              const displayText = safeToString(msg.text);
              const isAI = msg.sender === 'ai';
              const isSystem = msg.sender === 'system';
 
              if (isSystem) return (
                <div key={index} style={{
                  alignSelf: 'center',
                  background: 'rgba(245,101,101,0.08)',
                  border: '1px solid rgba(245,101,101,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  color: '#f56565',
                  fontFamily: 'var(--font-mono)',
                  animation: 'fadeUp 0.3s ease both',
                }}>
                  {displayText}
                </div>
              );
 
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 10,
                  justifyContent: isAI ? 'flex-start' : 'flex-end',
                  animation: 'fadeUp 0.3s ease both',
                  animationDelay: `${Math.min(index * 0.02, 0.1)}s`,
                }}>
                  {isAI && (
                    <div style={{
                      width: 30, height: 30, flexShrink: 0,
                      borderRadius: 8,
                      background: 'var(--amber-dim)',
                      border: '1px solid var(--amber-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: 'var(--amber)',
                      fontFamily: 'var(--font-mono)', fontWeight: 600,
                    }}>AI</div>
                  )}
 
                  <div style={{
                    maxWidth: '72%',
                    padding: '11px 16px',
                    borderRadius: isAI ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    background: isAI
                      ? 'var(--bg-panel)'
                      : 'linear-gradient(135deg, #f5a623 0%, #e8960f 100%)',
                    color: isAI ? 'var(--text-hi)' : '#080b10',
                    border: isAI ? '1px solid var(--border)' : 'none',
                    boxShadow: isAI ? 'var(--shadow-sm)' : '0 4px 16px rgba(245,166,35,0.25)',
                    fontWeight: isAI ? 400 : 600,
                  }}>
                    {displayText}
                  </div>
                </div>
              );
            })}
 
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{
                  width: 30, height: 30,
                  borderRadius: 8,
                  background: 'var(--amber-dim)',
                  border: '1px solid var(--amber-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600,
                }}>AI</div>
                <div style={{
                  padding: '14px 18px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px 12px 12px 12px',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6,
                      borderRadius: '50%',
                      background: 'var(--amber)',
                      display: 'block',
                      animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
 
          {/* Separator */}
          <div style={{ height: 1, background: 'var(--border)', margin: '0 0' }} />
 
          {/* Input */}
          <form onSubmit={sendMessage} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px',
            background: 'var(--bg-panel)',
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isLoading || !sessionUuid || quotaExceeded || isSrsComplete}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-hi)',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-ui)',
                padding: 0,
              }}
            />
 
            <button
              type="submit"
              disabled={isSendDisabled()}
              style={{
                width: 38, height: 38,
                borderRadius: 9,
                border: 'none',
                background: isSendDisabled()
                  ? 'var(--bg-hover)'
                  : 'linear-gradient(135deg, #f5a623, #e8960f)',
                color: isSendDisabled() ? 'var(--text-lo)' : '#080b10',
                fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isSendDisabled() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: isSendDisabled() ? 'none' : '0 0 14px rgba(245,166,35,0.35)',
                fontWeight: 700,
              }}
            >
              ↑
            </button>
          </form>
        </div>
      </main>
 
      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        padding: '10px 24px',
        display: 'flex', justifyContent: 'center',
        gap: 24,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-lo)',
        borderTop: '1px solid var(--border)',
      }}>
        <span>MSGS <strong style={{ color: 'var(--text-md)' }}>{messages.filter(m => m.sender === 'user').length}</strong></span>
        <span style={{ color: 'var(--border-hi)' }}>|</span>
        <span>STATUS{' '}
          <strong style={{
            color: quotaExceeded ? 'var(--red-err)'
              : isSrsComplete ? 'var(--green-ok)'
              : isQualified ? 'var(--blue-ice)'
              : 'var(--amber)',
          }}>
            {quotaExceeded ? 'QUOTA_USED' : isSrsComplete ? 'SRS_COMPLETE' : isQualified ? 'QUALIFIED' : 'ACTIVE'}
          </strong>
        </span>
      </footer>
    </div>
  );
}
 
export default App;









// import { useState, useEffect, useRef } from 'react';
// import './App.css';
// import axios from 'axios';
// import { Link } from 'react-router-dom';

// // --- CONFIGURATION ---
// const API_BASE_URL = 'http://127.0.0.1:5000/api';
// const isDevelopment = import.meta.env.DEV;

// /**
//  * Main application component for the AI Lead Qualification Chatbot.
//  */
// function App() {
//     // --- STATE MANAGEMENT ---
//     const [messages, setMessages] = useState([]);
//     const [sessionUuid, setSessionUuid] = useState(null);
//     const [inputMessage, setInputMessage] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
    
//     // Phase Flags
//     const [isQualified, setIsQualified] = useState(false); 
//     const [isSrsComplete, setIsSrsComplete] = useState(false); 
//     const [quotaExceeded, setQuotaExceeded] = useState(false);
    
//     // messageCache and setMessageCache removed here
//     // const [messageCache, setMessageCache] = useState({}); // REMOVED

//     // Ref for auto-scrolling the message view
//     const messagesEndRef = useRef(null);

//     // --- UTILITY FUNCTIONS ---

//     /**
//      * Safely converts any value to a displayable string
//      */
//     const safeToString = (value) => {
//         if (value === null || value === undefined) {
//             return '';
//         }
        
//         if (typeof value === 'string') {
//             return value;
//         }
        
//         if (typeof value === 'object') {
//             // Check for common object structures from LangChain/Gemini
//             if (value.text !== undefined) {
//                 return String(value.text);
//             }
//             if (value.content !== undefined) {
//                 return String(value.content);
//             }
//             if (value.message !== undefined) {
//                 return String(value.message);
//             }
//             if (value.output !== undefined) {
//                 return String(value.output);
//             }
            
//             // Try to extract any string property
//             for (const key in value) {
//                 if (typeof value[key] === 'string') {
//                     return value[key];
//                 }
//             }
            
//             // Last resort: JSON stringify
//             try {
//                 return JSON.stringify(value);
//             } catch {
//                 return String(value);
//             }
//         }
        
//         return String(value);
//     };

//     /**
//      * Scrolls the chat window to the bottom to show the latest message.
//      */
//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };

//     // --- EFFECTS ---

//     /**
//      * 1. Initial Effect: Start a new chat session when the component mounts.
//      */
//     useEffect(() => {
//         let mounted = true;
        
//         const startSession = async () => {
//             if (!mounted) return;
            
//             try {
//                 if (isDevelopment) {
//                     await new Promise(resolve => setTimeout(resolve, 100));
//                 }
                
//                 const response = await axios.post(`${API_BASE_URL}/session/start`);
                
//                 if (mounted) {
//                     setSessionUuid(response.data.session_uuid);

//                     const initialMessage = { 
//                         text: safeToString(response.data.ai_response), 
//                         sender: 'ai' 
//                     };
//                     setMessages([initialMessage]);
//                 }
//             } catch (error) {
//                 if (!mounted) return;
                
//                 console.error("Failed to start chat session:", error);
//                 setMessages([{ 
//                     text: "Connection error. Please refresh.", 
//                     sender: 'system' 
//                 }]);
//             }
//         };

//         startSession();
        
//         return () => {
//             mounted = false;
//         };
//     }, []);

//     /**
//      * 2. Side Effect: Scroll to the bottom whenever the messages array updates.
//      */
//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);

//     // --- CHAT LOGIC ---

//     /**
//      * Handles sending the user's message to the chat API.
//      */
//     const sendMessage = async (e) => {
//         e.preventDefault();
        
//         // Disable input if: empty, loading, no session, quota exceeded, OR SRS is complete
//         if (!inputMessage.trim() || isLoading || !sessionUuid || quotaExceeded || isSrsComplete) return; 

//         const userMsg = inputMessage;
//         setInputMessage('');
//         setIsLoading(true);

//         // messageCache logic is skipped here

//         // Add user message to UI immediately
//         setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);

//         try {
//             const response = await axios.post(`${API_BASE_URL}/chat`, {
//                 session_uuid: sessionUuid,
//                 user_message: userMsg
//             });

//             // Capture the new is_srs_complete flag from the backend
//             const { ai_response, is_qualified, is_srs_complete, quota_exceeded } = response.data; 
            
//             // Add AI response to UI
//             setMessages(prev => [...prev, { text: ai_response, sender: 'ai' }]);
            
//             // Handle quota exceeded case (highest priority flag)
//             if (quota_exceeded) {
//                 setQuotaExceeded(true);
//                 setIsSrsComplete(true); // Disable input via SRS flag
//                 setMessages(prev => [...prev, { 
//                     text: "⚠️ Daily AI quota reached. You can continue chatting tomorrow.", 
//                     sender: 'system' 
//                 }]);
//             }
            
//             // Update Qualification status (Phase 1 completion)
//             setIsQualified(is_qualified); 

//             // Update SRS Completion status (Phase 2 completion)
//             if (is_srs_complete) {
//                 setIsSrsComplete(true);
//             }

//         } catch (error) {
//             console.error("Chat error:", error);
            
//             const errorData = error.response?.data || {};
            
//             // Handle quota/rate limit errors (both successful and failed requests)
//             if (errorData.quota_exceeded || error.response?.status === 429 || error.message?.includes('quota')) {
//                 setQuotaExceeded(true);
//                 setIsSrsComplete(true);
                
//                 setMessages(prev => [...prev, { 
//                     text: "⚠️ Daily AI quota reached. You can continue chatting tomorrow.", 
//                     sender: 'system' 
//                 }]);
//             } 
//             else {
//                 // Generic error handling
//                 const errorMsg = errorData.error || "Sorry, there was an error. Please try again.";
                
//                 setMessages(prev => [...prev, { 
//                     text: errorMsg, 
//                     sender: 'system' 
//                 }]);
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // --- RENDERING THE CHAT UI ---
    
//     // Determine input placeholder based on state
//     const getPlaceholder = () => {
//         if (!sessionUuid) return "Connecting...";
//         if (quotaExceeded) return "Daily quota reached. Try again tomorrow.";
//         if (isSrsComplete) return "SRS Gathering complete. Thank you!"; // Final state message
//         if (isQualified) return "Qualification complete. Proceed with requirements..."; // Intermediate state message
//         return "Ask about your project...";
//     };

//     // Determine if send button should be disabled
//     const isSendDisabled = () => {
//         // Disabled if: empty, loading, no session, quota exceeded, OR SRS is complete
//         return !inputMessage.trim() || 
//                 isLoading || 
//                 !sessionUuid || 
//                 isSrsComplete || 
//                 quotaExceeded;
//     };

//     return (
//         <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800 flex flex-col">
      
//           {/* HEADER */}
//           <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-slate-200">
//             <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
//               <h1 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
//                 🤖 <span>AI Lead Qualification Agent</span>
//               </h1>
      
//               <Link
//                 to="/admin/login"
//                 className="px-5 py-2 rounded-lg text-sm font-semibold text-white
//                            bg-gradient-to-r
//                            hover:from-indigo-500 hover:to-blue-500
//                            shadow-md transition"
//               >
//                 Admin Login
//               </Link>
//             </div>
      
//             {/* PROGRESS INDICATOR */}
//             <div className="h-1 w-full bg-slate-200">
//               <div
//                 className={`h-full transition-all duration-500
//                   ${isSrsComplete ? 'w-full bg-green-500'
//                   : isQualified ? 'w-2/3 bg-blue-500'
//                   : 'w-1/3 bg-indigo-400'}`}
//               />
//             </div>
//           </header>
      
//           {/* CHAT AREA */}
//           <main className="flex-1 flex justify-center px-4 py-6">
//             <div className="w-full max-w-5xl flex flex-col
//                             bg-white/60 backdrop-blur-xl
//                             rounded-2xl shadow-xl border border-white">
      
//               {/* MESSAGES */}
//               <div className="flex-1 overflow-y-auto p-6 space-y-5">
      
//                 {!sessionUuid && (
//                   <div className="text-center text-sm text-slate-500">
//                     Connecting to AI Agent…
//                   </div>
//                 )}
      
//                 {messages.map((msg, index) => {
//                   const displayText = safeToString(msg.text);
//                   const isAI = msg.sender === 'ai';
//                   const isSystem = msg.sender === 'system';
      
//                   if (isSystem) {
//                     return (
//                       <div key={index} className="text-center text-sm text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-4 py-2">
//                         {displayText}
//                       </div>
//                     );
//                   }
      
//                   return (
//                     <div
//                       key={index}
//                       className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
//                     >
//                       {isAI && (
//                         <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600
//                                         text-white flex items-center justify-center text-sm font-bold">
//                           AI
//                         </div>
//                       )}
      
//                       <div
//                         className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow
//                           ${isAI
//                             ? 'bg-white text-slate-800 border border-slate-200'
//                             : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'}`}
//                       >
//                         {displayText}
//                       </div>
//                     </div>
//                   );
//                 })}
      
//                 {isLoading && (
//                   <div className="flex items-end gap-3">
//                     <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
//                       AI
//                     </div>
//                     <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow flex gap-1">
//                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
//                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
//                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
//                     </div>
//                   </div>
//                 )}
      
//                 <div ref={messagesEndRef} />
//               </div>
      
//               {/* INPUT */}
//               <form
//                 onSubmit={sendMessage}
//                 className="flex items-center gap-3 border-t border-slate-200 px-4 py-4 bg-white/70"
//               >
//                 <input
//                   type="text"
//                   value={inputMessage}
//                   onChange={(e) => setInputMessage(e.target.value)}
//                   placeholder={getPlaceholder()}
//                   disabled={isLoading || !sessionUuid || quotaExceeded || isSrsComplete}
//                   className="flex-1 bg-transparent outline-none text-sm placeholder-slate-400 disabled:opacity-50"
//                 />
      
//                 <button
//                   type="submit"
//                   disabled={isSendDisabled()}
//                   className="w-11 h-11 rounded-full flex items-center justify-center
//                              bg-gradient-to-br from-indigo-600 to-blue-600
//                              text-white font-bold shadow-md
//                              hover:scale-105 transition
//                              disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   ➤
//                 </button>
//               </form>
//             </div>
//           </main>
      
//           {/* FOOTER */}
//           <footer className="text-center text-xs text-slate-500 py-3">
//             Messages: {messages.filter(m => m.sender === 'user').length} user • Status:{' '}
//             {quotaExceeded ? 'Quota Used'
//               : isSrsComplete ? 'SRS Complete'
//               : isQualified ? 'Qualified'
//               : 'Active'}
//           </footer>
//         </div>
//       );
// }
// export default App;

