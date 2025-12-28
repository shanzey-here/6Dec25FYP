// import { useState, useEffect, useRef } from 'react';
// import './App.css';
// import axios from 'axios';
// import { Link } from 'react-router-dom';

// // --- CONFIGURATION ---
// const API_BASE_URL = 'http://127.0.0.1:5000/api';

// /**
//  * Main application component for the AI Lead Qualification Chatbot.
//  */
// function App() {
//     // --- STATE MANAGEMENT ---
//     const [messages, setMessages] = useState([]);
//     const [sessionUuid, setSessionUuid] = useState(null);
//     const [inputMessage, setInputMessage] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [isQualified, setIsQualified] = useState(false);

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
//             console.warn("⚠️ Object detected, converting to string:", value);
            
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
        
//         // For numbers, booleans, etc.
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
//         const startSession = async () => {
//             try {
//                 // Request a new session UUID from the backend
//                 const response = await axios.post(`${API_BASE_URL}/session/start`);
//                 setSessionUuid(response.data.session_uuid);

//                 // Set the initial AI greeting message
//                 const initialMessage = { 
//                     text: safeToString(response.data.ai_response), 
//                     sender: 'ai' 
//                 };
//                 setMessages([initialMessage]);
//             } catch (error) {
//                 console.error("Failed to start chat session:", error);
//                 setMessages([{ 
//                     text: "Connection error. Please refresh.", 
//                     sender: 'system' 
//                 }]);
//             }
//         };

//         startSession();
//     }, []); // Empty dependency array means this runs only once on mount

//     /**
//      * 2. Side Effect: Scroll to the bottom whenever the messages array updates.
//      */
//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);


//     // --- CHAT LOGIC ---

//     /**
//      * Handles sending the user's message to the chat API.
//      * @param {Event} e The form submit event.
//      */
//     // const sendMessage = async (e) => {
//     //     e.preventDefault();

//     //     // Validation checks
//     //     if (!inputMessage.trim() || isLoading || isQualified || !sessionUuid) return;

//     //     const userMsg = inputMessage;
//     //     setInputMessage(''); // Clear input immediately
//     //     setIsLoading(true); // Disable input/button

//     //     // Add user message to the UI
//     //     setMessages(prev => [...prev, { 
//     //         text: safeToString(userMsg), 
//     //         sender: 'user' 
//     //     }]);

//     //     try {
//     //         // API call to the chat endpoint
//     //         const response = await axios.post(`${API_BASE_URL}/chat`, {
//     //             session_uuid: sessionUuid,
//     //             user_message: userMsg
//     //         });

//     //         const { ai_response, is_qualified } = response.data;

//     //         // --- SAFETY CHECK & TYPE COERCION ---
//     //         const safeAiResponse = safeToString(ai_response);
            
//     //         // Add AI response to the UI
//     //         setMessages(prev => [...prev, { 
//     //             text: safeAiResponse, 
//     //             sender: 'ai' 
//     //         }]);

//     //         // Update qualification status
//     //         if (is_qualified) {
//     //             setIsQualified(true);
//     //         }

//     //     } catch (error) {
//     //         console.error("Chat API Error:", error);
//     //         const errorMsg = error.response?.data?.error || "Server error during chat.";
//     //         setMessages(prev => [...prev, { 
//     //             text: safeToString(errorMsg), 
//     //             sender: 'system' 
//     //         }]);
//     //     } finally {
//     //         setIsLoading(false); // Re-enable input/button
//     //     }
//     // };



//     // In App.jsx, update the sendMessage function:
// const sendMessage = async (e) => {
//     e.preventDefault();
    
//     if (!inputMessage.trim() || isLoading || !sessionUuid) return;

//     const userMsg = inputMessage;
//     setInputMessage('');
//     setIsLoading(true);
//     setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);

//     try {
//         const response = await axios.post(`${API_BASE_URL}/chat`, {
//             session_uuid: sessionUuid,
//             user_message: userMsg
//         });

//         const { ai_response, is_qualified, quota_exceeded } = response.data; // Added quota_exceeded
        
//         setMessages(prev => [...prev, { text: ai_response, sender: 'ai' }]);
        
//         // Handle quota exceeded case
//         if (quota_exceeded) {
//             // Disable further input with a clear message
//             setIsQualified(true); // Use this to disable input in your current logic
//             // Add a persistent quota banner
//             setMessages(prev => [...prev, { 
//                 text: "⚠️ Daily AI quota reached. You can continue chatting tomorrow.", 
//                 sender: 'system' 
//             }]);
//         }
        
//         if (is_qualified && !quota_exceeded) {
//             setIsQualified(true);
//         }

//     } catch (error) {
//         console.error("Chat error:", error);
        
//         // Check if it's a quota error from the response
//         if (error.response?.data?.quota_exceeded) {
//             setMessages(prev => [...prev, { 
//                 text: "⚠️ Daily AI quota reached. You can continue chatting tomorrow.", 
//                 sender: 'system' 
//             }]);
//             setIsQualified(true); // Disable input
//         } else {
//             setMessages(prev => [...prev, { 
//                 text: "Error: " + (error.response?.data?.error || "Please try again"), 
//                 sender: 'system' 
//             }]);
//         }
//     } finally {
//         setIsLoading(false);
//     }
// };





//     // --- RENDERING THE CHAT UI ---
//     return (
//         <div className="main-app-layout">
//             {/* Header with Title and Admin Link */}
//             <header className="chatbot-header">
//                 <h1>🤖 AI Lead Qualification Agent</h1>
//                 <Link to="/admin/login" className="admin-link">Admin Login</Link>
//             </header>

//             <div className="chat-container">

//                 {/* Display Messages */}
//                 <div className="messages-list">
//                     {!sessionUuid && (
//                         <div className="system-message">Connecting to Agent...</div>
//                     )}
                    
//                     {messages.map((msg, index) => {
//                         const displayText = safeToString(msg.text);
//                         const senderLabel = msg.sender === 'ai' ? 'Agent' : 
//                                            msg.sender === 'system' ? 'System' : 
//                                            'You';
                        
//                         return (
//                             <div key={index} className={`message-row message-${msg.sender}`}>
//                                 <span className="sender-tag">{senderLabel}</span>
//                                 <div className="message-bubble">
//                                     {displayText}
//                                 </div>
//                             </div>
//                         );
//                     })}
                    
//                     {isLoading && (
//                         <div className="message-row message-ai message-loading">
//                             <span className="sender-tag">Agent</span>
//                             <div className="message-bubble">
//                                 <span className="typing-indicator">
//                                     <span>.</span><span>.</span><span>.</span>
//                                 </span>
//                             </div>
//                         </div>
//                     )}
                    
//                     {/* Invisible element for auto-scrolling */}
//                     <div ref={messagesEndRef} />
//                 </div>

//                 {/* Input Form */}
//                 <form onSubmit={sendMessage} className="chat-input-form">
//                     <input
//                         type="text"
//                         value={inputMessage}
//                         onChange={(e) => setInputMessage(e.target.value)}
//                         placeholder={
//                             isQualified
//                             ? "Qualification complete."
//                             : (sessionUuid ? "Ask about your project..." : "Connecting...")
//                         }
//                         disabled={isLoading || !sessionUuid}
//                     />
//                     <button
//                         type="submit"
//                         disabled={!inputMessage.trim() || isLoading || !sessionUuid || isQualified}
//                     >
//                         {isLoading ? 'Wait' : 'Send'}
//                     </button>
//                 </form>

//                 {/* Qualification Complete Banner */}
//                 {isQualified && (
//                     <div className="qualified-banner">
//                         ✅ Qualification Complete! Report saved to Admin Dashboard.
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default App;



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

    return (
        <div className="main-app-layout">
            {/* Header with Title and Admin Link */}
            <header className="chatbot-header">
                <h1>🤖 AI Lead Qualification Agent</h1>
                <Link to="/admin/login" className="admin-link">Admin Login</Link>
            </header>

            <div className="chat-container">

                {/* Display Messages */}
                <div className="messages-list">
                    {!sessionUuid && (
                        <div className="system-message">Connecting to Agent...</div>
                    )}
                    
                    {messages.map((msg, index) => {
                        const displayText = safeToString(msg.text);
                        const senderLabel = msg.sender === 'ai' ? 'Agent' : 
                                            msg.sender === 'system' ? 'System' : 
                                            'You';
                        
                        const messageClass = msg.sender === 'system' ? 'message-system' : `message-${msg.sender}`;
                        
                        return (
                            <div key={index} className={`message-row ${messageClass}`}>
                                <span className="sender-tag">{senderLabel}</span>
                                <div className="message-bubble">
                                    {displayText}
                                </div>
                            </div>
                        );
                    })}
                    
                    {isLoading && (
                        <div className="message-row message-ai message-loading">
                            <span className="sender-tag">Agent</span>
                            <div className="message-bubble">
                                <span className="typing-indicator">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Invisible element for auto-scrolling */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={sendMessage} className="chat-input-form">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={getPlaceholder()}
                        // Disabled if loading, no session, quota exceeded, or SRS complete
                        disabled={isLoading || !sessionUuid || quotaExceeded || isSrsComplete} 
                        aria-label="Chat message input"
                    />
                    <button
                        type="submit"
                        disabled={isSendDisabled()}
                        aria-label="Send message"
                    >
                        {isLoading ? 'Wait' : 'Send'}
                    </button>
                </form>

                {/* Status Banners */}
                {isSrsComplete && !quotaExceeded && (
                    <div className="status-banner qualified-banner">
                        ✅ Requirements Gathering Complete! Your SRS document is ready in the Admin Dashboard.
                    </div>
                )}
                
                {quotaExceeded && (
                    <div className="status-banner quota-banner">
                        ⚠️ Daily AI quota reached. You can continue chatting tomorrow.
                    </div>
                )}
                
                {/* Development Mode Warning */}
                {isDevelopment && (
                    <div className="dev-warning">
                        🛠️ Development Mode: Hot reload protection active
                    </div>
                )}
            </div>
            
            {/* Stats Footer (Optional) */}
            <div className="chat-stats">
                <small>
                    Messages: {messages.filter(m => m.sender === 'user').length} user • 
                    Status: {quotaExceeded ? 'Quota Used' : (isSrsComplete ? 'SRS Complete' : (isQualified ? 'Qualified' : 'Active'))}
                </small>
            </div>
        </div>
    );
}

export default App;