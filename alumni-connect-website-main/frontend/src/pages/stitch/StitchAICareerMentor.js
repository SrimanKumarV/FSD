import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StitchAICareerMentor = () => {
  const { user } = useAuth();

  return (
    <>

{/*  Header  */}
<header className="glass-panel shrink-0 px-lg py-md flex items-center justify-between border-b-0 shadow-sm z-10">
<div>
<h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
<span className="material-symbols-outlined text-stitch-primary" data-icon="smart_toy">smart_toy</span>
                    AI Career Mentor
                </h1>
<p className="font-body-sm text-body-sm text-stitch-secondary">Powered by Llama 3 / Groq • Real-time Guidance</p>
</div>
<div className="flex gap-2">
<button aria-label="Clear Chat" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-variant flex items-center justify-center transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="delete_sweep">delete_sweep</span>
</button>
<button aria-label="Session History" className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-variant flex items-center justify-center transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="history">history</span>
</button>
</div>
</header>
{/*  Chat History  */}
<div className="flex-1 overflow-y-auto chat-scroll p-lg flex flex-col gap-lg pb-32">
{/*  AI Welcome Message  */}
<div className="flex gap-md max-w-3xl">
<div className="w-10 h-10 rounded-full bg-stitch-primary/10 flex items-center justify-center shrink-0 border border-stitch-primary/20">
<span className="material-symbols-outlined text-stitch-primary" data-icon="psychology">psychology</span>
</div>
<div className="glass-panel rounded-2xl rounded-tl-sm p-md text-on-surface">
<p className="mb-2">Hello! I'm your Alumnex AI Career Mentor. I'm here to help you accelerate your tech career. I can assist with:</p>
<ul className="list-disc list-inside font-body-sm text-stitch-secondary flex flex-col gap-1 mb-4 pl-2">
<li>Automated, line-by-line Resume Reviews</li>
<li>Technical &amp; Behavioral Mock Interviews</li>
<li>Personalized Tech Stack &amp; Upskilling Advice</li>
</ul>
<p className="font-body-sm">How can we level up your career today?</p>
</div>
</div>
{/*  Quick Prompts (Bento style grid)  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-3xl ml-[56px]">
<button className="glass-panel p-md rounded-xl text-left hover:-translate-y-0.5 hover:shadow-md transition-all group">
<div className="w-8 h-8 rounded-full bg-student-cyan/10 flex items-center justify-center mb-sm group-hover:bg-student-cyan/20 transition-colors">
<span className="material-symbols-outlined text-student-cyan text-sm" data-icon="description">description</span>
</div>
<span className="font-body-bold block mb-1">Review my Resume</span>
<span className="font-caption-xs text-stitch-secondary">Upload or paste text for instant ATS optimization.</span>
</button>
<button className="glass-panel p-md rounded-xl text-left hover:-translate-y-0.5 hover:shadow-md transition-all group">
<div className="w-8 h-8 rounded-full bg-alumni-magenta/10 flex items-center justify-center mb-sm group-hover:bg-alumni-magenta/20 transition-colors">
<span className="material-symbols-outlined text-alumni-magenta text-sm" data-icon="mic">mic</span>
</div>
<span className="font-body-bold block mb-1">Mock Interview</span>
<span className="font-caption-xs text-stitch-secondary">Practice frontend system design or algorithms.</span>
</button>
<button className="glass-panel p-md rounded-xl text-left hover:-translate-y-0.5 hover:shadow-md transition-all group">
<div className="w-8 h-8 rounded-full bg-stitch-primary/10 flex items-center justify-center mb-sm group-hover:bg-stitch-primary/20 transition-colors">
<span className="material-symbols-outlined text-stitch-primary text-sm" data-icon="terminal">terminal</span>
</div>
<span className="font-body-bold block mb-1">Tech Stack Advice</span>
<span className="font-caption-xs text-stitch-secondary">What should I learn next for full-stack roles?</span>
</button>
</div>
{/*  User Message  */}
<div className="flex gap-md max-w-3xl self-end flex-row-reverse">
<div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="person">person</span>
</div>
<div className="bg-primary-container text-on-primary-container rounded-2xl rounded-tr-sm p-md shadow-sm">
<p>I'd like to do a mock interview for a Senior React Developer position. Can we start with some React architecture questions?</p>
</div>
</div>
{/*  AI Streaming Response  */}
<div className="flex gap-md max-w-3xl">
<div className="w-10 h-10 rounded-full bg-stitch-primary/10 flex items-center justify-center shrink-0 border border-stitch-primary/20 relative">
{/*  Subtle pulsing glow behind AI avatar while streaming  */}
<div className="absolute inset-0 rounded-full bg-stitch-primary/20 animate-ping opacity-75"></div>
<span className="material-symbols-outlined text-stitch-primary relative z-10" data-icon="psychology">psychology</span>
</div>
<div className="glass-panel rounded-2xl rounded-tl-sm p-md text-on-surface min-w-[200px]">
<p className="mb-3">Excellent choice. A Senior React role requires a deep understanding of state management, performance optimization, and scalable architecture.</p>
<p className="mb-3">Let's start with a scenario: <strong className="font-body-bold text-stitch-primary">You are tasked with migrating a large legacy React application to a more modern architecture. The app currently suffers from massive prop drilling and frequent unnecessary re-renders.</strong></p>
<div className="flex items-center gap-1 text-stitch-primary mt-2">
<span className="w-2 h-2 rounded-full bg-stitch-primary typing-dot"></span>
<span className="w-2 h-2 rounded-full bg-stitch-primary typing-dot"></span>
<span className="w-2 h-2 rounded-full bg-stitch-primary typing-dot"></span>
</div>
</div>
</div>
</div>
{/*  Input Area (Fixed at bottom of main content)  */}
<div className="absolute bottom-0 left-0 w-full p-md lg:p-lg bg-gradient-to-t from-background via-background/90 to-transparent">
<div className="max-w-4xl mx-auto glass-panel rounded-2xl p-2 flex items-end gap-2 shadow-lg border-white/80">
<button aria-label="Attach Document" className="w-10 h-10 shrink-0 rounded-xl hover:bg-surface-container text-stitch-secondary flex items-center justify-center transition-colors mb-1">
<span className="material-symbols-outlined" data-icon="attach_file">attach_file</span>
</button>
<div className="flex-1 relative">
<textarea className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 font-body-base text-on-surface placeholder:text-outline" placeholder="Type your answer, paste your resume, or ask a question..." rows="1"></textarea>
</div>
<button aria-label="Send Message" className="w-12 h-12 shrink-0 rounded-xl bg-stitch-primary text-on-primary flex items-center justify-center shadow-stitch-primary/30 hover:shadow-stitch-primary/50 hover:-translate-y-0.5 transition-all mb-0.5 group">
<span className="material-symbols-outlined group-hover:translate-x-0.5 group-active:scale-90 transition-transform" data-icon="send">send</span>
</button>
</div>
<div className="text-center mt-2">
<span className="font-caption-xs text-outline text-[10px]">AI can make mistakes. Verify important career advice.</span>
</div>
</div>

    </>
  );
};

export default StitchAICareerMentor;
