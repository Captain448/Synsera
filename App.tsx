
import React, { useState, useEffect } from 'react';
import { AssessmentInput, AssessmentResult, UserRecord } from './types';
import { ASSESSMENT_OPTIONS, DEPARTMENTS } from './constants';
import { analyzeWellbeing } from './geminiService';
import ResultCard from './components/ResultCard';
import HrDashboard from './components/HrDashboard';

const INITIAL_INPUT: AssessmentInput = {
  department: DEPARTMENTS[0],
  workload: "Moderate",
  workingHours: "8–9 hours",
  energyLevel: "Moderate",
  sleepQuality: "Average",
  jobSatisfaction: "Neutral",
  motivation: "Moderately Motivated",
  managerialSupport: "Moderately Supported",
  workLifeBalance: "Fair",
  pressure: "Sometimes",
  feedback: ""
};

// Simplified 3-character alphanumeric key (e.g., A7B)
const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'Login' | 'Assessment' | 'HR' | 'Result' | 'HrAuth'>('Login');
  const [userStatus, setUserStatus] = useState<'New User' | 'Existing User' | null>(null);
  const [userKey, setUserKey] = useState<string>('');
  
  // HR Auth State
  const [hrUser, setHrUser] = useState('');
  const [hrPass, setHrPass] = useState('');
  const [hrError, setHrError] = useState<string | null>(null);

  const [inputs, setInputs] = useState<AssessmentInput>(INITIAL_INPUT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getHistory = (key: string): UserRecord[] => {
    const data = localStorage.getItem(`wellmind_user_${key}`);
    return data ? JSON.parse(data) : [];
  };

  const saveToHistory = (key: string, record: UserRecord) => {
    const currentHistory = getHistory(key);
    localStorage.setItem(`wellmind_user_${key}`, JSON.stringify([...currentHistory, record]));
  };

  const handleStartNewUser = () => {
    const newKey = generateKey();
    setUserKey(newKey);
    setUserStatus('New User');
    setViewMode('Assessment');
  };

  const handleLogin = () => {
    if (!userKey.trim()) {
      setError("Please enter a valid User ID.");
      return;
    }
    const history = getHistory(userKey);
    if (history.length === 0 && !confirm("No history found for this ID. Start fresh?")) {
      return;
    }
    setError(null);
    setUserStatus('Existing User');
    setViewMode('Assessment');
  };

  const handleHrLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (hrUser === 'admin' && hrPass === 'admin 123') {
      setViewMode('HR');
      setHrError(null);
    } else {
      setHrError("Invalid HR Credentials.");
    }
  };

  const handleInputChange = (field: keyof AssessmentInput, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const history = getHistory(userKey);
      const analysis = await analyzeWellbeing(inputs, userKey, userStatus!, history);
      
      const record: UserRecord = {
        user_key: userKey,
        department: inputs.department,
        timestamp: new Date().toISOString(),
        input: inputs,
        summary: analysis.summary
      };
      
      saveToHistory(userKey, record);
      setResult(analysis);
      setViewMode('Result');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during neural processing.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setInputs(INITIAL_INPUT);
    setViewMode('Assessment');
  };

  const logout = () => {
    setViewMode('Login');
    setUserStatus(null);
    setUserKey('');
    setHrUser('');
    setHrPass('');
    resetForm();
  };

  // Login Screen
  if (viewMode === 'Login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-12 rounded-[52px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100 animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-indigo-600 rounded-[36px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 mb-8 relative">
               <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20"></div>
              <i className="fa-solid fa-brain-circuit text-4xl relative z-10"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">SYNSERA</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Neural Well-being Interface</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleStartNewUser}
              className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
            >
              <i className="fa-solid fa-plus-circle text-lg"></i>
              New Diagnostic
            </button>
            
            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">Credential Check</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                value={userKey}
                onChange={(e) => setUserKey(e.target.value.toUpperCase())}
                placeholder="USER KEY (E.G. A7B)"
                maxLength={3}
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-mono font-black text-center placeholder:font-sans placeholder:text-slate-300"
              />
              <button 
                onClick={handleLogin}
                className="w-full py-5 bg-white text-indigo-600 border-2 border-indigo-600 font-black rounded-3xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                <i className="fa-solid fa-id-badge text-lg"></i>
                Unlock Profile
              </button>
            </div>

            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-300 text-[9px] font-black uppercase tracking-[0.3em]">Administrative</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button 
              onClick={() => setViewMode('HrAuth')}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl"
            >
              <i className="fa-solid fa-server text-lg text-indigo-400"></i>
              HR Command Center
            </button>

            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center mt-6 bg-rose-50 p-3 rounded-2xl tracking-widest">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // HR Authentication Screen
  if (viewMode === 'HrAuth') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-12 rounded-[52px] shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Secure HR Portal</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Enter credentials to proceed</p>
          </div>
          <form onSubmit={handleHrLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Username</label>
              <input 
                type="text" 
                value={hrUser}
                onChange={(e) => setHrUser(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Password</label>
              <input 
                type="password" 
                value={hrPass}
                onChange={(e) => setHrPass(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="••••••••"
              />
            </div>
            {hrError && <p className="text-rose-600 text-[10px] font-black uppercase text-center">{hrError}</p>}
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setViewMode('Login')}
                className="flex-grow py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-grow py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'HR') {
    return (
      <div className="min-h-screen pb-20 bg-slate-50">
         <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 py-5">
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <i className="fa-solid fa-network-wired text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">SYNSERA</h1>
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] mt-1.5">Organizational Neural Overview</p>
                </div>
              </div>
              <button onClick={logout} className="px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all">
                Terminate Access
              </button>
            </div>
          </header>
          <main className="mt-12 px-6">
            <HrDashboard onBack={logout} />
          </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Dynamic Assessment Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 py-5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-100">
              <i className="fa-solid fa-person-circle-check text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">SYNSERA</h1>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] mt-1.5">
                {userStatus === 'New User' ? 'New Profile Generation' : 'Historical Analysis Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:block text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Identity</p>
              <p className="text-sm font-mono font-black text-slate-800">{userKey || 'ANONYMOUS'}</p>
            </div>
            <button onClick={logout} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
              <i className="fa-solid fa-power-off text-lg"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {userStatus === 'New User' && viewMode === 'Assessment' && (
          <div className="mb-10 p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] flex items-center gap-8 animate-in slide-in-from-top-6 duration-700 shadow-xl shadow-emerald-500/5">
            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-2xl shadow-emerald-200">
              <i className="fa-solid fa-key text-2xl"></i>
            </div>
            <div>
              <h3 className="font-black text-emerald-900 uppercase tracking-widest text-sm mb-1">Persistent Identity Key</h3>
              <p className="text-sm text-emerald-700 font-medium">Save this key for future longitudinal tracking: <span className="font-mono font-black bg-white px-3 py-1 rounded-xl border border-emerald-200 select-all ml-2 text-emerald-600">{userKey}</span></p>
            </div>
          </div>
        )}

        {viewMode === 'Assessment' ? (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase sm:text-6xl">SENTIMENT ANALYSIS</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(ASSESSMENT_OPTIONS).map(([key, config]) => (
                  <div key={key} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl transition-all hover:shadow-2xl hover:translate-y-[-4px] group">
                    <div className="mb-6">
                      <h3 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-2 group-hover:text-indigo-600 transition-colors">{config.label}</h3>
                      <p className="text-[11px] text-slate-300 font-bold leading-tight uppercase">{config.description}</p>
                    </div>
                    <select
                      value={inputs[key as keyof AssessmentInput]}
                      onChange={(e) => handleInputChange(key as keyof AssessmentInput, e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all cursor-pointer appearance-none uppercase tracking-widest"
                    >
                      {config.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full translate-x-32 -translate-y-32"></div>
                <div className="flex items-center gap-6 mb-10 relative z-10">
                  <div className="w-14 h-14 bg-indigo-50 rounded-[24px] flex items-center justify-center shadow-inner">
                    <i className="fa-solid fa-pen-nib text-indigo-500 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-sm">Qualitative Input Stream</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase mt-1.5">Unstructured data for emotional tone detection</p>
                  </div>
                </div>
                <textarea
                  className="w-full h-48 p-8 rounded-[40px] border border-slate-100 focus:ring-[16px] focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all text-lg text-slate-800 bg-slate-50 placeholder:text-slate-300 font-medium relative z-10"
                  placeholder="Describe recent friction points, environmental stressors, or motivators..."
                  value={inputs.feedback}
                  onChange={(e) => handleInputChange('feedback', e.target.value)}
                />
              </div>

              <div className="flex flex-col items-center gap-8 pb-20">
                {error && (
                  <div className="w-full max-w-xl p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-5 animate-bounce shadow-xl">
                    <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`group w-full max-w-2xl py-7 px-12 rounded-[36px] font-black uppercase tracking-[0.4em] text-white shadow-3xl transform transition-all active:scale-95 flex items-center justify-center gap-6 text-sm ${
                    loading ? 'bg-slate-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:translate-y-[-6px] shadow-indigo-500/30'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Executing Neural Vector Analysis...
                    </>
                  ) : (
                    <>
                      Submit Diagnostic Stream
                      <i className="fa-solid fa-arrow-right-long group-hover:translate-x-3 transition-transform"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <ResultCard result={result!} history={getHistory(userKey)} onReset={resetForm} />
        )}
      </main>

      <footer className="mt-40 py-16 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-10">
        
          <p className="text-[11px] text-slate-300 font-black uppercase tracking-[0.4em] text-center">
            © 2025 SYNSERA • 
          </p>
          <div className="flex gap-8 opacity-40">
             <i className="fa-brands fa-github text-2xl hover:text-indigo-600 transition-colors cursor-pointer"></i>
             <i className="fa-solid fa-fingerprint text-2xl hover:text-indigo-600 transition-colors cursor-pointer"></i>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
