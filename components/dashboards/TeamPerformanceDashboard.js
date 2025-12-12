import React from 'react';
import { TrendingUp, Shield, Activity, Target } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
      <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">SEASON</span>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</div>
  </div>
);

export default function TeamPerformanceDashboard() {
  return (
    <div className="space-y-8 text-white p-6 bg-slate-950 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Goals / Match" value="2.4" icon={Target} color="bg-emerald-500" />
        <KPICard title="Clean Sheets" value="5" icon={Shield} color="bg-blue-500" />
        <KPICard title="Win Rate" value="68%" icon={TrendingUp} color="bg-purple-500" />
        <KPICard title="Possession Avg" value="54%" icon={Activity} color="bg-orange-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Activity size={18} className="text-emerald-400" /> Recent Form</h3>
          <div className="flex gap-3">
            {['W', 'W', 'D', 'L', 'W'].map((r, i) => (
              <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 ${r === 'W' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : r === 'L' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-500/20 border-slate-500 text-slate-400'}`}>{r}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}