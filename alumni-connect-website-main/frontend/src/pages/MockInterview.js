import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Briefcase, PlayCircle, StopCircle, Award, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const MockInterview = () => {
  const { user } = useAuth();
  const [sessionActive, setSessionActive] = useState(false);
  const [role, setRole] = useState('Software Engineer');
  const [experience, setExperience] = useState('Entry-Level');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start speech recognition:", e);
      }
    }
  };

  const speakText = (text) => {
    if (isVoiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startInterview = async () => {
    setSessionActive(true);
    setLoading(true);
    try {
      const userMessage = 'Hello, I am ready to begin the interview.';
      const payload = {
        message: userMessage,
        history: [],
        role,
        experience
      };
      const response = await api.post('/ai/mock-interview', payload);
      const aiReply = response.data.reply;
      setMessages([
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiReply }
      ]);
      speakText(aiReply);
    } catch (error) {
      console.error("Mock Interview Error:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed: ${errorMsg}`);
      setSessionActive(false);
    } finally {
      setLoading(false);
    }
  };

  const endInterview = () => {
    setSessionActive(false);
    setMessages([]);
    setInput('');
    window.speechSynthesis?.cancel();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        message: userMessage.content,
        history: messages,
        role,
        experience
      };
      const response = await api.post('/ai/mock-interview', payload);
      const aiReply = response.data.reply;
      setMessages([...updatedHistory, { role: 'assistant', content: aiReply }]);
      speakText(aiReply);
    } catch (error) {
      console.error("Mock Interview Send Error:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed: ${errorMsg}`);
      setMessages(messages); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-white/50 dark:bg-gray-900/50">
      <div className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 flex flex-col py-2 sm:py-6 overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center">
              <Award className="w-8 h-8 mr-3 text-primary-500" />
              AI Mock Interviews
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Practice behavioral and technical questions with an AI recruiter.
            </p>
          </div>
          {sessionActive && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setIsVoiceEnabled(!isVoiceEnabled);
                  if (isVoiceEnabled) window.speechSynthesis?.cancel();
                }}
                className={`flex items-center px-4 py-2 rounded-xl font-bold transition-colors ${
                  isVoiceEnabled 
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
                title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
              >
                {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={endInterview}
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-xl transition-colors"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                End Session
              </button>
            </div>
          )}
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl flex-1 flex flex-col border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden"
        >
          {!sessionActive ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
                <Briefcase className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configure Your Interview</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                Select the target role and your experience level. The AI will tailor the questions and strictness accordingly.
              </p>
              
              <div className="w-full max-w-sm space-y-4 mb-8">
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    placeholder="e.g. Frontend Developer"
                  />
                </div>
                <div>
                  <label className="block text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Experience Level</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Entry-Level">Entry-Level</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <button
                onClick={startInterview}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/30 flex items-center text-lg"
              >
                <PlayCircle className="w-6 h-6 mr-2" />
                Start Interview
              </button>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start max-w-[85%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          msg.role === 'user'
                            ? 'bg-primary-100 border-primary-200 ml-4'
                            : 'bg-indigo-100 border-indigo-200 mr-4'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <User className="w-5 h-5 text-primary-700" />
                        ) : (
                          <Bot className="w-5 h-5 text-indigo-700" />
                        )}
                      </div>
                      <div
                        className={`p-3 sm:p-4 text-sm sm:text-base rounded-2xl shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700 whitespace-pre-wrap'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start max-w-[85%] mr-auto"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-200 mr-4 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-indigo-700" />
                      </div>
                      <div className="p-3 sm:p-4 rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex space-x-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer or use the microphone..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={loading || !recognitionRef.current}
                    className={`px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                    title={recognitionRef.current ? (isListening ? "Stop Listening" : "Start Listening") : "Speech Recognition not supported"}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MockInterview;
