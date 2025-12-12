import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Ensure path is correct
import Card from '../ui/Card';

const LiveMatchConsole = ({ initialMatch, sport = 'football' }) => {
  // Initialize state with the props we fetched from the parent
  const [scores, setScores] = useState({ 
    a: initialMatch.score_a || 0, 
    b: initialMatch.score_b || 0 
  });
  const [events, setEvents] = useState([]); // Start empty, fetch history if needed
  const [clock, setClock] = useState(initialMatch.game_clock || '00:00');
  const [customMsg, setCustomMsg] = useState('');

  // --- REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    // 1. Fetch existing events first (Optional, but good for history)
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', initialMatch.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setEvents(data);
    };
    fetchHistory();

    // 2. Set up Real-time Listener
    const channel = supabase
      .channel(`match:${initialMatch.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'match_events',
        filter: `match_id=eq.${initialMatch.id}` 
      }, (payload) => {
        // Handle incoming new event from OTHER users (or ourselves if we want to confirm)
        const newEvent = payload.new;
        setEvents(prev => [newEvent, ...prev]);
        
        // Update score from event metadata if needed
        // (Note: Usually easier to rely on local state for instant feedback, 
        // but this keeps multiple users in sync)
      })
      .subscribe();

    // 3. CLEANUP: This stops the infinite loop
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialMatch.id]); // ONLY run when match ID changes

  // --- ACTIONS ---
  const handleAction = async (type, teamId, scoreDelta = 0, msg) => {
    // 1. Optimistic Update (Immediate UI change)
    const timestamp = clock;
    const optimisticEvent = { 
      type, 
      timestamp, 
      message: msg || type,
      created_at: new Date().toISOString() // Fake timestamp for sort
    };
    
    // Update Score locally
    if (scoreDelta !== 0) {
      if (teamId === initialMatch.team_a_id) setScores(p => ({ ...p, a: p.a + scoreDelta }));
      else setScores(p => ({ ...p, b: p.b + scoreDelta }));
    }
    
    // Add to list locally
    setEvents(prev => [optimisticEvent, ...prev]);

    // 2. Send to API (Backend handles DB write)
    try {
      await fetch('/api/matches/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: initialMatch.id,
          type,
          teamId,
          timestamp,
          message: msg || type,
          scoreDelta
        })
      });
    } catch (err) {
      console.error("Failed to sync event", err);
      // Optional: Rollback state here if needed
    }
  };

  // --- STYLES ---
  const btnBase = "h-14 w-full font-bold uppercase rounded-lg shadow-lg transition-all active:scale-95 text-xs md:text-sm";
  const btnGreen = `${btnBase} bg-emerald-600 hover:bg-emerald-500 text-white`;
  const btnRed = `${btnBase} bg-rose-600 hover:bg-rose-500 text-white`;
  const btnNeutral = `${btnBase} bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600`;

  // --- RENDERERS ---
  const renderControls = (teamId) => {
    if (sport === 'football') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={() => handleAction('goal', teamId, 1, 'GOAL!')} className={`${btnGreen} col-span-2`}>Goal (+1)</button>
          <button onClick={() => handleAction('shot', teamId, 0, 'Shot')} className={btnNeutral}>Shot</button>
          <button onClick={() => handleAction('corner', teamId, 0, 'Corner')} className={btnNeutral}>Corner</button>
          <button onClick={() => handleAction('yellow', teamId, 0, 'Yellow Card')} className="h-14 bg-yellow-500 text-black font-bold rounded">Yellow</button>
          <button onClick={() => handleAction('red', teamId, 0, 'Red Card')} className={btnRed}>Red</button>
        </div>
      );
    }
    // ... (Keep your basketball/cricket logic here)
    return <div className="text-slate-500 text-sm">Controls for {sport}</div>;
  };

  return (
    <div className="bg-slate-900 min-h-screen p-2 md:p-6 text-white max-w-7xl mx-auto">
      {/* HEADER SCOREBOARD */}
      <div className="bg-slate-800 rounded-xl p-4 md:p-8 border border-slate-700 flex justify-between items-center mb-6 shadow-2xl">
        <div className="text-center w-1/3">
          <h2 className="text-lg md:text-2xl font-bold text-slate-300 truncate px-2">{initialMatch.tournaments?.name || 'Tournament'}</h2>
          <div className="text-5xl md:text-7xl font-mono text-emerald-400 mt-2 font-black">{scores.a}</div>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Home</p>
        </div>
        
        <div className="flex flex-col items-center w-1/3">
          <input 
            value={clock} 
            onChange={(e) => setClock(e.target.value)}
            className="bg-black text-red-500 font-mono text-3xl md:text-5xl text-center w-full max-w-[140px] rounded border border-slate-600 p-2 shadow-inner"
          />
          <span className="text-xs uppercase text-slate-500 mt-3 font-bold tracking-widest">Game Clock</span>
        </div>

        <div className="text-center w-1/3">
           {/* If you have team names in the joined data, use them here */}
          <h2 className="text-lg md:text-2xl font-bold text-slate-300 truncate px-2">Away</h2>
          <div className="text-5xl md:text-7xl font-mono text-blue-400 mt-2 font-black">{scores.b}</div>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Away</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TEAM A */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-slate-400 font-bold uppercase text-sm border-b border-slate-700 pb-2 mb-2">Home Controls</h3>
          {renderControls(initialMatch.team_a_id)}
        </div>

        {/* FEED */}
        <div className="flex flex-col gap-4 h-[500px]">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-800 border border-slate-600 rounded p-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Type commentary..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAction('message', null, 0, customMsg)}
            />
            <button 
              onClick={() => { handleAction('message', null, 0, customMsg); setCustomMsg(''); }}
              className="bg-blue-600 px-6 rounded text-white font-bold hover:bg-blue-500 transition-colors shadow-lg"
            >
              Post
            </button>
          </div>

          <div className="flex-1 bg-slate-900/50 rounded-xl p-4 overflow-y-auto border border-slate-800 shadow-inner scrollbar-thin scrollbar-thumb-slate-700">
            {events.map((ev, i) => (
              <div key={i} className="mb-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-mono text-xs mt-1 min-w-[40px]">{ev.timestamp}</span>
                  <div className="bg-slate-800 p-2 rounded-r-lg rounded-bl-lg border-l-2 border-emerald-500 flex-1">
                    <p className="text-slate-200 text-sm">{ev.message}</p>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <p>No events yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* TEAM B */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-slate-400 font-bold uppercase text-sm border-b border-slate-700 pb-2 mb-2">Away Controls</h3>
          {renderControls(initialMatch.team_b_id)}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchConsole;