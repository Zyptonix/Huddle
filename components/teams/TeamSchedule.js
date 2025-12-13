import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, MapPin, Shield } from 'lucide-react';
import MatchLineupModal from './MatchLineupModal'; // <--- IMPORT IT

export default function TeamSchedule({ teamId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW STATE FOR MODAL
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      // ... (Keep your existing fetch logic here) ...
      // Assuming you fetched matches successfully:
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          tournaments ( name ),
          team_a:team_a_id ( name, logo_url ),
          team_b:team_b_id ( name, logo_url )
        `)
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .eq('status', 'scheduled') 
        .order('date', { ascending: true });
        
      if(data) setMatches(data);
      setLoading(false);
    };

    if (teamId) fetchMatches();
  }, [teamId]);

  if (loading) return <div className="p-4 text-gray-400">Loading schedule...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Calendar className="text-indigo-600"/> Upcoming Matches
      </h3>

      {matches.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">
          No upcoming matches scheduled.
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => {
            const isHome = match.team_a_id === teamId;
            const opponent = isHome ? match.team_b : match.team_a;
            
            return (
              <div key={match.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                
                {/* Match Info Section (Keep existing code) */}
                <div className="flex items-center gap-6 mb-4 md:mb-0 w-full md:w-auto">
                    {/* ... Date, Time, Opponent Name ... */}
                    <div className="flex flex-col items-center w-16">
                        <span className="text-2xl font-black text-gray-800">{new Date(match.date).getDate()}</span>
                    </div>
                    <div className="font-bold text-gray-900">{opponent?.name || 'TBD'}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                     <MapPin size={12}/> {match.venue_name || 'Venue TBD'}
                  </div>
                  
                  {/* BUTTON TRIGGER */}
                  <button 
                    onClick={() => setSelectedMatch(match)} // <--- Open Modal
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm shadow-indigo-200"
                  >
                    Set Lineup
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RENDER MODAL IF OPEN */}
      {selectedMatch && (
        <MatchLineupModal 
            match={selectedMatch} 
            teamId={teamId} 
            onClose={() => setSelectedMatch(null)} 
        />
      )}
    </div>
  );
}