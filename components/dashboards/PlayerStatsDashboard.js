import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trophy, Activity, Calendar, Zap, Target, Hand } from 'lucide-react';
import Card from '../ui/Card';

export default function PlayerStatsDashboard({ playerId }) {
  const [selectedSport, setSelectedSport] = useState('football');
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId) {
      fetchStats();
      fetchRecentActivity();
    }
  }, [playerId, selectedSport]); // Re-fetch when sport changes

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_player_stats', { 
            target_player_id: playerId,
            target_sport: selectedSport 
        });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent events only for the selected sport
      // We use !inner join to filter by the tournament's sport
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          type,
          message,
          created_at,
          matches!inner (
            id,
            date,
            tournaments!inner (name, sport)
          )
        `)
        .eq('player_id', playerId)
        .eq('matches.tournaments.sport', selectedSport)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  // Helper to render different stats based on sport
  const renderStatCards = () => {
    if (!stats) return null;

    if (selectedSport === 'football') {
        return (
            <>
                <StatBox icon={<Trophy size={20} className="text-emerald-600"/>} value={stats.goals || 0} label="Goals" color="emerald" />
                <StatBox icon={<Activity size={20} className="text-blue-600"/>} value={stats.matches || 0} label="Matches" color="blue" />
                <StatBox icon={<div className="w-4 h-5 bg-yellow-500 rounded border border-yellow-600"/>} value={stats.yellow_cards || 0} label="Yellows" color="yellow" />
                <StatBox icon={<div className="w-4 h-5 bg-red-600 rounded border border-red-700"/>} value={stats.red_cards || 0} label="Reds" color="red" />
            </>
        );
    } 
    else if (selectedSport === 'cricket') {
        return (
            <>
                <StatBox icon={<Zap size={20} className="text-orange-600"/>} value={stats.runs || 0} label="Runs" color="orange" />
                <StatBox icon={<Activity size={20} className="text-blue-600"/>} value={stats.matches || 0} label="Matches" color="blue" />
                <StatBox icon={<Target size={20} className="text-red-600"/>} value={stats.wickets || 0} label="Wickets" color="red" />
                <StatBox icon={<Hand size={20} className="text-purple-600"/>} value={stats.catches || 0} label="Catches" color="purple" />
            </>
        );
    } 
    else if (selectedSport === 'basketball') {
        return (
            <>
                <StatBox icon={<Target size={20} className="text-orange-600"/>} value={stats.points || 0} label="Points" color="orange" />
                <StatBox icon={<Activity size={20} className="text-blue-600"/>} value={stats.matches || 0} label="Matches" color="blue" />
                <StatBox icon={<Hand size={20} className="text-green-600"/>} value={stats.rebounds || 0} label="Rebounds" color="green" />
                <StatBox icon={<Zap size={20} className="text-yellow-600"/>} value={stats.assists || 0} label="Assists" color="yellow" />
            </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sport Selector Tabs  */}
      <div className="flex justify-center gap-2 mb-4 bg-gray-100 p-1 rounded-full w-fit mx-auto">
        {['football', 'cricket', 'basketball'].map(sport => (
            <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-6 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                    selectedSport === sport 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                {sport}
            </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
            [1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse"/>)
        ) : renderStatCards()}
      </div>

      {/* Recent Activity */}
      <Card title={`Recent ${selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Activity`}>
        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-4 text-gray-400">Loading activity...</div> 
          ) : recentEvents.length === 0 ? (
            <p className="text-gray-400 italic text-center py-4">No data available for {selectedSport}.</p>
          ) : (
            recentEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="mt-1">
                  <Activity size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 capitalize">
                    {ev.message || ev.type}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar size={12} />
                    <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                    {ev.matches?.tournaments?.name && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {ev.matches.tournaments.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// Reusable Stat Card Component
function StatBox({ icon, value, label, color }) {
    const colorStyles = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-100' },
        yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', iconBg: 'bg-yellow-100' },
        red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', iconBg: 'bg-red-100' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', iconBg: 'bg-orange-100' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', iconBg: 'bg-purple-100' },
        green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', iconBg: 'bg-green-100' },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`${style.bg} border ${style.border} p-4 rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105`}>
          <div className={`${style.iconBg} p-2 rounded-full mb-2`}>
            {icon}
          </div>
          <span className={`text-3xl font-black ${style.text}`}>{value}</span>
          <span className={`text-xs font-bold uppercase ${style.text} opacity-80 tracking-wider`}>{label}</span>
        </div>
    );
}