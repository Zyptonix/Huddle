import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { 
  Play, Pause, Clock, Shield, Trophy, StopCircle, User, AlertTriangle 
} from 'lucide-react';

const SPORTS_CONFIG = {
  football: {
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
  },
  // Add other sports here if needed
};

export default function LiveOperatorConsole({ match, sport = 'football' }) {
  const router = useRouter();
  const config = SPORTS_CONFIG[sport] || SPORTS_CONFIG.football;

  // --- STATE ---
  const [scores, setScores] = useState({ a: match?.score_a || 0, b: match?.score_b || 0 });
  const [events, setEvents] = useState([]);
  const [timer, setTimer] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  
  // Modal & Logic State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, points, teamId }
  const [roster, setRoster] = useState([]); // [{ id, name, number, teamId, isStarter }]

  // --- 1. INITIAL LOAD & ROSTER FETCHING ---
  useEffect(() => {
    if (!match) return;

    const loadEvents = async () => {
        const { data } = await supabase
            .from('match_events')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false });
        if (data) setEvents(data);
    };

    // --- CRITICAL FIX: Load from 'team_members' + 'profiles' ---
    const loadRosters = async () => {
        try {
            // A. Get Saved Lineup (Starters)
            const { data: lineupData } = await supabase
                .from('match_lineups')
                .select('player_id, jersey_number, position_code')
                .eq('match_id', match.id);

            // B. Get Full Roster (Team Members -> Profiles)
            // We use the 'team_members' table we created earlier
            const { data: membersData, error } = await supabase
                .from('team_members')
                .select(`
                    team_id,
                    user_id,
                    profiles:user_id ( id, username, jersey_number )
                `)
                .in('team_id', [match.team_a_id, match.team_b_id])
                .eq('status', 'active');

            if (error) throw error;
            
            if (membersData) {
                // C. Merge Logic
                const mergedRoster = membersData
                    // Filter out bad data (missing profiles)
                    .filter(m => m.profiles) 
                    .map(m => {
                        const pid = m.user_id;
                        // Find if they are in the starting lineup
                        const starterEntry = lineupData?.find(l => l.player_id === pid);
                        
                        return {
                            id: pid,
                            name: m.profiles.username || 'Unknown',
                            // Priority: Lineup Jersey -> Profile Jersey -> 0
                            number: starterEntry?.jersey_number || m.profiles.jersey_number || 0,
                            teamId: m.team_id,
                            isStarter: !!starterEntry, 
                            position: starterEntry?.position_code
                        };
                    });

                // D. Sort: Starters First, then by Number
                mergedRoster.sort((a, b) => {
                    if (a.isStarter && !b.isStarter) return -1;
                    if (!a.isStarter && b.isStarter) return 1;
                    return (a.number || 0) - (b.number || 0);
                });

                setRoster(mergedRoster);
            }
        } catch (error) {
            console.error("Error loading roster:", error);
        }
    };

    // Parse existing time
    const [mm, ss] = (match.game_clock || "00:00").split(':').map(Number);
    setTimer(mm * 60 + ss);
    setIsRunning(match.status === 'live');

    loadEvents();
    loadRosters();
  }, [match]);


  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (isRunning) {
        interval = setInterval(() => {
            setTimer(t => t + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-save timer every 10s
  useEffect(() => {
      if(isRunning && timer % 10 === 0) {
          supabase.from('matches').update({ game_clock: formatTime(timer) }).eq('id', match.id).then();
      }
  }, [timer]);

  // --- HELPER: Format Time ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- 3. ACTION HANDLERS ---

  const handleAction = (actionConfig, teamId) => {
    const action = { ...actionConfig, teamId };
    
    if (action.reqPlayer) {
        setPendingAction(action);
        setModalOpen(true);
    } else {
        commitEvent(action, teamId, null);
    }
  };

  const commitEvent = async (action, teamId, player) => {
    setModalOpen(false);
    const timeString = formatTime(timer);
    
    // 1. Optimistic Update
    const newEvent = {
        type: action.type,
        message: `${action.label} - ${player ? player.name : 'Team'}`,
        timestamp: timeString,
        team_id: teamId,
        match_id: match.id,
        player_name: player?.name
    };
    setEvents([newEvent, ...events]);

    // 2. Score Update Logic
    if (action.points) {
        const isTeamA = teamId === match.team_a_id;
        const newScore = isTeamA ? scores.a + action.points : scores.b + action.points;
        const update = isTeamA ? { score_a: newScore } : { score_b: newScore };
        
        setScores(prev => ({ ...prev, [isTeamA ? 'a' : 'b']: newScore }));
        await supabase.from('matches').update(update).eq('id', match.id);
    }

    // 3. Persist Event
    await supabase.from('match_events').insert(newEvent);
  };

  const toggleMatchStatus = async () => {
      const newStatus = isRunning ? 'paused' : 'live';
      setIsRunning(!isRunning);
      await supabase.from('matches').update({ status: newStatus }).eq('id', match.id);

      // FIX: Add a system event so the feed updates immediately
      if (!isRunning && events.length === 0) {
          const startEvent = {
              type: 'system',
              message: 'Match Started (Kickoff)',
              timestamp: formatTime(timer),
              match_id: match.id,
              team_id: null
          };
          setEvents([startEvent, ...events]);
          await supabase.from('match_events').insert(startEvent);
      }
  };


  const endMatch = async () => {
      if(!confirm("End this match? This cannot be undone.")) return;
      
      // 1. Determine Winner
      let winnerId = null;
      if (scores.a > scores.b) winnerId = match.team_a_id;
      else if (scores.b > scores.a) winnerId = match.team_b_id;
      else {
          alert("Draws not allowed in knockouts. Please add Penalty scores or Overtime.");
          return;
      }

      setIsRunning(false);
      
      try {
          // 2. Complete Current Match
          const { error: updateError } = await supabase.from('matches').update({ 
              status: 'completed',
              score_a: scores.a,
              score_b: scores.b,
              winner_id: winnerId // Ensure you have a winner_id column or remove this line
          }).eq('id', match.id);

          if (updateError) throw updateError;

          // 3. AUTO-ADVANCE: Move Winner to Next Match
          if (match.next_match_id && match.next_match_slot) {
              
              // We construct the update object dynamically
              // if slot is 'a', we update 'team_a_id'. if 'b', 'team_b_id'
              const fieldToUpdate = match.next_match_slot === 'a' ? 'team_a_id' : 'team_b_id';
              
              const { error: advanceError } = await supabase
                  .from('matches')
                  .update({ [fieldToUpdate]: winnerId })
                  .eq('id', match.next_match_id);

              if (advanceError) throw advanceError;
              
              alert("Match ended. Winner advanced to next round!");
          } else {
             if(match.round_name === 'Final') {
                 alert("TOURNAMENT COMPLETE! 🏆");
             }
          }
          
          router.push(`/tournament/${match.tournament_id}`);
      } catch (error) {
          alert("Error ending match: " + error.message);
          console.error(error);
      }
  };
  if (!match) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 md:p-8">
      
      {/* HEADER & TIMER */}
      <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 mb-6 shadow-2xl relative overflow-hidden max-w-7xl mx-auto">
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${config.gradient}`}></div>
        
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRunning ? 'LIVE' : 'PAUSED'} CONTROL</span>
           </div>
           <button onClick={endMatch} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-red-900/50 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold transition-all shadow-sm">
             <StopCircle size={14} /> END MATCH
           </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Team A */}
          <div className="flex-1 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-4">
                {match.teams_a?.logo_url && <img src={match.teams_a.logo_url} className="w-12 h-12 rounded-full border border-gray-600 bg-white" />}
                <h2 className="text-2xl font-bold text-white">{match.teams_a?.name || 'Home'}</h2>
             </div>
             <div className="text-7xl font-black mt-2 text-emerald-400">{scores.a}</div>
          </div>

          {/* TIMER */}
          <div className="flex flex-col items-center">
             <div className="text-6xl font-mono font-bold tracking-widest mb-4 text-white bg-gray-900 px-8 py-3 rounded-2xl border border-gray-700 shadow-inner">
                {formatTime(timer)}
             </div>
             <button onClick={toggleMatchStatus} className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 transform active:scale-95 ${isRunning ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                {isRunning ? <><Pause size={16}/> PAUSE GAME</> : <><Play size={16}/> START GAME</>}
             </button>
          </div>

          {/* Team B */}
          <div className="flex-1 text-center md:text-right">
             <div className="flex items-center justify-center md:justify-end gap-4 flex-row-reverse md:flex-row">
                <h2 className="text-2xl font-bold text-white">{match.teams_b?.name || 'Away'}</h2>
                {match.teams_b?.logo_url && <img src={match.teams_b.logo_url} className="w-12 h-12 rounded-full border border-gray-600 bg-white" />}
             </div>
             <div className="text-7xl font-black mt-2 text-blue-400">{scores.b}</div>
          </div>
        </div>
      </div>

      {/* CONTROLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        
        {/* LEFT CONTROLS (Home) */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Home Actions</h3>
              <div className="space-y-3">
                 {config.actions.primary.map((act, i) => (
                    <button key={i} onClick={() => handleAction(act, match.team_a_id)} className={`w-full h-16 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 bg-gradient-to-r ${config.gradient} shadow-lg text-white hover:opacity-90`}>
                       <span>{act.icon}</span> {act.label}
                    </button>
                 ))}
                 <div className="grid grid-cols-2 gap-2">
                    {config.actions.secondary.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_a_id)} className="h-12 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 font-bold text-xs transition-colors">{act.label}</button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* FEED */}
        <div className="lg:col-span-6 flex flex-col gap-4 h-[600px]">
           <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 p-0 overflow-hidden flex flex-col shadow-lg">
              <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                    <Clock size={14}/> Match Feed
                 </div>
                 <div className="text-xs text-gray-500">{events.length} events</div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-900/30">
                 {events.length === 0 && <div className="text-center text-gray-500 mt-20 italic">Game has not started yet</div>}
                 {events.map((ev, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm animate-in slide-in-from-top-2 ${ev.team_id === match.team_a_id ? 'bg-gray-700 border-l-4 border-l-emerald-500 border-gray-600' : ev.team_id === match.team_b_id ? 'bg-gray-700 border-l-4 border-l-blue-500 border-gray-600' : 'bg-gray-700 border-l-4 border-l-gray-400 border-gray-600'}`}>
                       <div className="font-mono font-bold text-gray-400 text-xs bg-gray-900 px-2 py-1 rounded">{ev.timestamp}</div>
                       <div className="flex-1 text-gray-200 font-medium text-sm">{ev.message}</div>
                       {ev.type.includes('goal') && <Trophy size={16} className="text-yellow-500" />}
                       {ev.type.includes('card_yellow') && <div className="w-3 h-4 bg-yellow-400 rounded-sm border border-yellow-500"></div>}
                       {ev.type.includes('card_red') && <div className="w-3 h-4 bg-red-500 rounded-sm border border-red-600"></div>}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT CONTROLS (Away) */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Away Actions</h3>
              <div className="space-y-3">
                 {config.actions.primary.map((act, i) => (
                    <button key={i} onClick={() => handleAction(act, match.team_b_id)} className={`w-full h-16 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-transform active:scale-95 bg-gray-700 hover:bg-gray-600 shadow-md text-white border border-gray-600`}>
                       <span>{act.icon}</span> {act.label}
                    </button>
                 ))}
                 <div className="grid grid-cols-2 gap-2">
                    {config.actions.secondary.map((act, i) => (
                       <button key={i} onClick={() => handleAction(act, match.team_b_id)} className="h-12 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 font-bold text-xs transition-colors">{act.label}</button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* PLAYER SELECT MODAL - IMPROVED */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
              <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2">
                      <Shield size={16} className="text-indigo-500"/> Select Player
                  </h3>
                  <span className="text-xs font-bold uppercase bg-indigo-900 text-indigo-300 px-2 py-1 rounded">{pendingAction?.label}</span>
              </div>
              
              <div className="p-2 max-h-[300px] overflow-y-auto">
                 {/* Empty State */}
                 {roster.filter(p => p.teamId === pendingAction.teamId).length === 0 && (
                     <div className="p-4 text-center text-gray-400 text-sm">
                         No players found for this team.<br/>
                         <button onClick={() => commitEvent(pendingAction, pendingAction.teamId, { name: 'Unknown Player', id: null })} className="text-indigo-400 font-bold mt-2 underline">
                             Continue as "Unknown"
                         </button>
                     </div>
                 )}

                 {/* Render Players - Starters Highlighted */}
                 {roster
                    .filter(p => p.teamId === pendingAction.teamId)
                    .map(p => (
                    <button key={p.id} onClick={() => commitEvent(pendingAction, pendingAction.teamId, p)} className={`w-full text-left p-2 rounded-lg flex items-center gap-3 justify-between group transition-colors mb-1 ${p.isStarter ? 'bg-indigo-900/30 border border-indigo-500/30 hover:bg-indigo-900/50' : 'hover:bg-gray-700 border border-transparent'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`font-mono font-bold text-sm w-6 text-center rounded ${p.isStarter ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                {p.number}
                            </span>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${p.isStarter ? 'text-indigo-200' : 'text-gray-300'}`}>
                                    {p.name}
                                </span>
                                {p.isStarter && <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider">Starter ({p.position})</span>}
                            </div>
                        </div>
                    </button>
                 ))}
              </div>
              <div className="p-3 bg-gray-900 border-t border-gray-700">
                 <button onClick={() => setModalOpen(false)} className="w-full py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-800 text-sm font-bold transition-colors">Cancel Action</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}