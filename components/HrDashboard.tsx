
import React, { useState, useEffect, useRef } from 'react';
import { UserRecord, TeamAnalysisResult } from '../types';
import { analyzeTeamWellbeing } from '../geminiService';
import { DEPARTMENTS } from '../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface HrDashboardProps {
  onBack: () => void;
}

const HrDashboard: React.FC<HrDashboardProps> = ({ onBack }) => {
  const [teamRecords, setTeamRecords] = useState<UserRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<UserRecord[]>([]);
  const [analysis, setAnalysis] = useState<TeamAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const loadLocalRecords = () => {
    const allRecords: UserRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('wellmind_user_')) {
        const history: UserRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (history.length > 0) {
          const latest = history[history.length - 1];
          allRecords.push({ ...latest, user_key: key.replace('wellmind_user_', '') });
        }
      }
    }
    setTeamRecords(allRecords);
    setFilteredRecords(allRecords);
  };

  useEffect(() => {
    loadLocalRecords();
  }, []);

  const handleRunAnalysis = async () => {
    if (filteredRecords.length === 0) {
      setError("No team members found to analyze.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeTeamWellbeing(filteredRecords);
      if (result) {
        setAnalysis(result);
      } else {
        throw new Error("Received empty result from analysis service.");
      }
    } catch (err: any) {
      console.error("Analysis execution failed:", err);
      setError("AI analysis engine error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const validRecords = json.filter(r => r.user_key && r.summary);
          if (validRecords.length > 0) {
            setTeamRecords(prev => [...prev, ...validRecords]);
            alert(`Successfully imported ${validRecords.length} records.`);
          } else {
            setError("The uploaded JSON doesn't contain valid WellMind records.");
          }
        } else {
          setError("Invalid file format. Please upload a JSON array of records.");
        }
      } catch (err) {
        setError("Error parsing JSON file. Please ensure it's valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    let filtered = [...teamRecords];
    if (deptFilter !== 'All') {
      filtered = filtered.filter(r => r.department === deptFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'stress') return (b.summary.stress_level === 'High' ? 2 : b.summary.stress_level === 'Moderate' ? 1 : 0) - (a.summary.stress_level === 'High' ? 2 : a.summary.stress_level === 'Moderate' ? 1 : 0);
      if (sortBy === 'attrition') return (b.summary.attrition_risk === 'High' ? 2 : b.summary.attrition_risk === 'Medium' ? 1 : 0) - (a.summary.attrition_risk === 'High' ? 2 : a.summary.attrition_risk === 'Medium' ? 1 : 0);
      if (sortBy === 'burnout') return (b.summary.burnout_risk === 'High' ? 2 : b.summary.burnout_risk === 'Medium' ? 1 : 0) - (a.summary.burnout_risk === 'High' ? 2 : a.summary.burnout_risk === 'Medium' ? 1 : 0);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setFilteredRecords(filtered);
    setAnalysis(null);
  }, [deptFilter, sortBy, teamRecords]);

  // Basic math for initial suggestions before AI run
  const avgEfficiency = filteredRecords.length > 0 
    ? Math.round(filteredRecords.reduce((acc, r) => acc + r.summary.mental_health_efficiency, 0) / filteredRecords.length)
    : 0;
  
  const highStressCount = filteredRecords.filter(r => r.summary.stress_level === 'High').length;
  const highAttritionCount = filteredRecords.filter(r => r.summary.attrition_risk === 'High').length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-grow">
          <button 
            onClick={onBack} 
            className="text-indigo-600 font-black flex items-center gap-3 mb-4 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Exit to Portal
          </button>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Enterprise Health Command</h2>
          <p className="text-slate-500 font-medium">Monitoring {teamRecords.length} identity nodes</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            Import JSON
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".json"
          />

          <select 
            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer shadow-sm"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="All">All Units</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer shadow-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest</option>
            <option value="stress">Sort: Max Stress</option>
            <option value="burnout">Sort: Max Burnout</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-4">
          <i className="fa-solid fa-circle-exclamation text-lg"></i>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Team List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl overflow-hidden h-full flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center justify-between">
              Live Personnel
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{filteredRecords.length}</span>
            </h3>
            <div className="space-y-3 overflow-y-auto pr-2 flex-grow scrollbar-hide">
              {filteredRecords.map((r, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group cursor-default shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-50">{r.user_key}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                      r.summary.stress_level === 'High' ? 'bg-rose-100 text-rose-600' : 
                      r.summary.stress_level === 'Moderate' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {r.summary.stress_level}
                    </span>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.department}</div>
                  <div className="flex items-center gap-2 mt-3">
                     <div className="h-1 flex-grow bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.summary.mental_health_efficiency}%` }}></div>
                     </div>
                     <span className="text-[9px] font-black text-slate-600">{r.summary.mental_health_efficiency}%</span>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <i className="fa-solid fa-database text-slate-400 text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Null Identity Set</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="lg:col-span-3 space-y-8">
           {/* Direct Data-Driven Suggestions (Replaced Neural Audit Placeholder) */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Pulse Index</h3>
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                           <i className="fa-solid fa-chart-line"></i>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                          <p className="text-5xl font-black text-slate-900 tracking-tighter">{avgEfficiency}%</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase mt-2 tracking-widest">Efficiency</p>
                       </div>
                       <div>
                          <p className={`text-5xl font-black tracking-tighter ${highStressCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{highStressCount}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">High Stress</p>
                       </div>
                    </div>
                 </div>
                 <div className="mt-10 pt-8 border-t border-slate-50">
                
                    <p className="text-[9px] font-bold text-slate-300 uppercase text-center mt-4 tracking-widest">Updates based on {filteredRecords.length} active node entries</p>
                 </div>
              </div>

              <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between border border-white/5">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full translate-x-16 -translate-y-16"></div>
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-8 relative z-10">Proactive Interventions</h3>
                 <div className="space-y-5 relative z-10">
                    <SuggestionItem icon="fa-person-running" text={highStressCount > 0 ? `Critical: ${highStressCount} individuals are showing burnout patterns. Review resource allocation.` : "Stability: No immediate burnout risks detected in current view."} />
                    <SuggestionItem icon="fa-user-minus" text={highAttritionCount > 0 ? `Attrition Alert: ${highAttritionCount} users are in high-attrition risk categories. Conduct retention audits.` : "Retention: Overall attrition indices remain within safety thresholds."} />
                    <SuggestionItem icon="fa-shuffle" text="Tip: Scheduled role-rotations in high-pressure units can reduce systemic fatigue by 22%." />
                 </div>
                 <div className="mt-8 pt-8 border-t border-white/5 opacity-50 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center"></p>
                 </div>
              </div>
           </div>

           {analysis ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
               {/* Full AI Analysis Results */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl">
                     <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4 uppercase tracking-widest text-[14px]">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-xs shadow-inner">
                          <i className="fa-solid fa-brain"></i>
                        </div>
                        Strategic Advisory
                     </h3>
                     <ul className="space-y-5">
                        {analysis.team_recommendations.map((rec, idx) => (
                           <li key={idx} className="flex gap-5 p-5 rounded-[28px] bg-slate-50 border border-slate-100 items-start hover:shadow-md transition-all">
                              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">{idx+1}</span>
                              <p className="text-sm font-medium leading-relaxed text-slate-700">{rec}</p>
                           </li>
                        ))}
                     </ul>
                  </div>

                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl">
                     <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4 uppercase tracking-widest text-[14px]">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-xs shadow-inner">
                          <i className="fa-solid fa-route"></i>
                        </div>
                        Action Plan
                     </h3>
                     <div className="space-y-8">
                        <div>
                           <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1 rounded-full mb-4 inline-block tracking-widest">30 Day Priority</span>
                           <ul className="space-y-4">
                              {analysis.action_plan.immediate.map((item, idx) => (
                                 <li key={idx} className="flex gap-4 text-sm font-bold text-slate-700 items-start">
                                    <i className="fa-solid fa-bolt text-rose-400 mt-1"></i>
                                    {item}
                                 </li>
                              ))}
                           </ul>
                        </div>
                        <div className="pt-8 border-t border-slate-50">
                           <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full mb-4 inline-block tracking-widest">Quarterly Strategy</span>
                           <ul className="space-y-4">
                              {analysis.action_plan.long_term.map((item, idx) => (
                                 <li key={idx} className="flex gap-4 text-sm font-bold text-slate-700 items-start">
                                    <i className="fa-solid fa-arrow-up-right-dots text-indigo-400 mt-1"></i>
                                    {item}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Stress Heatmap Chart */}
               <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Regional Stress Vectors</h3>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Concentration</div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(analysis.department_breakdown).map(([name, value]) => ({ name, value }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          fontWeight="black" 
                          tick={{ dy: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip 
                           cursor={{fill: '#f8fafc'}}
                           contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0(0 / 0.15)', padding: '16px' }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[12, 12, 12, 12]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
           ) : (
            <div className="">
               
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

const SuggestionItem = ({ icon, text }: { icon: string, text: string }) => (
  <div className="flex gap-5 p-5 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
        <i className={`fa-solid ${icon}`}></i>
     </div>
     <p className="text-[12px] font-bold text-slate-300 leading-relaxed">{text}</p>
  </div>
);

export default HrDashboard;
