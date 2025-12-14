import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, MapPin, Shield, Clock, ChevronRight, Users } from 'lucide-react';
import MatchLineupModal from './MatchLineupModal';

export default function TeamSchedule({ teamId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. STATE: Track if the current user has permission
  const [isManager, setIsManager] = useState(false);
  
  const [selectedMatch, setSelectedMatch] = useState(null);

  // 2. EFFECT: Check User Permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('team_members') 
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();

        if (data) {
          const allowedRoles = ['owner', 'coach', 'captain'];
          if (allowedRoles.includes(data.role)) {
            setIsManager(true);
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    if (teamId) checkPermissions();
  }, [teamId]);

  // 3. EFFECT: Fetch Matches
  useEffect(() => {
    const fetchMatches = async () => {
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

  // Helper to format time (e.g. "14:00")
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <span className="text-sm font-medium">Loading schedule...</span>
    </div>
  );

  return (
    <div className="bg-white min-h-[400px]">
      {/* Header inside the tab */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
         <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20}/> Upcoming Fixtures
            </h3>
            <p className="text-sm text-gray-500 font-medium">Next matches and lineup management</p>
         </div>
         <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
            {matches.length} Scheduled
         </span>
      </div>

      <div className="p-6">
        {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Calendar className="text-gray-300" size={32} />
                </div>
                <h4 className="text-gray-900 font-bold mb-1">No matches scheduled</h4>
                <p className="text-gray-500 text-sm">Your upcoming fixtures will appear here once confirmed.</p>
            </div>
        ) : (
            <div className="space-y-4">
            {matches.map((match) => {
                const isHome = match.team_a_id === teamId;
                const opponent = isHome ? match.team_b : match.team_a;
                const matchDate = new Date(match.date);
                
                return (
                <div key={match.id} className="group relative bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        
                        {/* Date Badge */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-0.5 group-hover:text-indigo-400">
                                    {matchDate.toLocaleString('default', { month: 'short' })}
                                </span>
                                <span className="text-3xl font-black text-slate-800 leading-none group-hover:text-indigo-700">
                                    {matchDate.getDate()}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 mt-1 group-hover:text-indigo-400">
                                    {formatTime(match.date)}
                                </span>
                            </div>
                        </div>

                        {/* Match Details */}
                        <div className="flex-grow flex flex-col items-center md:items-start text-center md:text-left w-full">
                            <div className="inline-flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wide">
                                    {match.tournaments?.name || 'Friendly'}
                                </span>
                                {match.venue_name && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                        <MapPin size={10}/> {match.venue_name}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">
                                    {opponent?.logo_url ? 
                                        <img src={opponent.logo_url} className="w-full h-full rounded-full object-cover"/> : 
                                        <Shield size={14}/>
                                    }
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs font-bold uppercase block mb-0.5">Vs Opponent</span>
                                    <h4 className="text-xl font-black text-gray-800 leading-tight">
                                        {opponent?.name || 'TBD'}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                            {isManager ? (
                                <button 
                                    onClick={() => setSelectedMatch(match)}
                                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white pl-5 pr-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200 group-hover:scale-105 active:scale-95"
                                >
                                    <Users size={16} />
                                    Set Lineup
                                    <ChevronRight size={16} className="opacity-50" />
                                </button>
                            ) : (
                                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                    <span className="text-xs font-bold text-gray-400">Lineup Pending</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </div>

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