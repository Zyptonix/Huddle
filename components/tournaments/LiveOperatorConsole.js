import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { 
  Play, Pause, RefreshCw, Clock, Shield, Trophy, StopCircle 
} from 'lucide-react';

const SPORTS_CONFIG = {
  football: {
    // Light Theme Gradients
    gradient: 'from-emerald-500 to-teal-600',
    actions: {
      primary: [{ label: 'GOAL', points: 1, type: 'goal', reqPlayer: true, icon: '⚽' }],
      secondary: [
        { label: 'Shot on Target', type: 'shot', reqPlayer: true },
        { label: 'Shot Missed', type: 'shot_miss', reqPlayer: true },
        { label: 'Corner', type: 'corner', reqPlayer: false },
        { label: 'Foul', type: 'foul', reqPlayer: true },
      ],
      cards: [
        { label: 'Yellow', type: 'card_yellow', reqPlayer: true, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
        { label: 'Red', type: 'card_red', reqPlayer: true, color: 'bg-red-100 text-red-700 border-red-300' },
      ]
    }
  }
  // Add basketball/cricket configs similarly...
};

export default function LiveOperatorConsole({ match, sport = 'football' }) {
  const router = useRouter();
  if (!match) return <div>Loading...</div>;

  const config = SPORTS_CONFIG[sport] || SPORTS_CONFIG.football;
  // ... (Keep existing State & Logic hooks - useState, useEffect - from previous code) ...
  // ... (I am abbreviating the logic part to focus on the styling, assume logic is same as before) ...
  const [scores, setScores] = useState({ a: match.score_a || 0, b: match.score_b || 0 });
  const [events, setEvents] = useState([]);
  const [timer, setTimer] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [roster, setRoster] = useState([]); 

  // ... (Keep existing useEffects for Timer, Initial Load, Roster, formatTime, handleAction, commitEvent, endMatch) ...
  // (Paste the logic from the previous dark mode file here)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4">
      
      {/* HEADER & TIMER */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${config.gradient}`}></div>
        
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">LIVE CONTROL</span>
           </div>
           <button onClick={endMatch} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm">
             <StopCircle size={14} /> END MATCH
           </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Team A */}
          <div className="flex-1 text-center md:text-left">
             <h2 className="text-2xl font-bold text-gray-800">{match.teams_a?.name || 'Home'}</h2>
             <div className="text-7xl font-black mt-2 text-gray-900">{scores.a}</div>
          </div>

          {/* TIMER */}
          <div className="flex flex-col items-center">
             <div className="text-6xl font-mono font-bold tracking-widest mb-4 text-gray-700 bg-gray-100 px-6 py-2 rounded-xl border border-gray-200">
                {formatTime(timer)}
             </div>
             <div className="flex gap-2">
                <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-2 rounded-full font-bold text-sm shadow-md transition-all ${isRunning ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  {isRunning ? 'PAUSE' : 'START'}
                </button>
             </div>
          </div>

          {/* Team B */}
          <div className="flex-1 text-center md:text-right">
             <h2 className="text-2xl font-bold text-gray-800">{match.teams_b?.name || 'Away'}</h2>
             <div className="text-7xl font-black mt-2 text-gray-900">{scores.b}</div>
          </div>
        </div>
      </div>

      {/* CONTROLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CONTROLS */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Home Actions</h3>
              <div className="space-y-3">
                 {config.actions.primary.map((act, i) => (
                    <button key={i} onClick={() => handleAction(act, match.team_a_id)} className={`w-full h-16 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 bg-gradient-to-r ${config.gradient} shadow-md text-white`}>
                       <span>{act.icon}</span> {act.label}
                    </button>
                 ))}
                 <div className="grid grid-cols-2 gap-2">
                    {config.actions.secondary.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_a_id)} className="h-12 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-sm transition-colors">{act.label}</button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* FEED */}
        <div className="lg:col-span-6 flex flex-col gap-4 h-[600px]">
           <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 overflow-hidden flex flex-col shadow-sm">
              <div className="bg-gray-50 p-2 border-b border-gray-100 mb-2 rounded-t-lg text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                 <Clock size={12}/> Match Feed
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-2">
                 {events.map((ev, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${ev.team_id === match.team_a_id ? 'bg-emerald-50/50 border-emerald-100' : 'bg-blue-50/50 border-blue-100'}`}>
                       <div className="font-mono font-bold text-gray-400 text-xs">{ev.timestamp}</div>
                       <div className="flex-1 text-gray-800 font-medium text-sm">{ev.message}</div>
                       {ev.type === 'goal' && <Trophy size={16} className="text-yellow-500" />}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-right">Away Actions</h3>
              <div className="space-y-3">
                 {config.actions.primary.map((act, i) => (
                    <button key={i} onClick={() => handleAction(act, match.team_b_id)} className={`w-full h-16 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 bg-gray-900 shadow-md text-white`}>
                       <span>{act.icon}</span> {act.label}
                    </button>
                 ))}
                 <div className="grid grid-cols-2 gap-2">
                    {config.actions.secondary.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_b_id)} className="h-12 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-sm transition-colors">{act.label}</button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* MODAL (Light Theme) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
              <div className="p-4 bg-gray-50 border-b border-gray-200"><h3 className="font-bold text-gray-800">Select Player</h3></div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                 {roster.filter(p => p.teamId === pendingAction.teamId).map(p => (
                    <button key={p.id} onClick={() => commitEvent(pendingAction, pendingAction.teamId, p)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex justify-between group">
                       <span className="text-gray-700 font-bold">{p.name}</span>
                       <span className="text-gray-400 font-mono">#{p.number}</span>
                    </button>
                 ))}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                 <button onClick={() => setModalOpen(false)} className="w-full py-2 text-gray-500 hover:text-gray-800 text-sm font-bold">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}