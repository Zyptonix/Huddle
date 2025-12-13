// pages/teams/[id]/strategy.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient'; // Adjust path
import Layout from '../../../components/ui/Layout';
import { Shield, Save, CheckCircle, ChevronLeft } from 'lucide-react';

export default function TeamStrategy() {
  const router = useRouter();
  const { id: teamId } = router.query; // This is the TEAM ID, not match ID
  const [squad, setSquad] = useState([]);
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const fetchData = async () => {
      // 1. Fetch Squad
      const { data: players } = await supabase
        .from('team_members')
        .select('profiles(id, username, jersey_number, avatar_url)')
        .eq('team_id', teamId);
      
      const formattedSquad = players?.map(p => p.profiles) || [];
      setSquad(formattedSquad);

      // 2. Fetch Existing "Default XI" from Tactics table
      const { data: tactic } = await supabase
        .from('tactics')
        .select('data')
        .eq('team_id', teamId)
        .eq('name', 'Default XI') // We look for a tactic specifically named this
        .single();
      
      if (tactic?.data?.starter_ids) {
        setStarters(tactic.data.starter_ids);
      }

      setLoading(false);
    };
    fetchData();
  }, [teamId]);

  const toggleStarter = (playerId) => {
    if (starters.includes(playerId)) {
      setStarters(starters.filter(id => id !== playerId));
    } else {
      if (starters.length >= 11) return alert("Max 11 starters!");
      setStarters([...starters, playerId]);
    }
  };

  const saveDefaultStrategy = async () => {
    const payload = {
      name: 'Default XI',
      team_id: teamId,
      creator_id: (await supabase.auth.getUser()).data.user.id, // Current user
      data: { starter_ids: starters }, // Storing IDs in the JSONB column
      is_public: false
    };

    // Upsert (Insert or Update if exists) based on ID is tricky without an ID.
    // For simplicity, we delete old 'Default XI' and insert new.
    await supabase.from('tactics').delete().eq('team_id', teamId).eq('name', 'Default XI');
    const { error } = await supabase.from('tactics').insert(payload);

    if (!error) {
      alert("Default Starting XI Saved!");
      router.back();
    } else {
      console.error(error);
      alert("Error saving strategy.");
    }
  };

  if (loading) return <Layout dark={true}><div className="p-10 text-white">Loading...</div></Layout>;

  return (
    <Layout dark={true}>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2">
            <Shield className="text-blue-500" /> Default Starting XI
          </h1>
          <button onClick={saveDefaultStrategy} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
            <Save size={18} /> Save Default
          </button>
        </div>
        <p className="text-slate-400 mb-8">Set the players who will automatically start in every new match.</p>

        {/* --- Reuse your Squad List & Pitch UI from the previous code here --- */}
        {/* Simplified View for brevity: */}
        <div className="grid grid-cols-2 gap-4">
            {squad.map(player => (
                <div key={player.id} onClick={() => toggleStarter(player.id)} 
                     className={`p-3 rounded border cursor-pointer ${starters.includes(player.id) ? 'bg-blue-900 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                    {player.jersey_number} - {player.username}
                    {starters.includes(player.id) && <CheckCircle className="float-right text-blue-400" size={16}/>}
                </div>
            ))}
        </div>
      </div>
    </Layout>
  );
}