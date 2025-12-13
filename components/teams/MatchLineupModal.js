import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Save, User, Shirt, AlertCircle } from 'lucide-react';

// Coordinates for formations (Simple percentages for Top/Left)
const FORMATIONS = {
  '4-4-2': [
    { id: 'GK', top: '88%', left: '50%' },
    { id: 'LB', top: '70%', left: '15%' }, { id: 'CB1', top: '75%', left: '38%' }, { id: 'CB2', top: '75%', left: '62%' }, { id: 'RB', top: '70%', left: '85%' },
    { id: 'LM', top: '45%', left: '15%' }, { id: 'CM1', top: '50%', left: '38%' }, { id: 'CM2', top: '50%', left: '62%' }, { id: 'RM', top: '45%', left: '85%' },
    { id: 'ST1', top: '20%', left: '35%' }, { id: 'ST2', top: '20%', left: '65%' },
  ],
  '4-3-3': [
    { id: 'GK', top: '88%', left: '50%' },
    { id: 'LB', top: '70%', left: '15%' }, { id: 'CB1', top: '75%', left: '38%' }, { id: 'CB2', top: '75%', left: '62%' }, { id: 'RB', top: '70%', left: '85%' },
    { id: 'CM1', top: '50%', left: '30%' }, { id: 'CM2', top: '55%', left: '50%' }, { id: 'CM3', top: '50%', left: '70%' },
    { id: 'LW', top: '25%', left: '20%' }, { id: 'ST', top: '15%', left: '50%' }, { id: 'RW', top: '25%', left: '80%' },
  ]
};

export default function MatchLineupModal({ match, teamId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState([]); // All available players
  const [lineup, setLineup] = useState({}); // { 'GK': playerId, 'ST': playerId }
  const [formation, setFormation] = useState('4-4-2');
  const [selectedSpot, setSelectedSpot] = useState(null); // Which spot on pitch is being clicked?

  useEffect(() => {
    fetchData();
  }, [match]);

  const fetchData = async () => {
    try {
      // 1. Get All Team Players
      const { data: players } = await supabase
        .from('team_members')
        .select('user_id, profiles(id, username, avatar_url, jersey_number, positions_preferred)')
        .eq('team_id', teamId)
        .eq('status', 'active');
      
      const formattedRoster = players.map(p => ({
        id: p.profiles.id,
        name: p.profiles.username,
        number: p.profiles.jersey_number,
        avatar: p.profiles.avatar_url,
        pos: p.profiles.positions_preferred
      }));
      setRoster(formattedRoster);

      // 2. CHECK: Is there already a lineup for THIS match?
      const { data: matchLineup } = await supabase
        .from('match_lineups')
        .select('*')
        .eq('match_id', match.id)
        .eq('team_id', teamId);

      if (matchLineup && matchLineup.length > 0) {
        // Load Saved Match Lineup
        const loadedMap = {};
        matchLineup.forEach(entry => {
           loadedMap[entry.position_code] = entry.player_id;
        });
        setLineup(loadedMap);
        // Assuming you store formation in match metadata, otherwise default 4-4-2
        if(match.metadata?.formation) setFormation(match.metadata.formation);
      } else {
        // 3. FALLBACK: Load Default Strategy (The "Strategy Page" Setup)
        const { data: defaultStrat } = await supabase
            .from('team_strategies')
            .select('formation, mapping')
            .eq('team_id', teamId)
            .eq('is_active', true) // or is_default
            .single();

        if (defaultStrat) {
            setFormation(defaultStrat.formation || '4-4-2');
            setLineup(defaultStrat.mapping || {});
        }
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (playerId) => {
    if (!selectedSpot) return;
    
    // Check if player is already playing elsewhere, if so, remove them from old spot
    const newLineup = { ...lineup };
    Object.keys(newLineup).forEach(key => {
        if (newLineup[key] === playerId) delete newLineup[key];
    });

    newLineup[selectedSpot] = playerId;
    setLineup(newLineup);
    setSelectedSpot(null);
  };

  const saveLineup = async () => {
    setSaving(true);
    try {
        // 1. Clear old entries for this match/team
        await supabase.from('match_lineups').delete().eq('match_id', match.id).eq('team_id', teamId);

        // 2. Prepare new rows
        const rows = Object.entries(lineup).map(([posCode, playerId]) => {
            const player = roster.find(r => r.id === playerId);
            return {
                match_id: match.id,
                team_id: teamId,
                player_id: playerId,
                position_code: posCode,
                jersey_number: player?.number || 0
            };
        });

        if (rows.length > 0) {
            const { error } = await supabase.from('match_lineups').insert(rows);
            if (error) throw error;
        }

        // Optional: Save formation to match metadata or separate table
        
        alert("Lineup submitted for this match!");
        onClose();
    } catch (e) {
        alert("Error saving: " + e.message);
    } finally {
        setSaving(false);
    }
  };

  const currentFormation = FORMATIONS[formation] || FORMATIONS['4-4-2'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Match Day Lineup</h2>
                <p className="text-sm text-gray-500">vs {match.opponent_name || 'Opponent'}</p>
            </div>
            <div className="flex items-center gap-3">
                <select 
                    value={formation} 
                    onChange={(e) => setFormation(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm font-bold py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="4-4-2">4-4-2 Classic</option>
                    <option value="4-3-3">4-3-3 Attack</option>
                </select>
                <button onClick={saveLineup} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                    <Save size={18} /> {saving ? 'Saving...' : 'Submit Lineup'}
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><X size={24}/></button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT: THE PITCH */}
            <div className="flex-1 bg-gray-900 relative overflow-hidden flex items-center justify-center p-6">
                {/* CSS Pitch Art */}
                <div className="w-full max-w-2xl aspect-[3/4] bg-emerald-600 rounded-xl border-4 border-white/20 relative shadow-2xl box-content">
                    {/* Pitch Patterns */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,transparent_50%)] bg-[length:100%_10%]"></div>
                    <div className="absolute top-0 left-0 right-0 h-1/2 border-b-2 border-white/20"></div> {/* Halfway line */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full"></div> {/* Center Circle */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-white/20 border-t-0 bg-white/5"></div> {/* Penalty Box Top */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-white/20 border-b-0 bg-white/5"></div> {/* Penalty Box Bottom */}

                    {/* PLAYERS ON PITCH */}
                    {currentFormation.map((pos) => {
                        const playerId = lineup[pos.id];
                        const player = roster.find(r => r.id === playerId);
                        const isSelected = selectedSpot === pos.id;

                        return (
                            <div 
                                key={pos.id}
                                onClick={() => setSelectedSpot(pos.id)}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-200 ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'}`}
                                style={{ top: pos.top, left: pos.left }}
                            >
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg relative ${playerId ? 'bg-white border-indigo-500' : 'bg-emerald-800/80 border-white/30 dashed-border'}`}>
                                    {player ? (
                                        player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" /> 
                                        : <span className="font-bold text-gray-800 text-xs">{player.number || '#'}</span>
                                    ) : (
                                        <Shirt size={18} className="text-white/50" />
                                    )}
                                    {/* Position Badge */}
                                    <div className="absolute -top-2 -right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20">
                                        {pos.id.replace(/[0-9]/g, '')}
                                    </div>
                                </div>
                                <div className="mt-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${isSelected ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'}`}>
                                        {player?.name || 'Empty'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: THE ROSTER SIDEBAR */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                        {selectedSpot ? `Select for ${selectedSpot}` : 'Team Roster'}
                    </h3>
                    {selectedSpot && <p className="text-xs text-indigo-600 mt-1">Pick a player below to place them.</p>}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {roster.map(player => {
                        // Is player already on pitch?
                        const isUsed = Object.values(lineup).includes(player.id);
                        
                        return (
                            <button
                                key={player.id}
                                disabled={isUsed && !selectedSpot} // Can't pick if used, unless swapping logic added (simple version: disable)
                                onClick={() => handlePlayerSelect(player.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                    isUsed 
                                    ? 'opacity-50 grayscale bg-gray-50' 
                                    : 'hover:bg-indigo-50 hover:border-indigo-200 border border-transparent'
                                }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-500">
                                    {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover"/> : player.number}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-gray-800 truncate">{player.name}</p>
                                    <p className="text-xs text-gray-400">{Array.isArray(player.pos) ? player.pos[0] : player.pos || 'Player'}</p>
                                </div>
                                {isUsed && <div className="text-[10px] font-bold bg-gray-200 text-gray-500 px-1.5 rounded">ON</div>}
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}