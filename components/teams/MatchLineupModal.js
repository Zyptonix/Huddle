import { useState, useEffect } from 'react';
import { X, Save, User, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function MatchLineupModal({ match, teamId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState([]);
  const [lineup, setLineup] = useState({});

  // 1. DETERMINE SPORT
  const sportType = match.tournaments?.sport || match.sport || 'football';

  // 2. CONFIGURATION
  const SPORT_CONFIG = {
    football: {
      label: 'Football (5v5)',
      fieldClass: 'bg-emerald-600',
      fieldDecor: (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"></div>
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/30 -translate-y-1/2"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-b-2 border-x-2 border-white/30 rounded-b-lg"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-t-2 border-x-2 border-white/30 rounded-t-lg"></div>
        </>
      ),
      positions: [
        { key: 'gk', label: 'GK', x: 50, y: 88 },
        { key: 'def_l', label: 'DEF', x: 20, y: 65 },
        { key: 'def_r', label: 'DEF', x: 80, y: 65 },
        { key: 'mid', label: 'MID', x: 50, y: 45 },
        { key: 'fwd', label: 'FWD', x: 50, y: 15 },
      ]
    },
    basketball: {
      label: 'Basketball',
      fieldClass: 'bg-orange-100',
      fieldDecor: (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-orange-800/30 rounded-full flex items-center justify-center"><div className="w-full h-0.5 bg-orange-800/30"></div></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 border-b-2 border-x-2 border-orange-800/30 bg-orange-200/50"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-24 border-t-2 border-x-2 border-orange-800/30 bg-orange-200/50"></div>
        </>
      ),
      positions: [
        { key: 'pg', label: 'PG', x: 50, y: 75 },
        { key: 'sg', label: 'SG', x: 20, y: 60 },
        { key: 'sf', label: 'SF', x: 80, y: 60 },
        { key: 'pf', label: 'PF', x: 30, y: 30 },
        { key: 'c', label: 'C', x: 70, y: 30 },
      ]
    },
    cricket: {
      label: 'Cricket',
      fieldClass: 'bg-green-600 rounded-[50%]',
      fieldDecor: (
        <>
          <div className="absolute inset-2 border-2 border-white/50 rounded-[50%] border-dashed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-32 bg-yellow-100 border border-yellow-200 shadow-sm"></div>
        </>
      ),
      positions: [
        { key: 'wk', label: 'WK', x: 50, y: 75 },
        { key: 'bowler', label: 'BWL', x: 50, y: 25 },
        { key: 'slip1', label: 'SLIP', x: 65, y: 78 },
        { key: 'point', label: 'PT', x: 85, y: 50 },
        { key: 'cover', label: 'CVR', x: 80, y: 35 },
        { key: 'mid_off', label: 'M.OFF', x: 60, y: 15 },
        { key: 'mid_on', label: 'M.ON', x: 40, y: 15 },
        { key: 'mid_wkt', label: 'MID.W', x: 20, y: 35 },
        { key: 'sq_leg', label: 'SQ.L', x: 15, y: 50 },
        { key: 'fine_leg', label: 'F.L', x: 25, y: 80 },
        { key: 'third_man', label: '3RD', x: 75, y: 85 },
      ]
    }
  };

  const currentConfig = SPORT_CONFIG[sportType] || SPORT_CONFIG['football'];

  useEffect(() => {
    if (match?.id && teamId) {
        fetchData();
    } else {
        console.error("Missing match ID or Team ID");
        setLoading(false);
    }
  }, [match, teamId]);

  const fetchData = async () => {
    try {
      // Fetch Roster
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          user_id, role,
          profiles:user_id ( id, username, avatar_url, jersey_number )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      const formattedRoster = members?.map(m => ({
        id: m.profiles.id,
        name: m.profiles.username,
        number: m.profiles.jersey_number,
        avatar: m.profiles.avatar_url,
        role: m.role
      })) || [];
      
      setRoster(formattedRoster);

      // Fetch Existing Lineup
      const { data: existingLineup, error } = await supabase
        .from('match_lineups')
        .select('positions_json')
        .eq('match_id', match.id)
        .eq('team_id', teamId)
        .maybeSingle();

      if (error) console.error("Fetch error:", error);
      if (existingLineup?.positions_json) {
        setLineup(existingLineup.positions_json);
      }
    } catch (error) {
      console.error('Error fetching lineup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (positionKey, playerId) => {
    // If selecting "Select Player" (empty string), just remove the key
    if (!playerId) {
        const newLineup = { ...lineup };
        delete newLineup[positionKey];
        setLineup(newLineup);
        return;
    }

    setLineup(prev => ({
      ...prev,
      [positionKey]: playerId
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Validate: Ensure match_id and team_id are present
      if (!match.id || !teamId) throw new Error("Invalid Match or Team ID");

      const payload = {
        match_id: match.id,
        team_id: teamId,
        positions_json: lineup
      };

      // 2. Upsert
      const { error } = await supabase
        .from('match_lineups')
        .upsert(payload, { onConflict: 'match_id, team_id' }); // This string must match the Constraint Columns

      if (error) throw error;
      onClose();
      alert('Lineup saved successfully!');
    } catch (error) {
      alert('Failed to save lineup: ' + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getPlayer = (id) => roster.find(p => p.id === id);

  // --- LOGIC TO DISABLE SELECTED PLAYERS ---
  const assignedPlayerIds = Object.values(lineup);

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
             <h3 className="font-bold text-lg text-gray-900">Set Lineup</h3>
             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{currentConfig.label}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* VISUAL FIELD */}
          <div className="flex-1 bg-gray-900 p-6 relative overflow-y-auto min-h-[400px]">
            <div className={`relative w-full max-w-md mx-auto aspect-[3/4] ${currentConfig.fieldClass} rounded-xl shadow-inner border-2 border-black/10 overflow-hidden`}>
              {currentConfig.fieldDecor}

              {currentConfig.positions.map((pos) => {
                const assignedPlayerId = lineup[pos.key];
                const player = getPlayer(assignedPlayerId);

                return (
                  <div 
                    key={pos.key}
                    className="absolute flex flex-col items-center gap-1 w-24 transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="relative group w-full flex flex-col items-center">
                        <select 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                            value={assignedPlayerId || ""}
                            onChange={(e) => handlePlayerSelect(pos.key, e.target.value)}
                        >
                            <option value="">Select Player</option>
                            {roster.map(p => {
                                // Disable if player is assigned anywhere AND it's not the current position
                                const isAssignedElsewhere = assignedPlayerIds.includes(p.id) && lineup[pos.key] !== p.id;
                                return (
                                    <option key={p.id} value={p.id} disabled={isAssignedElsewhere}>
                                        {p.number ? `#${p.number} ` : ''}{p.name} {isAssignedElsewhere ? '(Picked)' : ''}
                                    </option>
                                );
                            })}
                        </select>

                        <div className={`w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center overflow-hidden bg-white transition-transform group-hover:scale-110
                            ${player ? 'border-indigo-500' : 'border-white/50 border-dashed bg-white/10 text-white'}`}
                        >
                            {player ? (
                                player.avatar ? 
                                <img src={player.avatar} className="w-full h-full object-cover" /> 
                                : <span className="font-bold text-indigo-800">{player.number || player.name[0]}</span>
                            ) : (
                                <User size={20} />
                            )}
                        </div>

                        <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20 pointer-events-none">
                            {pos.label}
                        </div>
                    </div>

                    <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full truncate max-w-full text-center border border-white/10 pointer-events-none">
                        {player ? player.name : "Empty"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full md:w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
             <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Shield size={16} /> Squad List</h4>
             <div className="space-y-2">
                {currentConfig.positions.map(pos => {
                    const assignedId = lineup[pos.key];
                    const player = getPlayer(assignedId);
                    return (
                        <div key={pos.key} className={`flex items-center justify-between p-2 rounded-lg border ${player ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                                     {pos.label}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-xs text-gray-500 font-semibold">{pos.key.toUpperCase()}</span>
                                     <span className={`text-sm font-bold truncate max-w-[120px] ${player ? 'text-indigo-900' : 'text-gray-400 italic'}`}>
                                         {player ? player.name : 'Unassigned'}
                                     </span>
                                 </div>
                             </div>
                             {player && (
                                 <button onClick={() => handlePlayerSelect(pos.key, "")} className="text-gray-400 hover:text-red-500 p-1"><X size={14}/></button>
                             )}
                        </div>
                    )
                })}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg">Cancel</button>
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 disabled:opacity-50"
           >
             <Save size={16} /> {saving ? 'Saving...' : 'Save Lineup'}
           </button>
        </div>
      </div>
    </div>
  );
}