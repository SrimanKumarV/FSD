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
      text: "👋 Hi! I'm your **Alumnex AI Career Mentor & Navigator**.\n\nAsk about [Resume Reviews](/resume), [Alumni Mentors](/mentorship), [DevPulse Stats](/devpulse), [Job Openings](/jobs), or finding resources across the platform!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
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
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Alumnex AI Assistant"
            className="fixed z-40 touch-target w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 shadow-xl flex items-center justify-center text-white cursor-pointer group hover:shadow-primary-500/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 right-4 sm:right-6 bottom-[calc(var(--alumnex-mobile-nav-height,4.5rem)+var(--alumnex-safe-bottom,0px)+0.85rem)] lg:bottom-6"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Interface (Mobile Bottom Sheet / Desktop Floating Window) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-end sm:block sm:inset-auto sm:right-6 sm:bottom-6">
            {/* Backdrop overlay on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden"
              aria-hidden="true"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              role="dialog"
              aria-label="Alumnex AI Career Mentor Chat"
              className="relative z-10 w-full sm:w-[390px] h-[85dvh] sm:h-[540px] max-h-[90dvh] flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-200/80 dark:border-gray-800"
            >
              {/* Mobile grab handle */}
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white shrink-0 mt-1 sm:mt-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">Alumnex AI Mentor</h3>
                    <p className="text-xs text-primary-100 flex items-center gap-1.5 opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online • Ready to assist
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close AI Assistant"
                  className="touch-target p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar bg-gray-50/60 dark:bg-gray-950/60 min-h-0">
                {history.map((msg, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-xs shadow-xs'
                          : msg.isError
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-bl-xs border border-rose-200/50'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-xs border border-gray-200/60 dark:border-gray-700/60 rounded-bl-xs'
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
                                    onClick={() => setIsOpen(false)}
                                    className="font-semibold text-primary-600 dark:text-primary-400 underline hover:text-primary-800 dark:hover:text-primary-300"
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
                                  className="font-semibold text-primary-600 dark:text-primary-400 underline hover:text-primary-800"
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            },
                            ul: ({node, children, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>{children}</ul>,
                            ol: ({node, children, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>{children}</ol>,
                            li: ({node, children, ...props}) => <li className="mb-0.5" {...props}>{children}</li>,
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

                {/* Quick Prompts */}
                {history.length === 1 && !isLoading && (
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Suggested topics</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuery(prompt.query)}
                          className="text-left text-xs bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border border-gray-200/80 dark:border-gray-700/80 rounded-xl px-2.5 py-1.5 transition-colors shadow-xs"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2 shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Generating advice...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form 
                onSubmit={handleSubmit}
                className="p-3 sm:p-3.5 border-t border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2 shrink-0 pb-[max(0.75rem,var(--alumnex-safe-bottom,0px))]"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 glass-input rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none min-h-[40px]"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  aria-label="Send message"
                  className="touch-target w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-xs shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIAssistant;
