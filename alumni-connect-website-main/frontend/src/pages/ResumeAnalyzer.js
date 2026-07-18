import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, UploadCloud, CheckCircle, AlertCircle, TrendingUp, 
  Target, Zap, FileSearch, ShieldCheck, ChevronRight
} from 'lucide-react';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResults(null);
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setResults(null);
    } else {
      alert('Please drop a PDF file.');
    }
  };

  const analyzeResume = () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults({
        atsScore: 78,
        grammarScore: 92,
        impactScore: 65,
        rating: "Good, but needs action verbs",
        missingSkills: ["Cloud Architecture (AWS/Azure)", "Docker/Kubernetes", "GraphQL"],
        suggestions: [
          "Use more quantifiable metrics (e.g., 'Increased efficiency by 20%')",
          "Add a dedicated 'Projects' section highlighting full-stack apps",
          "Remove high school details since you are in college/alumni stage",
          "Include links to live project deployments, not just GitHub repos"
        ]
      });
    }, 3500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase">AI-Powered</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Resume Analyzer</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            Upload your resume to get instant feedback on ATS compatibility, missing skills, grammar, and overall impact based on industry standards.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div 
            className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all bg-white dark:bg-slate-900 ${file ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            
            {file ? (
              <>
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{file.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setFile(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Change File
                  </button>
                  <button 
                    onClick={analyzeResume}
                    disabled={isAnalyzing}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center disabled:opacity-70"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mb-6">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Drag & Drop your Resume</h3>
                <p className="text-sm text-slate-500 mb-6">Supports PDF formats up to 5MB</p>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:shadow-lg transition-all"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Privacy Guaranteed
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your resume is processed securely for analysis and is never stored on our servers permanently or shared with third parties without your explicit consent.
            </p>
          </div>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-7"
        >
          {isAnalyzing ? (
            <div className="h-full min-h-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center p-8">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                <FileSearch className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Scanning Document...</h3>
              <p className="text-slate-500 text-center max-w-sm">
                Our AI is currently analyzing layout, extracting keywords, and evaluating impact metrics.
              </p>
            </div>
          ) : results ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8">
              <div className="flex items-start justify-between mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Analysis Complete</h3>
                  <p className="text-slate-500 font-medium">Verdict: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{results.rating}</span></p>
                </div>
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border-4 border-indigo-500 flex items-center justify-center">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{results.atsScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Grammar & Spelling</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-1">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${results.grammarScore}%` }}></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{results.grammarScore}/100</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Action & Impact</span>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-1">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${results.impactScore}%` }}></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{results.impactScore}/100</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" /> Missing Industry Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.missingSkills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/30">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Actionable Suggestions
                  </h4>
                  <ul className="space-y-3">
                    {results.suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <ChevronRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-200 border-dashed dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center">
              <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500">Results will appear here</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">Upload your resume and click analyze to generate your comprehensive ATS report.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
