import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const StitchTechHub = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your Alumnex AI Career Mentor. I'm here to help you accelerate your tech career. I can assist with:",
      isGreeting: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/ai/chat', {
        message: inputMessage,
        context: "You are an AI Career Mentor for university alumni."
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: response.data.reply
      }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: "Hello! I'm your Alumnex AI Career Mentor. I'm here to help you accelerate your tech career.",
        isGreeting: true
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col relative -mt-4 -mx-4 md:-mt-8 md:-mx-8">
      {/* Header */}
      <header className="glass-panel shrink-0 px-lg py-md flex items-center justify-between border-b-0 shadow-sm z-10 sticky top-0 rounded-none bg-glass-light/90 backdrop-blur-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            AI Career Mentor
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">Powered by Google Gemini • Real-time Guidance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={clearChat} aria-label="Clear Chat" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-variant flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">delete_sweep</span>
          </button>
          <button aria-label="Session History" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-variant flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">history</span>
          </button>
        </div>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-lg flex flex-col gap-lg pb-32" ref={chatScrollRef}>
        {messages.map((msg) => (
          msg.sender === 'ai' ? (
            <div key={msg.id} className="flex gap-md max-w-3xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="glass-panel rounded-2xl rounded-tl-sm p-4 md:p-md text-on-surface">
                {msg.isGreeting ? (
                  <>
                    <p className="mb-2">{msg.text}</p>
                    <ul className="list-disc list-inside font-body-sm text-secondary flex flex-col gap-1 mb-4 pl-2">
                      <li>Automated, line-by-line Resume Reviews</li>
                      <li>Technical & Behavioral Mock Interviews</li>
                      <li>Personalized Tech Stack & Upskilling Advice</li>
                    </ul>
                    <p className="font-body-sm">How can we level up your career today?</p>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex gap-md max-w-3xl self-end flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div className="bg-primary-container text-on-primary-container rounded-2xl rounded-tr-sm p-4 md:p-md shadow-sm">
                <p>{msg.text}</p>
              </div>
            </div>
          )
        ))}

        {messages.length === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-3xl md:ml-[56px]">
            <button onClick={() => setInputMessage("Can you review my resume?")} className="glass-panel p-md rounded-xl text-left hover:-translate-y-0.5 hover:shadow-md transition-all group">
              <div className="w-8 h-8 rounded-full bg-student-cyan/10 flex items-center justify-center mb-sm group-hover:bg-student-cyan/20 transition-colors">
                <span className="material-symbols-outlined text-student-cyan text-sm">description</span>
              </div>
              <span className="font-body-bold block mb-1">Review my Resume</span>
              <span className="font-caption-xs text-secondary">Upload or paste text for instant optimization.</span>
            </button>
            <button onClick={() => setInputMessage("I want to do a mock interview.")} className="glass-panel p-md rounded-xl text-left hover:-translate-y-0.5 hover:shadow-md transition-all group">
              <div className="w-8 h-8 rounded-full bg-alumni-magenta/10 flex items-center justify-center mb-sm group-hover:bg-alumni-magenta/20 transition-colors">
                <span className="material-symbols-outlined text-alumni-magenta text-sm">mic</span>
              </div>
              <span className="font-body-bold block mb-1">Mock Interview</span>
              <span className="font-caption-xs text-secondary">Practice technical or behavioral questions.</span>
            </button>
            <button onClick={() => setInputMessage("What tech stack should I learn next?")} className="glass-panel p-md rounded-xl text-left hover:-translate-y-0.5 hover:shadow-md transition-all group">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-sm group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-sm">terminal</span>
              </div>
              <span className="font-body-bold block mb-1">Tech Stack Advice</span>
              <span className="font-caption-xs text-secondary">Get personalized upskilling recommendations.</span>
            </button>
          </div>
        )}

        {/* AI Streaming/Typing Indicator */}
        {isTyping && (
          <div className="flex gap-md max-w-3xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
              <span className="material-symbols-outlined text-primary relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <div className="glass-panel rounded-2xl rounded-tl-sm p-md text-on-surface min-w-[100px] flex items-center">
              <div className="flex items-center gap-1 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-lg bg-gradient-to-t from-background via-background/90 to-transparent">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto glass-panel rounded-2xl p-2 flex items-end gap-2 shadow-lg border-white/80">
          <button type="button" aria-label="Attach Document" className="w-10 h-10 shrink-0 rounded-xl hover:bg-surface-container text-secondary flex items-center justify-center transition-colors mb-1">
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <div className="flex-1 relative">
            <textarea 
              className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 font-body-base text-on-surface placeholder:text-outline" 
              placeholder="Type your message, paste your resume, or ask a question..." 
              rows="1"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            ></textarea>
          </div>
          <button type="submit" aria-label="Send Message" className="w-12 h-12 shrink-0 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5 transition-all mb-0.5 group disabled:opacity-50" disabled={!inputMessage.trim() || isTyping}>
            <span className="material-symbols-outlined group-hover:translate-x-0.5 group-active:scale-90 transition-transform">send</span>
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="font-caption-xs text-outline text-[10px]">AI can make mistakes. Verify important career advice.</span>
        </div>
      </div>
    </div>
  );
};

export default StitchTechHub;
