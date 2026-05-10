import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIChatWidget = () => {
  const { token } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  
  // Load conversation from localStorage
  const loadConversation = () => {
    try {
      const saved = localStorage.getItem('kairos_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only load if it's from today
        const savedDate = new Date(parsed.timestamp).toDateString();
        const today = new Date().toDateString();
        if (savedDate === today) {
          return parsed.messages;
        }
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
    return [{ role: 'assistant', content: 'I am KAIROS. How may I assist you with your event planning today?', timestamp: new Date().toISOString() }];
  };

  const [messages, setMessages] = useState(loadConversation);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('kairos_chat_history', JSON.stringify({
        messages,
        timestamp: new Date().toISOString()
      }));
    }
  }, [messages]);

  // If not logged in, don't show the widget
  if (!token) return null;

  const handleSend = async (e, quickAction = null) => {
    e?.preventDefault();
    const messageToSend = quickAction || input.trim();
    if (!messageToSend || isLoading) return;

    setInput('');
    const userMessage = { role: 'user', content: messageToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setConnectionStatus('sending');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: messageToSend, 
          history: messages.slice(-10), // Only send last 10 messages for context
          context: {
            page: location.pathname,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get response');
      }
      
      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        timestamp: new Date().toISOString()
      }]);
      setConnectionStatus('connected');
      setRetryCount(0);
    } catch (err) {
      setConnectionStatus('error');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, but I'm experiencing connectivity issues. ${err.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        // Remove last error message
        setMessages(prev => prev.slice(0, -1));
        handleSend(null, lastUserMessage.content);
      }
    }
  };

  const handleClearConversation = () => {
    if (confirm('Clear conversation history?')) {
      const initialMessage = { 
        role: 'assistant', 
        content: 'I am KAIROS. How may I assist you with your event planning today?',
        timestamp: new Date().toISOString()
      };
      setMessages([initialMessage]);
      localStorage.removeItem('kairos_chat_history');
    }
  };

  const handleExportConversation = () => {
    const text = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      return `[${time}] ${m.role.toUpperCase()}: ${m.content}`;
    }).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairos-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const suggestedQuestions = [
    "Show my bookings",
    "Find venues in Lahore",
    "Budget calculator",
    "Event planning tips"
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-10 right-10 w-20 h-20 rounded-full bg-black backdrop-blur-2xl border border-white/10 flex items-center justify-center text-primary hover:border-primary transition-all duration-700 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group animate-reveal-up"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700"></div>
          <img src="/logo.png" alt="KAIROS" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-700 relative z-10 brightness-110 contrast-125" />
          {connectionStatus === 'error' && (
            <span className="absolute top-4 right-4 w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]"></span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-10 right-10 w-full max-w-[450px] h-[700px] max-h-[85vh] bg-black/80 backdrop-blur-3xl border border-white/5 flex flex-col z-50 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-fadeIn">
          {/* Header */}
          <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <img src="/logo.png" alt="KAIROS" className="w-6 h-6 object-contain brightness-110 contrast-125" />
                <h2 className="font-h1 text-sm text-white uppercase tracking-[0.5em] font-light">KAIROS AI</h2>
                <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-primary/40' : 'bg-error animate-pulse'}`}></div>
              </div>
              <p className="font-eyebrow text-[9px] text-white/30 tracking-[0.4em] uppercase">Intelligence Concierge</p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={handleExportConversation} className="text-white/20 hover:text-primary transition-all duration-500" title="Archive Transcript">
                <span className="material-symbols-outlined text-[20px] font-light">archive</span>
              </button>
              <button onClick={handleClearConversation} className="text-white/20 hover:text-primary transition-all duration-500" title="Reset Session">
                <span className="material-symbols-outlined text-[20px] font-light">refresh</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined font-light">close</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-transparent custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-reveal-up`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`font-eyebrow text-[9px] tracking-[0.4em] uppercase ${msg.role === 'assistant' ? 'text-primary' : 'text-white/20'}`}>
                    {msg.role === 'assistant' ? 'Kairos' : 'Client'}
                  </span>
                  {msg.timestamp && (
                    <span className="font-eyebrow text-[8px] text-white/10 uppercase tracking-widest">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className={`group relative max-w-[90%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div 
                    className={`flex-1 p-6 text-[13px] font-body leading-relaxed tracking-wide ${
                      msg.role === 'user' 
                        ? 'bg-primary/5 border border-primary/20 text-white font-light' 
                        : msg.isError
                        ? 'bg-error/5 border border-error/20 text-error font-light'
                        : 'bg-white/[0.03] border border-white/5 text-white/70 font-light'
                    }`}
                  >
                    {msg.role === 'assistant' && !msg.isError ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-white tracking-wider" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  
                  <div className={`flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'assistant' && !msg.isError && (
                      <button onClick={() => handleCopyMessage(msg.content)} className="text-white/20 hover:text-primary transition-colors" title="Copy Content">
                        <span className="material-symbols-outlined text-[16px] font-light">content_copy</span>
                      </button>
                    )}
                    {msg.isError && retryCount < 3 && (
                      <button onClick={handleRetry} className="text-error hover:text-error/80 transition-colors" title="Re-attempt">
                        <span className="material-symbols-outlined text-[16px] font-light">replay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex flex-col items-start animate-reveal-up">
                <span className="font-eyebrow text-[9px] tracking-[0.4em] uppercase text-primary mb-3">Kairos</span>
                <div className="bg-white/[0.03] border border-white/5 p-6 flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-1 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-10 py-6 bg-black/40 border-t border-white/5 animate-reveal-up">
              <p className="font-eyebrow text-[8px] tracking-[0.4em] uppercase text-white/20 mb-4">Directives</p>
              <div className="flex flex-wrap gap-3">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleSend(e, q)}
                    className="px-4 py-2 text-[10px] border border-white/5 bg-white/[0.02] text-white/40 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-500 font-eyebrow uppercase tracking-widest"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-10 bg-black/40 border-t border-white/5 shrink-0">
            <form onSubmit={handleSend} className="relative group">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Submit your directive..."
                className="w-full bg-transparent border-b border-white/10 focus:border-primary text-sm font-body text-white/80 py-4 pr-12 transition-all duration-700 focus:outline-none placeholder:text-white/10"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-primary opacity-30 group-focus-within:opacity-100 hover:scale-110 disabled:opacity-0 transition-all duration-500 p-2"
              >
                <span className="material-symbols-outlined font-light" style={{ fontVariationSettings: "'wght' 200" }}>arrow_forward</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
