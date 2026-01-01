import { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://127.0.0.1:5000/api';
const isDevelopment = import.meta.env.DEV;

/**
 * Main application component for the AI Lead Qualification Chatbot.
 */
function App() {
    // --- STATE MANAGEMENT ---
    const [messages, setMessages] = useState([]);
    const [sessionUuid, setSessionUuid] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Phase Flags
    const [isQualified, setIsQualified] = useState(false); 
    const [isSrsComplete, setIsSrsComplete] = useState(false); 
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    
    // messageCache and setMessageCache removed here
    // const [messageCache, setMessageCache] = useState({}); // REMOVED

    // Ref for auto-scrolling the message view
    const messagesEndRef = useRef(null);

    // --- UTILITY FUNCTIONS ---

    /**
     * Safely converts any value to a displayable string
     */
    const safeToString = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        
        if (typeof value === 'string') {
            return value;
        }
        
        if (typeof value === 'object') {
            // Check for common object structures from LangChain/Gemini
            if (value.text !== undefined) {
                return String(value.text);
            }
            if (value.content !== undefined) {
                return String(value.content);
            }
            if (value.message !== undefined) {
                return String(value.message);
            }
            if (value.output !== undefined) {
                return String(value.output);
            }
            
            // Try to extract any string property
            for (const key in value) {
                if (typeof value[key] === 'string') {
                    return value[key];
                }
            }
            
            // Last resort: JSON stringify
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        }
        
        return String(value);
    };

    /**
     * Scrolls the chat window to the bottom to show the latest message.
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- EFFECTS ---

    /**
     * 1. Initial Effect: Start a new chat session when the component mounts.
     */
    useEffect(() => {
        let mounted = true;
        
        const startSession = async () => {
            if (!mounted) return;
            
            try {
                if (isDevelopment) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                const response = await axios.post(`${API_BASE_URL}/session/start`);
                
                if (mounted) {
                    setSessionUuid(response.data.session_uuid);

                    const initialMessage = { 
                        text: safeToString(response.data.ai_response), 
                        sender: 'ai' 
                    };
                    setMessages([initialMessage]);
                }
            } catch (error) {
                if (!mounted) return;
                
                console.error("Failed to start chat session:", error);
                setMessages([{ 
                    text: "Connection error. Please refresh.", 
                    sender: 'system' 
                }]);
            }
        };

        startSession();
        
        return () => {
            mounted = false;
        };
    }, []);

    /**
     * 2. Side Effect: Scroll to the bottom whenever the messages array updates.
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- CHAT LOGIC ---

    /**
     * Handles sending the user's message to the chat API.
     */
    const sendMessage = async (e) => {
        e.preventDefault();
        
        // Disable input if: empty, loading, no session, quota exceeded, OR SRS is complete
        if (!inputMessage.trim() || isLoading || !sessionUuid || quotaExceeded || isSrsComplete) return; 

        const userMsg = inputMessage;
        setInputMessage('');
        setIsLoading(true);

        // messageCache logic is skipped here

        // Add user message to UI immediately
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);

        try {
            const response = await axios.post(`${API_BASE_URL}/chat`, {
                session_uuid: sessionUuid,
                user_message: userMsg
            });

            // Capture the new is_srs_complete flag from the backend
            const { ai_response, is_qualified, is_srs_complete, quota_exceeded } = response.data; 
            
            // Add AI response to UI
            setMessages(prev => [...prev, { text: ai_response, sender: 'ai' }]);
            
            // Handle quota exceeded case (highest priority flag)
            if (quota_exceeded) {
                setQuotaExceeded(true);
                setIsSrsComplete(true); // Disable input via SRS flag
                setMessages(prev => [...prev, { 
                    text: "⚠️ Daily AI quota reached. You can continue chatting tomorrow.", 
                    sender: 'system' 
                }]);
            }
            
            // Update Qualification status (Phase 1 completion)
            setIsQualified(is_qualified); 

            // Update SRS Completion status (Phase 2 completion)
            if (is_srs_complete) {
                setIsSrsComplete(true);
            }

        } catch (error) {
            console.error("Chat error:", error);
            
            const errorData = error.response?.data || {};
            
            // Handle quota/rate limit errors (both successful and failed requests)
            if (errorData.quota_exceeded || error.response?.status === 429 || error.message?.includes('quota')) {
                setQuotaExceeded(true);
                setIsSrsComplete(true);
                
                setMessages(prev => [...prev, { 
                    text: "⚠️ Daily AI quota reached. You can continue chatting tomorrow.", 
                    sender: 'system' 
                }]);
            } 
            else {
                // Generic error handling
                const errorMsg = errorData.error || "Sorry, there was an error. Please try again.";
                
                setMessages(prev => [...prev, { 
                    text: errorMsg, 
                    sender: 'system' 
                }]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDERING THE CHAT UI ---
    
    // Determine input placeholder based on state
    const getPlaceholder = () => {
        if (!sessionUuid) return "Connecting...";
        if (quotaExceeded) return "Daily quota reached. Try again tomorrow.";
        if (isSrsComplete) return "SRS Gathering complete. Thank you!"; // Final state message
        if (isQualified) return "Qualification complete. Proceed with requirements..."; // Intermediate state message
        return "Ask about your project...";
    };

    // Determine if send button should be disabled
    const isSendDisabled = () => {
        // Disabled if: empty, loading, no session, quota exceeded, OR SRS is complete
        return !inputMessage.trim() || 
                isLoading || 
                !sessionUuid || 
                isSrsComplete || 
                quotaExceeded;
    };

    // return (
    //     <div className="main-app-layout">
    //         {/* Header with Title and Admin Link */}
    //         <header className="chatbot-header">
    //             <h1>🤖 AI Lead Qualification Agent</h1>
    //             <Link to="/admin/login" className="admin-link">Admin Login</Link>
    //         </header>

    //         <div className="chat-container">

    //             {/* Display Messages */}
    //             <div className="messages-list">
    //                 {!sessionUuid && (
    //                     <div className="system-message">Connecting to Agent...</div>
    //                 )}
                    
    //                 {messages.map((msg, index) => {
    //                     const displayText = safeToString(msg.text);
    //                     const senderLabel = msg.sender === 'ai' ? 'Agent' : 
    //                                         msg.sender === 'system' ? 'System' : 
    //                                         'You';
                        
    //                     const messageClass = msg.sender === 'system' ? 'message-system' : `message-${msg.sender}`;
                        
    //                     return (
    //                         <div key={index} className={`message-row ${messageClass}`}>
    //                             <span className="sender-tag">{senderLabel}</span>
    //                             <div className="message-bubble">
    //                                 {displayText}
    //                             </div>
    //                         </div>
    //                     );
    //                 })}
                    
    //                 {isLoading && (
    //                     <div className="message-row message-ai message-loading">
    //                         <span className="sender-tag">Agent</span>
    //                         <div className="message-bubble">
    //                             <span className="typing-indicator">
    //                                 <span>.</span><span>.</span><span>.</span>
    //                             </span>
    //                         </div>
    //                     </div>
    //                 )}
                    
    //                 {/* Invisible element for auto-scrolling */}
    //                 <div ref={messagesEndRef} />
    //             </div>

    //             {/* Input Form */}
    //             <form onSubmit={sendMessage} className="chat-input-form">
    //                 <input
    //                     type="text"
    //                     value={inputMessage}
    //                     onChange={(e) => setInputMessage(e.target.value)}
    //                     placeholder={getPlaceholder()}
    //                     // Disabled if loading, no session, quota exceeded, or SRS complete
    //                     disabled={isLoading || !sessionUuid || quotaExceeded || isSrsComplete} 
    //                     aria-label="Chat message input"
    //                 />
    //                 <button
    //                     type="submit"
    //                     disabled={isSendDisabled()}
    //                     aria-label="Send message"
    //                 >
    //                     {isLoading ? 'Wait' : 'Send'}
    //                 </button>
    //             </form>

    //             {/* Status Banners */}
    //             {isSrsComplete && !quotaExceeded && (
    //                 <div className="status-banner qualified-banner">
    //                     ✅ Requirements Gathering Complete! Your SRS document is ready in the Admin Dashboard.
    //                 </div>
    //             )}
                
    //             {quotaExceeded && (
    //                 <div className="status-banner quota-banner">
    //                     ⚠️ Daily AI quota reached. You can continue chatting tomorrow.
    //                 </div>
    //             )}
                
    //             {/* Development Mode Warning */}
    //             {isDevelopment && (
    //                 <div className="dev-warning">
    //                     🛠️ Development Mode: Hot reload protection active
    //                 </div>
    //             )}
    //         </div>
            
    //         {/* Stats Footer (Optional) */}
    //         <div className="chat-stats">
    //             <small>
    //                 Messages: {messages.filter(m => m.sender === 'user').length} user • 
    //                 Status: {quotaExceeded ? 'Quota Used' : (isSrsComplete ? 'SRS Complete' : (isQualified ? 'Qualified' : 'Active'))}
    //             </small>
    //         </div>
    //     </div>
    // );









    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800 flex flex-col">
      
          {/* HEADER */}
          <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-slate-200">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
              <h1 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                🤖 <span>AI Lead Qualification Agent</span>
              </h1>
      
              <Link
                to="/admin/login"
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white
                           bg-gradient-to-r from-indigo-600 to-blue-600
                           hover:from-indigo-500 hover:to-blue-500
                           shadow-md transition"
              >
                Admin Login
              </Link>
            </div>
      
            {/* PROGRESS INDICATOR */}
            <div className="h-1 w-full bg-slate-200">
              <div
                className={`h-full transition-all duration-500
                  ${isSrsComplete ? 'w-full bg-green-500'
                  : isQualified ? 'w-2/3 bg-blue-500'
                  : 'w-1/3 bg-indigo-400'}`}
              />
            </div>
          </header>
      
          {/* CHAT AREA */}
          <main className="flex-1 flex justify-center px-4 py-6">
            <div className="w-full max-w-5xl flex flex-col
                            bg-white/60 backdrop-blur-xl
                            rounded-2xl shadow-xl border border-white">
      
              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
      
                {!sessionUuid && (
                  <div className="text-center text-sm text-slate-500">
                    Connecting to AI Agent…
                  </div>
                )}
      
                {messages.map((msg, index) => {
                  const displayText = safeToString(msg.text);
                  const isAI = msg.sender === 'ai';
                  const isSystem = msg.sender === 'system';
      
                  if (isSystem) {
                    return (
                      <div key={index} className="text-center text-sm text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-4 py-2">
                        {displayText}
                      </div>
                    );
                  }
      
                  return (
                    <div
                      key={index}
                      className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAI && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600
                                        text-white flex items-center justify-center text-sm font-bold">
                          AI
                        </div>
                      )}
      
                      <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow
                          ${isAI
                            ? 'bg-white text-slate-800 border border-slate-200'
                            : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'}`}
                      >
                        {displayText}
                      </div>
                    </div>
                  );
                })}
      
                {isLoading && (
                  <div className="flex items-end gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                      AI
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                  </div>
                )}
      
                <div ref={messagesEndRef} />
              </div>
      
              {/* INPUT */}
              <form
                onSubmit={sendMessage}
                className="flex items-center gap-3 border-t border-slate-200 px-4 py-4 bg-white/70"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={getPlaceholder()}
                  disabled={isLoading || !sessionUuid || quotaExceeded || isSrsComplete}
                  className="flex-1 bg-transparent outline-none text-sm placeholder-slate-400 disabled:opacity-50"
                />
      
                <button
                  type="submit"
                  disabled={isSendDisabled()}
                  className="w-11 h-11 rounded-full flex items-center justify-center
                             bg-gradient-to-br from-indigo-600 to-blue-600
                             text-white font-bold shadow-md
                             hover:scale-105 transition
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➤
                </button>
              </form>
            </div>
          </main>
      
          {/* FOOTER */}
          <footer className="text-center text-xs text-slate-500 py-3">
            Messages: {messages.filter(m => m.sender === 'user').length} user • Status:{' '}
            {quotaExceeded ? 'Quota Used'
              : isSrsComplete ? 'SRS Complete'
              : isQualified ? 'Qualified'
              : 'Active'}
          </footer>
        </div>
      );
      





}

export default App;

