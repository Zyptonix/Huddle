import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Play, Pause, RefreshCw, Clock, 
  Shield, Zap, Users, Trophy, 
  StopCircle, CheckCircle 
} from 'lucide-react';

const SPORTS_CONFIG = {
  football: {
    gradient: 'from-emerald-600 to-teal-900',
    accent: 'text-emerald-400',
    actions: {
      primary: [{ label: 'GOAL', points: 1, type: 'goal', reqPlayer: true, icon: '⚽' }],
      secondary: [
        { label: 'Shot on Target', type: 'shot', reqPlayer: true },
        { label: 'Shot Missed', type: 'shot_miss', reqPlayer: true },
        { label: 'Corner', type: 'corner', reqPlayer: false },
        { label: 'Foul', type: 'foul', reqPlayer: true },
      ],
      cards: [
        { label: 'Yellow', type: 'card_yellow', reqPlayer: true, color: 'bg-yellow-500 text-black' },
        { label: 'Red', type: 'card_red', reqPlayer: true, color: 'bg-rose-600 text-white' },
      ]
    }
  },
  basketball: {
    gradient: 'from-orange-600 to-red-900',
    accent: 'text-orange-400',
    actions: {
      primary: [
        { label: '+3', points: 3, type: '3pt', reqPlayer: true, icon: '👌' },
        { label: '+2', points: 2, type: '2pt', reqPlayer: true, icon: '🏀' },
        { label: '+1', points: 1, type: 'ft', reqPlayer: true, icon: 'wd' },
      ],
      secondary: [
        { label: 'Rebound', type: 'reb', reqPlayer: true },
        { label: 'Steal', type: 'steal', reqPlayer: true },
        { label: 'Block', type: 'block', reqPlayer: true },
      ],
      cards: [
        { label: 'Foul', type: 'foul_p', reqPlayer: true, color: 'bg-slate-600' },
        { label: 'Timeout', type: 'timeout', reqPlayer: false, color: 'bg-yellow-600 text-black' },
      ]
    }
  }
};

export default function LiveOperatorConsole({ match, sport = 'football' }) {
  if (!match) return <div className="text-white p-10">Loading Console...</div>;

  const config = SPORTS_CONFIG[sport] || SPORTS_CONFIG.football;
  
  // State
  const [scores, setScores] = useState({ a: match.score_a || 0, b: match.score_b || 0 });
  const [events, setEvents] = useState([]);
  const [timer, setTimer] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [roster, setRoster] = useState([]); 

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Initial Data Load
  useEffect(() => {
    if (match.game_clock && match.game_clock !== 'FT') {
       const [m, s] = match.game_clock.split(':').map(Number);
       if (!isNaN(m)) setTimer((m * 60) + (s || 0));
    }

    // Load Events
    supabase.from('match_events').select('*').eq('match_id', match.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEvents(data || []));

    // Load Roster (Combine both teams for the modal picker)
    const fetchRosters = async () => {
       const { data: teamA } = await supabase.from('match_lineups')
         .select('player_id, jersey_number, profiles(username)').eq('team_id', match.team_a_id).eq('match_id', match.id);
       const { data: teamB } = await supabase.from('match_lineups')
         .select('player_id, jersey_number, profiles(username)').eq('team_id', match.team_b_id).eq('match_id', match.id);
       
       // Fallback mock if empty
       if (!teamA?.length && !teamB?.length) {
          setRoster([
             { id: '1', name: 'Player 1', number: 10, teamId: match.team_a_id },
             { id: '2', name: 'Player 2', number: 9, teamId: match.team_b_id }
          ]);
       } else {
          const formatted = [
             ...(teamA || []).map(p => ({ id: p.player_id, name: p.profiles.username, number: p.jersey_number, teamId: match.team_a_id })),
             ...(teamB || []).map(p => ({ id: p.player_id, name: p.profiles.username, number: p.jersey_number, teamId: match.team_b_id }))
          ];
          setRoster(formatted);
       }
    };
    fetchRosters();
  }, [match.id]);

  const formatTime = (s) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleAction = (action, teamId) => {
    if (action.reqPlayer) {
      setPendingAction({ ...action, teamId });
      setModalOpen(true);
    } else {
      commitEvent(action, teamId, null);
    }
  };

  const commitEvent = async (action, teamId, player) => {
    const timestamp = formatTime(timer);
    const scoreDelta = action.points || 0;
    
    // Optimistic Update
    const newEvent = { 
      type: action.type, 
      message: `${action.label}${player ? ` by ${player.name}` : ''}`, 
      timestamp, 
      team_id: teamId 
    };
    setEvents([newEvent, ...events]);
    
    if (scoreDelta) {
      if (teamId === match.team_a_id) setScores(s => ({ ...s, a: s.a + scoreDelta }));
      else setScores(s => ({ ...s, b: s.b + scoreDelta }));
    }

    setModalOpen(false);

    // Database
    await supabase.from('match_events').insert([{
      match_id: match.id,
      type: action.type,
      team_id: teamId,
      player_name: player?.name,
      timestamp,
      message: newEvent.message,
      metadata: { scoreDelta }
    }]);

    if (scoreDelta) {
      const update = teamId === match.team_a_id ? { score_a: scores.a + scoreDelta } : { score_b: scores.b + scoreDelta };
      await supabase.from('matches').update(update).eq('id', match.id);
    }
  };

  const endMatch = async () => {
    if (!window.confirm("End this match? Status will change to 'Finished'.")) return;
    setIsRunning(false);
    await supabase.from('matches').update({ status: 'finished', game_clock: 'FT' }).eq('id', match.id);
    alert("Match Ended.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white p-4">
      
      {/* 1. HEADER & TIMER */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl border border-slate-800 p-6 mb-6 shadow-2xl">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${config.gradient} opacity-50`}></div>
        
        {/* End Match Button */}
        <div className="flex justify-between items-center mb-4 relative z-20">
           <span className="px-2 py-1 bg-slate-800 rounded text-xs font-bold text-slate-400 border border-slate-700">OPERATOR VIEW</span>
           <button onClick={endMatch} className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg text-xs font-bold transition-all">
             <StopCircle size={14} /> END MATCH
           </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          {/* Team A */}
          <div className="flex-1 text-center md:text-left">
             <h2 className="text-2xl font-bold text-slate-300 tracking-tight">{match.teams_a?.name || 'Home'}</h2>
             <div className="text-7xl font-black mt-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">{scores.a}</div>
          </div>

          {/* TIMER */}
          <div className="flex flex-col items-center">
             <div className={`text-6xl font-mono font-bold tracking-widest mb-4 ${isRunning ? config.accent : 'text-slate-600'}`}>
                {formatTime(timer)}
             </div>
             <div className="flex gap-2 p-1 bg-slate-800 rounded-full border border-slate-700">
                <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${isRunning ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'}`}>
                  {isRunning ? 'PAUSE' : 'START'}
                </button>
                <button onClick={() => { setIsRunning(false); setTimer(0); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400"><RefreshCw size={16} /></button>
             </div>
          </div>

          {/* Team B */}
          <div className="flex-1 text-center md:text-right">
             <h2 className="text-2xl font-bold text-slate-300 tracking-tight">{match.teams_b?.name || 'Away'}</h2>
             <div className="text-7xl font-black mt-2 bg-clip-text text-transparent bg-gradient-to-bl from-white to-slate-500">{scores.b}</div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CONTROLS (HOME) */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Home Actions</h3>
              <div className="space-y-3">
                 {config.actions.primary.map((act, i) => (
                    <button key={i} onClick={() => handleAction(act, match.team_a_id)} className={`w-full h-16 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 bg-gradient-to-r ${config.gradient} shadow-lg text-white border border-white/10`}>
                       <span>{act.icon}</span> {act.label}
                    </button>
                 ))}
                 <div className="grid grid-cols-2 gap-2">
                    {config.actions.secondary.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_a_id)} className="h-12 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-sm transition-colors">{act.label}</button>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-2 pt-2">
                    {config.actions.cards.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_a_id)} className={`h-10 rounded-lg font-bold text-xs ${act.color}`}>{act.label}</button>
                    ))}
                 </div>
              </div>
           </div>
           
           {/* Possession Slider */}
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                 <span>POSSESSION</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="50" onChange={(e) => supabase.from('matches').update({ details: { possession_a: parseInt(e.target.value) } }).eq('id', match.id)} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
           </div>
        </div>

        {/* CENTER FEED */}
        <div className="lg:col-span-6 flex flex-col gap-4 h-[600px]">
           <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-10"></div>
              <div className="flex-1 overflow-y-auto space-y-3 pt-4 pb-20 custom-scrollbar">
                 {events.map((ev, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${ev.team_id === match.team_a_id ? 'bg-slate-800/50 border-emerald-500/20' : 'bg-slate-800/50 border-blue-500/20'} animate-fadeIn`}>
                       <div className="font-mono font-bold text-slate-500 text-xs">{ev.timestamp}</div>
                       <div className="flex-1">
                          <div className="text-white font-medium">{ev.message}</div>
                       </div>
                       {ev.type === 'goal' && <Trophy size={16} className="text-yellow-400" />}
                    </div>
                 ))}
                 {events.length === 0 && <div className="text-center text-slate-600 mt-20">Match Ready. Start Timer.</div>}
              </div>
              {/* Quick Chat */}
              <div className="absolute bottom-0 left-0 w-full bg-slate-800/90 backdrop-blur border-t border-slate-700 p-3 flex gap-2 overflow-x-auto">
                 {['Great Save', 'Injury', 'VAR', 'Crowd Wild'].map(msg => (
                    <button key={msg} onClick={() => commitEvent({ type: 'msg', label: msg }, null, null)} className="whitespace-nowrap px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-xs text-white font-medium border border-slate-600">{msg}</button>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT CONTROLS (AWAY) */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 text-right">Away Actions</h3>
              <div className="space-y-3">
                 {config.actions.primary.map((act, i) => (
                    <button key={i} onClick={() => handleAction(act, match.team_b_id)} className={`w-full h-16 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 bg-slate-800 border border-slate-700 shadow-lg text-white hover:bg-slate-700`}>
                       <span>{act.icon}</span> {act.label}
                    </button>
                 ))}
                 <div className="grid grid-cols-2 gap-2">
                    {config.actions.secondary.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_b_id)} className="h-12 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-sm transition-colors">{act.label}</button>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-2 pt-2">
                    {config.actions.cards.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_b_id)} className={`h-10 rounded-lg font-bold text-xs ${act.color}`}>{act.label}</button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scaleIn">
              <div className="p-4 bg-slate-800 border-b border-slate-700">
                 <h3 className="font-bold text-white">Select Player</h3>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                 {roster.filter(p => p.teamId === pendingAction.teamId).map(p => (
                    <button key={p.id} onClick={() => commitEvent(pendingAction, pendingAction.teamId, p)} className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex justify-between group">
                       <span className="text-slate-300 group-hover:text-white font-bold">{p.name}</span>
                       <span className="text-slate-600 font-mono">#{p.number}</span>
                    </button>
                 ))}
              </div>
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                 <button onClick={() => setModalOpen(false)} className="w-full py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}