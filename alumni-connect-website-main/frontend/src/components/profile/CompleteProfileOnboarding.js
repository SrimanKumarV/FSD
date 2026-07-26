import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building2, Save, Search, CheckCircle2, ChevronDown, Globe, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// All countries with emoji flags
const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
];

// Steps
const STEPS = ['country', 'college'];

const STEP_CONFIG = {
  country: { title: 'Where are you from?', subtitle: 'Select your country', icon: Globe },
  college: { title: 'Your Institution', subtitle: 'Search and select your college or university', icon: Building2 },
};

export default function CompleteProfileOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(user?.country || '');
  const [college, setCollege] = useState(user?.college || '');
  const [countrySearch, setCountrySearch] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [universities, setUniversities] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const [saving, setSaving] = useState(false);
  const collegeRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch universities when country is selected or college search changes
  const fetchUniversities = useCallback(async (countryName, query) => {
    if (!countryName) return;
    setLoadingUnis(true);
    try {
      const countryObj = COUNTRIES.find(c => c.name === countryName);
      const searchName = countryObj ? countryObj.name : countryName;
      const { data } = await api.get('/institutions/search', {
        params: { country: searchName, name: query || '' }
      });
      setUniversities(data);
    } catch (error) {
      console.error("Failed to fetch universities:", error);
      setUniversities([]);
    } finally {
      setLoadingUnis(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (step === 1 && country) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchUniversities(country, collegeSearch);
      }, 300);
    }
    return () => clearTimeout(debounceRef.current);
  }, [collegeSearch, country, step, fetchUniversities]);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountryObj = COUNTRIES.find(c => c.name === country);

  const handleCountrySelect = (c) => {
    setCountry(c.name);
    setCollege('');
    setCollegeSearch('');
    setUniversities([]);
  };

  const handleCollegeSelect = (name) => {
    setCollege(name);
    setCollegeSearch(name);
  };

  const handleNext = () => {
    if (step === 0 && !country) { toast.error('Please select your country'); return; }
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!college) { toast.error('Please select your college'); return; }
    setSaving(true);
    try {
      await onComplete({ country, college });
    } catch (e) {
      // handled by AuthContext
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEP_CONFIG[STEPS[step]].icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #1e1b4b 0%, #0f0f23 60%, #000 100%)' }}>

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-lg relative"
      >
        {/* Card */}
        <div className="bg-[#111827]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <StepIcon className="w-8 h-8 text-indigo-400" />
              </motion.div>

              <h2 className="text-2xl font-black text-white tracking-tight">
                {STEP_CONFIG[STEPS[step]].title}
              </h2>
              <p className="text-slate-400 mt-1 text-sm font-medium">
                {STEP_CONFIG[STEPS[step]].subtitle}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-400' : i < step ? 'w-4 bg-indigo-600' : 'w-4 bg-white/15'}`} />
                ))}
              </div>
            </div>

            {/* Step 0: Country Selection */}
            {step === 0 && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
                    autoFocus
                  />
                </div>

                {/* Country grid */}
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {filteredCountries.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium ${
                        country === c.name
                          ? 'bg-indigo-500/20 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      {country === c.name && <CheckCircle2 className="w-4 h-4 text-indigo-400 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!country}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mt-2"
                >
                  {country ? (
                    <><span>{selectedCountryObj?.flag}</span> Continue with {country}</>
                  ) : 'Select a country to continue'}
                </button>
              </div>
            )}

            {/* Step 1: College Selection */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Selected country badge */}
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium mb-2"
                >
                  <span className="text-lg">{selectedCountryObj?.flag}</span>
                  {country}
                  <span className="text-slate-500">— change</span>
                </button>

                {/* College search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={collegeRef}
                    type="text"
                    placeholder={`Search universities in ${country}...`}
                    value={collegeSearch}
                    onChange={e => { setCollegeSearch(e.target.value); setCollege(''); }}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
                    autoFocus
                  />
                  {collegeSearch && (
                    <button onClick={() => { setCollegeSearch(''); setCollege(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-slate-500 hover:text-white" />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 rounded-xl">
                  {loadingUnis ? (
                    <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      <span className="text-sm">Fetching universities...</span>
                    </div>
                  ) : universities.length > 0 ? universities.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCollegeSelect(name)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium ${
                        college === name
                          ? 'bg-indigo-500/20 border-indigo-500/60 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 shrink-0 ${college === name ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="truncate">{name}</span>
                      {college === name && <CheckCircle2 className="w-4 h-4 text-indigo-400 ml-auto shrink-0" />}
                    </button>
                  )) : (
                    <div className="text-center py-6 text-slate-500 text-sm bg-white/3 rounded-xl border border-white/5">
                      {collegeSearch ? 'No matching universities found.' : 'Loading universities...'}
                    </div>
                  )}
                </div>

                {/* Manual entry fallback */}
                {collegeSearch && !college && universities.length === 0 && !loadingUnis && (
                  <button
                    type="button"
                    onClick={() => handleCollegeSelect(collegeSearch)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 text-indigo-400 text-sm font-medium hover:bg-indigo-500/10 transition-colors"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    Add "{collegeSearch}" manually
                  </button>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={saving || !college}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Complete Profile & Enter</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step label */}
        <p className="text-center text-slate-500 text-xs mt-4 font-medium">
          Step {step + 1} of {STEPS.length} — Required to access all features
        </p>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 10px; }
      `}</style>
    </div>
  );
}
