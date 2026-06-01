
import React from 'react';
import { AssessmentResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ResultCardProps {
  result: AssessmentResult;
  history: any[]; // UserRecord[]
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, history, onReset }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Improving': return 'fa-arrow-trend-up text-emerald-500';
      case 'Declining': return 'fa-arrow-trend-down text-rose-500';
      default: return 'fa-arrows-left-right text-amber-500';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-rose-600';
      case 'Medium': case 'Moderate': return 'text-amber-500';
      case 'Low': return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  const barColorMap: Record<string, string> = {
    rose: 'bg-rose-500',
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-600'
  };

  // Prepare chart data from history
  const chartData = [...history.map(h => ({
    name: new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    efficiency: h.summary.mental_health_efficiency,
  })), {
    name: 'Current',
    efficiency: result.summary.mental_health_efficiency
  }].slice(-7); // Last 7 records

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Dashboard Top Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <SummaryTile label="Stress" value={result.summary.stress_level} colorClass={getRiskColor(result.summary.stress_level)} />
        <SummaryTile label="Efficiency" value={`${result.summary.mental_health_efficiency}%`} />
        <SummaryTile label="Burnout" value={result.summary.burnout_risk} colorClass={getRiskColor(result.summary.burnout_risk)} />
        <SummaryTile label="Satisfaction" value={result.summary.job_satisfaction_status} />
        <SummaryTile label="Attrition" value={result.summary.attrition_risk} colorClass={getRiskColor(result.summary.attrition_risk)} />
        <SummaryTile label="Sentiment" value={result.summary.overall_sentiment} />
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</span>
          <i className={`fa-solid ${getTrendIcon(result.summary.trend)} text-xl`}></i>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visualizations */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pulse Trend Chart */}
          {history.length > 0 && (
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Well-being Pulse</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Efficiency over time</p>
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">
                  Longitudinal View
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comparative Metrics Bars */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Personal Benchmarks</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-900"></div> <span className="text-[10px] font-black text-slate-400 uppercase">Current</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div> <span className="text-[10px] font-black text-slate-400 uppercase">Average</span></div>
                </div>
             </div>
             
             <div className="space-y-10">
               {result.bars.map((bar, idx) => (
                 <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-700">{bar.label}</span>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-slate-300 uppercase">Avg: {bar.previous_average}%</span>
                         <span className="text-xs font-black text-slate-900">{bar.current_value}%</span>
                      </div>
                    </div>
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                       {/* Ghost bar for average */}
                       <div 
                         className="absolute h-full bg-slate-200 opacity-40 z-0 transition-all duration-1000"
                         style={{ width: `${bar.previous_average}%` }}
                       ></div>
                       {/* Active bar */}
                       <div 
                         className={`absolute h-full z-10 rounded-full transition-all duration-1000 ${barColorMap[bar.color] || 'bg-indigo-600'}`}
                         style={{ width: `${bar.current_value}%` }}
                       ></div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Insights */}
        <div className="space-y-8">
           <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <i className="fa-solid fa-person-rays text-2xl"></i>
                </div>
                <h3 className="text-xl font-black tracking-tight">Your Path</h3>
              </div>
              <ul className="space-y-4">
                {result.personalized_insights.for_employee.map((item, idx) => (
                  <li key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/10 border border-white/5 items-start">
                    <i className="fa-solid fa-circle-check mt-1 text-emerald-200"></i>
                    <p className="text-sm font-medium leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
           </div>

           <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
                  <i className="fa-solid fa-briefcase text-2xl"></i>
                </div>
                <h3 className="text-xl font-black tracking-tight">HR Strategy</h3>
              </div>
              <ul className="space-y-4">
                {result.personalized_insights.for_hr.map((item, idx) => (
                  <li key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-start">
                    <i className="fa-solid fa-lightbulb mt-1 text-indigo-400"></i>
                    <p className="text-sm font-medium leading-relaxed text-slate-300">{item}</p>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={onReset}
          className="group px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl"
        >
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i>
          New Assessment
        </button>
      </div>
    </div>
  );
};

const SummaryTile = ({ label, value, colorClass = 'text-slate-800' }: { label: string, value: string | number, colorClass?: string }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
    <span className={`text-sm font-black ${colorClass}`}>{value}</span>
  </div>
);

export default ResultCard;
