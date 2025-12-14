import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import { useRouter } from 'next/router';
import { 
  Play, Pause, StopCircle, 
  Trophy, Activity, Users, ArrowLeft,
  Circle, XOctagon, Flag, Hand
} from 'lucide-react';

// --- MULTI-SPORT CONFIGURATION ---
const SPORTS_CONFIG = {
  football: {
    actions: {
      primary: [
        { label: 'GOAL', points: 1, type: 'goal', reqPlayer: true, icon: <Trophy size={20} />, color: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' },
      ],
      secondary: [
        { label: 'Shot on Target', type: 'shot_on', reqPlayer: true, color: 'bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700' },
        { label: 'Shot Missed', type: 'shot_off', reqPlayer: true, color: 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600' },
        { label: 'Corner', type: 'corner', reqPlayer: false, color: 'bg-white hover:bg-purple-50 border-purple-200 text-purple-700' },
        { label: 'Foul', type: 'foul', reqPlayer: true, color: 'bg-white hover:bg-orange-50 border-orange-200 text-orange-700' },
      ],
      cards: [
        { label: 'Yellow Card', type: 'card_yellow', reqPlayer: true, color: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' },
        { label: 'Red Card', type: 'card_red', reqPlayer: true, color: 'bg-red-600 text-white hover:bg-red-700' },
      ]
    }
  },
  basketball: {
    actions: {
      primary: [
        { label: '+3 POINTS', points: 3, type: '3pt', reqPlayer: true, icon: <Trophy size={20} />, color: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200' },
        { label: '+2 POINTS', points: 2, type: '2pt', reqPlayer: true, icon: <Activity size={20} />, color: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' },
      ],
      secondary: [
        { label: 'Free Throw (+1)', points: 1, type: 'ft', reqPlayer: true, color: 'bg-white hover:bg-orange-50 border-orange-200 text-orange-700' },
        { label: 'Rebound', type: 'rebound', reqPlayer: true, color: 'bg-white hover:bg-blue-50 border-blue-200 text-blue-700' },
        { label: 'Assist', type: 'assist', reqPlayer: true, color: 'bg-white hover:bg-purple-50 border-purple-200 text-purple-700' },
        { label: 'Steal', type: 'steal', reqPlayer: true, color: 'bg-white hover:bg-teal-50 border-teal-200 text-teal-700' },
        { label: 'Block', type: 'block', reqPlayer: true, color: 'bg-white hover:bg-rose-50 border-rose-200 text-rose-700' },
        { label: 'Turnover', type: 'turnover', reqPlayer: true, color: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600' },
      ],
      cards: [
        { label: 'Personal Foul', type: 'foul_p', reqPlayer: true, color: 'bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200' },
        { label: 'Tech Foul', type: 'foul_t', reqPlayer: true, color: 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200' },
        { label: 'Timeout', type: 'timeout', reqPlayer: false, color: 'bg-slate-800 text-white hover:bg-slate-700' },
      ]
    }
  },
  cricket: {
    actions: {
      primary: [
        { label: '6 RUNS', points: 6, type: 'six', reqPlayer: true, icon: <Trophy size={20} />, color: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200' },
        { label: '4 RUNS', points: 4, type: 'four', reqPlayer: true, icon: <Activity size={20} />, color: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' },
      ],
      secondary: [
        { label: '1 Run', points: 1, type: 'single', reqPlayer: true, color: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' },
        { label: '2 Runs', points: 2, type: 'double', reqPlayer: true, color: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' },
        { label: 'Wide (+1)', points: 1, type: 'wide', reqPlayer: false, color: 'bg-white hover:bg-amber-50 border-amber-200 text-amber-700' },
        { label: 'No Ball (+1)', points: 1, type: 'noball', reqPlayer: false, color: 'bg-white hover:bg-red-50 border-red-200 text-red-700' },
        { label: 'Dot Ball', type: 'dot', reqPlayer: true, color: 'bg-white hover:bg-gray-100 border-gray-300 text-gray-500' },
      ],
      cards: [
        { label: 'WICKET', type: 'wicket', reqPlayer: true, color: 'bg-red-600 text-white hover:bg-red-700 border-red-700' },
        { label: 'Review', type: 'review', reqPlayer: false, color: 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200' },
        { label: 'Drinks', type: 'drinks', reqPlayer: false, color: 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200' },
      ]
    }
  }
};

export default function LiveOperatorConsole({ match, sport = 'football' }) {
  const router = useRouter();
  
  // Safe fallback to football if sport is undefined or invalid
  const config = SPORTS_CONFIG[sport?.toLowerCase()] || SPORTS_CONFIG.football;
  
  // --- STATE ---
  const [matchState, setMatchState] = useState(match);
  const [events, setEvents] = useState([]);
  const [timer, setTimer] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [roster, setRoster] = useState([]);
  
  // UI State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); 
  const [selectedTeam, setSelectedTeam] = useState(null); // 'a' or 'b'

  // Timer Ref for Interval
  const timerIntervalRef = useRef(null);

  // --- 1. REALTIME & INITIAL DATA ---
  useEffect(() => {
    if (!match?.id) return;

    // A. Initial Data Load
    const fetchData = async () => {
      // 1. Events
      const { data: eventData } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: false });
      if (eventData) setEvents(eventData);

      // 2. Roster 
      fetchRoster();

      // 3. Time Parsing
      const [mm, ss] = (match.game_clock || "00:00").split(':').map(Number);
      setTimer(mm * 60 + ss);
      setIsRunning(match.status === 'live');
    };

    fetchData();

    // B. REALTIME SUBSCRIPTION
    const channel = supabase
      .channel(`match_room:${match.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${match.id}` }, 
        (payload) => {
          setEvents(prev => [payload.new, ...prev]);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` }, 
        (payload) => {
          setMatchState(payload.new);
          // Sync timer status if changed remotely
          if(payload.new.status !== (isRunning ? 'live' : 'paused')) {
             setIsRunning(payload.new.status === 'live');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timerIntervalRef.current);
    };
  }, [match.id]);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRunning]);

  // Auto-save timer every 10s (Background Sync)
  useEffect(() => {
    if(isRunning && timer % 10 === 0 && timer > 0) {
      const timeStr = formatTime(timer);
      supabase.from('matches').update({ game_clock: timeStr }).eq('id', match.id).then();
    }
  }, [timer, isRunning]);

  // --- 3. ROSTER FETCHING ---
  const fetchRoster = async () => {
    try {
        const { data: lineupData } = await supabase.from('match_lineups').select('*').eq('match_id', match.id);
        const { data: membersData } = await supabase.from('team_members')
            .select(`team_id, user_id, profiles:user_id (id, username, jersey_number)`)
            .in('team_id', [match.team_a_id, match.team_b_id]);
        
        if(membersData) {
            const merged = membersData.filter(m => m.profiles).map(m => {
                const starter = lineupData?.find(l => l.player_id === m.user_id);
                return {
                    id: m.user_id,
                    name: m.profiles.username,
                    number: starter?.jersey_number || m.profiles.jersey_number || 0,
                    teamId: m.team_id,
                    isStarter: !!starter,
                    position: starter?.position_code
                };
            }).sort((a,b) => (b.isStarter - a.isStarter));
            setRoster(merged);
        }
    } catch(e) { console.error("Roster error", e); }
  };

  // --- 4. ACTION HANDLERS ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleActionClick = (action, teamType) => {
    if (!isRunning) return alert("Start the match first!");
    
    const teamId = teamType === 'a' ? matchState.team_a_id : matchState.team_b_id;
    
    if (action.reqPlayer) {
      setPendingAction({ ...action, teamId });
      setSelectedTeam(teamType);
      setModalOpen(true);
    } else {
      submitEvent(action, teamId, null);
    }
  };

  const submitEvent = async (action, teamId, player) => {
    setProcessing(true);
    setModalOpen(false);
    
    try {
      const timeString = formatTime(timer);
      const isTeamA = teamId === matchState.team_a_id;
      
      // Construct Event Payload
      const newEvent = {
        match_id: match.id,
        team_id: teamId,
        player_name: player?.name || null,
        type: action.type,
        message: `${action.label} - ${player ? player.name : (isTeamA ? matchState.teams_a.name : matchState.teams_b.name)}`,
        timestamp: timeString,
      };

      // 1. Insert Event
      await supabase.from('match_events').insert(newEvent);

      // 2. Update Score if needed
      if (action.points) {
        const newScore = isTeamA ? (matchState.score_a || 0) + action.points : (matchState.score_b || 0) + action.points;
        const updateField = isTeamA ? { score_a: newScore } : { score_b: newScore };
        
        // Optimistic update
        setMatchState(prev => ({ ...prev, ...updateField }));
        
        await supabase.from('matches').update({
           ...updateField,
           game_clock: timeString
        }).eq('id', match.id);
      }

    } catch (error) {
      console.error("Event failed:", error);
      alert("Failed to record event");
    } finally {
      setProcessing(false);
      setPendingAction(null);
    }
  };

  const toggleTimer = async () => {
    const newStatus = isRunning ? 'paused' : 'live';
    setIsRunning(!isRunning);
    
    await supabase.from('matches').update({ 
      status: newStatus,
      game_clock: formatTime(timer)
    }).eq('id', match.id);

    // System Event
    await supabase.from('match_events').insert({
      match_id: match.id,
      type: 'system',
      message: newStatus === 'live' ? 'Match Resumed' : 'Match Paused',
      timestamp: formatTime(timer)
    });
  };

  const endMatch = async () => {
    if (!confirm("Are you sure you want to end this match? This action is irreversible.")) return;
    setProcessing(true);
    setIsRunning(false);

    try {
      let winnerId = null;
      if (matchState.score_a > matchState.score_b) winnerId = matchState.team_a_id;
      else if (matchState.score_b > matchState.score_a) winnerId = matchState.team_b_id;

      const { error } = await supabase.from('matches').update({
        status: 'completed',
        game_clock: 'FT',
        winner_id: winnerId
      }).eq('id', match.id);

      if (error) throw error;

      if (winnerId && matchState.next_match_id && matchState.next_match_slot) {
        const field = matchState.next_match_slot === 'a' ? 'team_a_id' : 'team_b_id';
        await supabase.from('matches').update({ [field]: winnerId }).eq('id', matchState.next_match_id);
      }

      await supabase.from('match_events').insert({
        match_id: match.id,
        type: 'system',
        message: `Match Ended. FT: ${matchState.score_a} - ${matchState.score_b}`,
        timestamp: 'FT'
      });

      router.push(`/tournament/${matchState.tournament_id}`);

    } catch (err) {
      alert("Error ending match: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // --- RENDER HELPERS ---
  const TeamControls = ({ team, teamData, side }) => (
    <div className="flex flex-col gap-3 h-full">
       {/* Team Header Card */}
       <div className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm bg-white ${side === 'a' ? 'border-emerald-100' : 'border-indigo-100'}`}>
          {teamData?.logo_url ? (
            <img src={teamData.logo_url} className="w-12 h-12 rounded-full border border-gray-100 object-cover" />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${side === 'a' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                {teamData?.name?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
             <h3 className="font-bold text-slate-800 truncate">{teamData?.name || 'Unknown Team'}</h3>
             <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{side === 'a' ? 'Home' : 'Away'}</div>
          </div>
          <div className="ml-auto text-4xl font-black font-mono text-slate-800">{side === 'a' ? matchState.score_a : matchState.score_b}</div>
       </div>

       {/* Primary Actions (Big Buttons) */}
       <div className="grid grid-cols-1 gap-2">
          {config.actions.primary.map((act, i) => (
             <button key={i} disabled={processing} onClick={() => handleActionClick(act, side)} 
               className={`py-6 rounded-xl font-black text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${act.color}`}>
                {act.icon} {act.label}
             </button>
          ))}
       </div>

       {/* Secondary Actions (Grid) */}
       <div className="grid grid-cols-2 gap-2">
          {config.actions.secondary.map((act, i) => (
             <button key={i} disabled={processing} onClick={() => handleActionClick(act, side)} 
               className={`py-3 px-2 rounded-lg font-bold text-xs border transition-colors shadow-sm ${act.color}`}>
               {act.label}
             </button>
          ))}
       </div>
       
       {/* Card/Extra Actions */}
       <div className="mt-auto grid grid-cols-2 gap-2">
          {config.actions.cards.map((act, i) => (
             <button key={i} disabled={processing} onClick={() => handleActionClick(act, side)} 
               className={`py-2 rounded-lg font-bold text-xs uppercase shadow-sm border border-transparent ${act.color}`}>
               {act.label}
             </button>
          ))}
       </div>
    </div>
  );

  if (!match) return <div className="text-slate-500 flex items-center justify-center h-screen bg-slate-50"><Activity className="animate-spin mr-2"/> Loading Match...</div>;

  return (
    <div className="h-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden">
      
      {/* TOP BAR */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
         <button onClick={() => router.back()} className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
         </button>
         
         <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border shadow-sm ${isRunning ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
               <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-600 animate-pulse' : 'bg-amber-500'}`}></div>
               <span className="text-xs font-extrabold uppercase tracking-widest">{isRunning ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <div className="font-mono text-3xl font-black tracking-widest text-slate-800 min-w-[100px] text-center">
               {formatTime(timer)}
            </div>
         </div>

         <div className="flex gap-2">
            <button onClick={toggleTimer} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${isRunning ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600' : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white'}`}>
               {isRunning ? <><Pause size={14}/> PAUSE</> : <><Play size={14}/> RESUME</>}
            </button>
            <button onClick={endMatch} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm">
               <StopCircle size={14}/> FINISH
            </button>
         </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
         
         {/* LEFT: ROSTER */}
         <div className="hidden lg:block col-span-3 bg-white border-r border-slate-200 p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14}/> Active Rosters</h3>
            <div className="space-y-6">
               <div>
                  <div className="text-emerald-600 text-xs font-bold mb-2 uppercase border-b border-emerald-100 pb-1">{matchState.teams_a?.name}</div>
                  <div className="space-y-1">
                      {roster.filter(p => p.teamId === matchState.team_a_id).map(p => (
                         <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50 transition-colors cursor-default">
                            <span className="text-slate-400 font-mono w-6 font-bold">{p.number}</span>
                            <span className="text-slate-700 truncate flex-1 font-medium">{p.name}</span>
                            {p.isStarter && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm"></span>}
                         </div>
                      ))}
                  </div>
               </div>
               <div>
                  <div className="text-indigo-600 text-xs font-bold mb-2 uppercase border-b border-indigo-100 pb-1">{matchState.teams_b?.name}</div>
                  <div className="space-y-1">
                      {roster.filter(p => p.teamId === matchState.team_b_id).map(p => (
                         <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50 transition-colors cursor-default">
                            <span className="text-slate-400 font-mono w-6 font-bold">{p.number}</span>
                            <span className="text-slate-700 truncate flex-1 font-medium">{p.name}</span>
                            {p.isStarter && <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm"></span>}
                         </div>
                      ))}
                  </div>
               </div>
            </div>
         </div>

         {/* CENTER: ACTION BOARD */}
         <div className="col-span-12 lg:col-span-6 bg-slate-100 p-4 lg:p-8 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 h-full max-w-2xl mx-auto">
               <TeamControls team="a" teamData={matchState.teams_a} side="a" />
               <TeamControls team="b" teamData={matchState.teams_b} side="b" />
            </div>
         </div>

         {/* RIGHT: EVENT FEED */}
         <div className="hidden lg:block col-span-3 bg-white border-l border-slate-200 flex flex-col">
             <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Match Feed</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {events.map((ev) => (
                   <div key={ev.id} className="animate-in slide-in-from-right-2 duration-300">
                      <div className={`text-[10px] font-mono mb-1 font-bold ${ev.team_id === matchState.team_a_id ? 'text-emerald-600' : ev.team_id === matchState.team_b_id ? 'text-indigo-600' : 'text-slate-400'}`}>
                         {ev.timestamp} • {ev.type === 'system' ? 'SYSTEM' : (ev.player_name || 'TEAM EVENT')}
                      </div>
                      <div className={`p-3 rounded-lg text-sm border-l-4 shadow-sm ${
                        ev.type === 'system' 
                           ? 'bg-slate-100 border-slate-300 text-slate-500' 
                           : 'bg-white border-indigo-500 text-slate-700'
                      }`}>
                         {ev.message}
                      </div>
                   </div>
                ))}
             </div>
         </div>
      </div>

      {/* PLAYER SELECTION MODAL */}
      {modalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-200">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">Who Scored/Acted?</h3>
                  <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-red-500 font-medium text-sm">Cancel</button>
               </div>
               <div className="overflow-y-auto p-2">
                  <button onClick={() => submitEvent(pendingAction, pendingAction.teamId, null)} 
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-50 text-slate-500 italic text-sm border-b border-slate-100 mb-2">
                     Unknown / Team Event
                  </button>
                  {roster.filter(p => p.teamId === pendingAction.teamId).map(p => (
                     <button key={p.id} onClick={() => submitEvent(pendingAction, pendingAction.teamId, p)} 
                        className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 border border-transparent flex items-center gap-3 group transition-all">
                        <span className="font-mono text-slate-400 group-hover:text-indigo-500 font-bold w-6">{p.number}</span>
                        <span className="text-slate-700 group-hover:text-indigo-900 font-bold">{p.name}</span>
                        {p.isStarter && <span className="ml-auto text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">Starter</span>}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      )}

    </div>
  );
}