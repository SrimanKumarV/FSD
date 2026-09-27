import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Loader2, Compass } from 'lucide-react';
import { api } from '../../utils/api';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../contexts/AuthContext';

const QUICK_PROMPTS = [
  { label: '📄 Resume ATS Check', query: 'How can I optimize my resume for ATS on Alumnex Connect?' },
  { label: '🤝 Find a Mentor', query: 'How do I connect with an alumni mentor on Alumnex Connect?' },
  { label: '💼 Browse Jobs', query: 'Where can I find verified job and internship openings?' },
  { label: '⚡ DevPulse Stats', query: 'What is DevPulse and how does it track my coding stats?' },
  { label: '🗺️ Explore Site Map', query: 'Show me all available pages and services on Alumnex Connect' },
];

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    {
      role: 'model',
      text: "👋 Hi! I'm your **Alumnex Connect AI Career Mentor & Platform Navigator**.\n\nAsk me about [Resume ATS Reviews](/resume), [Alumni Mentors](/mentorship), [DevPulse Analytics](/devpulse), [Job Openings](/jobs), or exploring any service on Alumnex Connect!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [history, isOpen]);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;

    const userMessage = queryText.trim();
    setMessage('');
    
    const updatedHistory = [...history, { role: 'user', text: userMessage }];
    setHistory(updatedHistory);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage,
        history: history.slice(1) // send previous history excluding intro
      });
      
      setHistory([...updatedHistory, { role: 'model', text: response.data.reply }]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = error.response?.data?.message || "Sorry, I'm having trouble connecting right now. Please try again later.";
      setHistory([...updatedHistory, { 
        role: 'model', 
        text: errorMessage,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuery(message);
  };

  if (!user) return null; // Don't show if not logged in
  if (location.pathname.startsWith('/chat')) return null; // Hide on chat page

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-2xl flex items-center justify-center text-white cursor-pointer group hover:shadow-indigo-500/50 transition-shadow"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[32rem] max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Alumnex AI Mentor</h3>
                  <p className="text-xs text-indigo-100 opacity-90 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online • AI Career Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
              {history.map((msg, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-md'
                        : msg.isError
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-bl-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700/50 rounded-bl-sm prose prose-sm dark:prose-invert max-w-full'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <ReactMarkdown
                        components={{
                          p: ({node, children, ...props}) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
                          a: ({node, href, children, ...props}) => {
                            const isInternal = href && (href.startsWith('/') || href.startsWith('#'));
                            if (isInternal) {
                              return (
                                <Link 
                                  to={href}
                                  className="font-semibold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                  {...props}
                                >
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 transition-colors"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          },
                          ul: ({node, children, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>{children}</ul>,
                          ol: ({node, children, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>{children}</ol>,
                          li: ({node, children, ...props}) => <li className="mb-0.5" {...props}>{children}</li>,
                          h3: ({node, children, ...props}) => <h3 className="font-bold text-base mt-2 mb-1 text-slate-900 dark:text-white" {...props}>{children}</h3>,
                          h4: ({node, children, ...props}) => <h4 className="font-semibold text-sm mt-1.5 mb-1 text-slate-800 dark:text-slate-200" {...props}>{children}</h4>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Quick Prompt Suggestion Chips (Shown initially) */}
              {history.length === 1 && !isLoading && (
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Quick Navigation & Advice</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendQuery(prompt.query)}
                        className="text-xs bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 transition-all text-left shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span>Consulting Alumnex AI...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask for advice or any website page..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="w-10 h-10 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIAssistant;
