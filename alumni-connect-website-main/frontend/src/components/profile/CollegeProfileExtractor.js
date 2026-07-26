import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Building, Target, Phone, Mail, MapPin, RefreshCw, Eye } from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const CollegeProfileExtractor = ({ initialData }) => {
  const { user } = useAuth();
  const [extractedData, setExtractedData] = useState(initialData || user?.collegeInfo?.extractedProfile || null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async () => {
    try {
      setIsExtracting(true);
      toast.loading('AI is analyzing the college website...', { id: 'extract-toast' });
      
      const response = await api.post('/institutions/extract-profile');
      
      if (response.data.success) {
        setExtractedData(response.data.data);
        toast.success('Profile extracted successfully!', { id: 'extract-toast' });
        
        // Dispatch an event so if needed other components can reload
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error(error.response?.data?.message || 'Failed to extract profile.', { id: 'extract-toast' });
    } finally {
      setIsExtracting(false);
    }
  };

  const DataItem = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-4 mb-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
        <div className="p-3 rounded-lg bg-primary/20 text-primary mt-1 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-400 mb-1">{label}</h4>
          <p className="text-gray-200 leading-relaxed">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Building className="w-48 h-48" />
      </div>
      
      <div className="p-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Profile Extractor
            </h2>
            <p className="text-gray-400 mt-2">
              Automatically extract and summarize information from your official college website using AI.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExtract}
            disabled={isExtracting}
            className={`mt-4 md:mt-0 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
              isExtracting 
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]'
            }`}
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Website...
              </>
            ) : (
              <>
                {extractedData ? <RefreshCw className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                {extractedData ? 'Re-Extract Profile' : 'Extract Profile Now'}
              </>
            )}
          </motion.button>
        </div>

        {isExtracting && (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-pulse">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <Sparkles className="w-16 h-16 text-primary relative z-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Groq AI is working its magic...</h3>
            <p className="text-gray-400 max-w-md">
              We are currently fetching your website ({user?.collegeInfo?.officialUrl || 'URL'}), parsing the HTML, and extracting structured information.
            </p>
          </div>
        )}

        {!isExtracting && extractedData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Extracted Details</h3>
              <DataItem icon={Building} label="About the College" value={extractedData.aboutUs} />
              <DataItem icon={Target} label="Mission" value={extractedData.mission} />
              <DataItem icon={Eye} label="Vision" value={extractedData.vision} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Contact Information</h3>
              <DataItem icon={Mail} label="Official Email" value={extractedData.contactEmail} />
              <DataItem icon={Phone} label="Contact Phone" value={extractedData.contactPhone} />
              <DataItem icon={MapPin} label="Physical Address" value={extractedData.address} />
            </div>

            <div className="col-span-1 lg:col-span-2 space-y-6 mt-4">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Comprehensive Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {extractedData.programs && (extractedData.programs.ug?.length > 0 || extractedData.programs.pg?.length > 0 || extractedData.programs.phd?.length > 0) && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 md:col-span-2">
                    <h4 className="text-sm font-semibold text-primary mb-3">Academic Programs</h4>
                    <div className="space-y-4">
                      {extractedData.programs.ug?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Undergraduate (UG)</p>
                          <div className="flex flex-wrap gap-2">
                            {extractedData.programs.ug.map((prog, i) => (
                              <span key={`ug-${i}`} className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded border border-blue-500/20">{prog}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {extractedData.programs.pg?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Postgraduate (PG)</p>
                          <div className="flex flex-wrap gap-2">
                            {extractedData.programs.pg.map((prog, i) => (
                              <span key={`pg-${i}`} className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded border border-purple-500/20">{prog}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {extractedData.programs.phd?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Doctoral (PhD)</p>
                          <div className="flex flex-wrap gap-2">
                            {extractedData.programs.phd.map((prog, i) => (
                              <span key={`phd-${i}`} className="px-2 py-1 bg-amber-500/10 text-amber-300 text-xs rounded border border-amber-500/20">{prog}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {extractedData.departments && extractedData.departments.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-sm font-semibold text-primary mb-3">Academic Departments</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.departments.map((dept, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded border border-white/10">{dept}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {extractedData.clubsAndCells && extractedData.clubsAndCells.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-sm font-semibold text-primary mb-3">Clubs & Cells</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.clubsAndCells.map((club, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded border border-white/10">{club}</span>
                      ))}
                    </div>
                  </div>
                )}

                {extractedData.facilities && extractedData.facilities.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 md:col-span-2">
                    <h4 className="text-sm font-semibold text-primary mb-3">Campus Facilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.facilities.map((fac, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded border border-white/10">{fac}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-2 mt-4 text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block mr-2 animate-pulse"></span>
                Last successfully extracted on {new Date(extractedData.lastExtractedAt).toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
        
        {!isExtracting && !extractedData && (
          <div className="py-12 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center bg-white/5">
            <Building className="w-12 h-12 text-gray-500 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-400">No profile data extracted yet</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              Click the button above to let AI automatically generate a profile summary from your official website URL.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeProfileExtractor;
