import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import Layout from '../../../components/ui/Layout';
import { Shield, Save, Users, CheckCircle, ChevronLeft } from 'lucide-react';

export default function ManageLineup() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [squad, setSquad] = useState([]);
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      // 1. Get Match Info
      const { data: matchData } = await supabase.from('matches')
        .select('*, teams_a:team_a_id(name), teams_b:team_b_id(name)')
        .eq('id', id).single();
      setMatch(matchData);

      // 2. Get User's Team (Hardcoded to Team A for demo. In real app, check user's team_id)
      const teamId = matchData.team_a_id; 

      // 3. Fetch Squad
      const { data: players } = await supabase
        .from('team_members')
        .select('profiles(id, username, jersey_number, avatar_url)')
        .eq('team_id', teamId);
      
      const formattedSquad = players?.map(p => p.profiles) || [];
      setSquad(formattedSquad);

      // 4. Fetch Existing Lineup (if editing)
      const { data: existingLineup } = await supabase.from('match_lineups')
        .select('player_id')
        .eq('match_id', id)
        .eq('team_id', teamId);
      
      if (existingLineup?.length > 0) {
        setStarters(existingLineup.map(l => l.player_id));
      }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const toggleStarter = (playerId) => {
    if (starters.includes(playerId)) {
      setStarters(starters.filter(id => id !== playerId));
    } else {
      if (starters.length >= 11) return alert("Max 11 starters!");
      setStarters([...starters, playerId]);
    }
  };

  const submitLineup = async () => {
    const teamId = match.team_a_id; 
    const lineupData = starters.map(playerId => ({
      match_id: match.id,
      team_id: teamId,
      player_id: playerId,
      is_starter: true,
      jersey_number: squad.find(p => p.id === playerId)?.jersey_number || 0
    }));

    // Clear old lineup and save new
    await supabase.from('match_lineups').delete().eq('match_id', match.id).eq('team_id', teamId);
    const { error } = await supabase.from('match_lineups').insert(lineupData);

    if (!error) {
      alert("Lineup Submitted Successfully!");
      router.push(`/match/${id}`);
    } else {
      alert("Error saving lineup");
    }
  };

  if (loading) return <Layout dark={true}><div className="p-10 text-white">Loading Squad...</div></Layout>;

  return (
    <Layout dark={true}>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
            <ChevronLeft size={16} /> Back to Match
          </button>

          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-white">
            <Shield className="text-emerald-500" /> Tactical Board
          </h1>
          <p className="text-slate-400 mb-8">Select your starting XI for {match.teams_a.name} vs {match.teams_b.name}.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* SQUAD LIST */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-200">Available Squad</h3>
                <span className="text-xs font-bold text-slate-500 uppercase">{squad.length} Players</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {squad.map(player => (
                  <div 
                    key={player.id} 
                    onClick={() => toggleStarter(player.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${starters.includes(player.id) ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                        {player.jersey_number || '#'}
                      </div>
                      <span className={starters.includes(player.id) ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {player.username}
                      </span>
                    </div>
                    {starters.includes(player.id) && <CheckCircle size={18} className="text-emerald-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* PITCH VISUALIZER */}
            <div className="flex flex-col">
               <div className="bg-emerald-900/20 border-2 border-emerald-500/20 rounded-xl p-6 flex-1 relative min-h-[500px] shadow-2xl backdrop-blur-sm">
                  {/* Pitch Markings */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                     <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white"></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white"></div>
                  </div>

                  <h3 className="font-bold text-emerald-400 text-center mb-6 relative z-10">
                    Starting XI ({starters.length}/11)
                  </h3>
                  
                  <div className="flex flex-wrap justify-center gap-3 relative z-10">
                    {starters.length === 0 && <p className="text-center text-slate-500 w-full mt-20">Click players to add them to the pitch.</p>}
                    {squad.filter(p => starters.includes(p.id)).map(p => (
                       <div key={p.id} className="flex flex-col items-center animate-scaleIn">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center font-bold text-xs shadow-lg">
                            {p.jersey_number}
                          </div>
                          <span className="text-[10px] font-bold text-white bg-black/50 px-2 rounded mt-1">{p.username}</span>
                       </div>
                    ))}
                  </div>
               </div>
               
               <button 
                onClick={submitLineup}
                disabled={starters.length === 0}
                className="w-full mt-6 bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Save size={20} /> Confirm Lineup
               </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}