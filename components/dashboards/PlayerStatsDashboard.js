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
      fetchPlayerStats();
    }
  }, [playerId, selectedSport]);

  const fetchPlayerStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Events (Goals, Cards, etc.) linked to Matches & Tournaments
      const { data: eventsData, error: eventsError } = await supabase
        .from('match_events')
        .select(`
            id,
            type,
            metadata,
            created_at,
            matches (
                id,
                tournaments ( name, sport )
            )
        `)
        .eq('player_id', playerId);

      if (eventsError) throw eventsError;

      // 2. Fetch Lineups (To count "Matches Played")
      const { data: lineupData, error: lineupError } = await supabase
        .from('match_lineups')
        .select(`
            id, 
            matches (
                id,
                tournaments ( sport )
            )
        `)
        .eq('player_id', playerId);

      if (lineupError) throw lineupError;

      // 3. Filter by Selected Sport
      const filteredEvents = eventsData.filter(e => {
          const sport = e.matches?.tournaments?.sport || '';
          return sport.toLowerCase() === selectedSport.toLowerCase();
      });

      const filteredMatches = lineupData.filter(m => {
          const sport = m.matches?.tournaments?.sport || '';
          return sport.toLowerCase() === selectedSport.toLowerCase();
      });

      // 4. Process the Stats
      setStats(calculateStats(selectedSport, filteredEvents, filteredMatches.length));
      
      // 5. Set Recent Activity (Last 5 events)
      setRecentEvents(filteredEvents
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      );

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sport, events, matchesCount) => {
    const initialStats = { matches: matchesCount };
    const s = sport.toLowerCase();

    if (s === 'football') {
        let goals = 0, assists = 0, yellow = 0, red = 0;
        events.forEach(e => {
            const type = (e.type || '').toLowerCase();
            if (type.includes('goal')) goals++;
            if (type.includes('assist')) assists++;
            if (type.includes('yellow')) yellow++;
            if (type.includes('red')) red++;
        });
        return { ...initialStats, goals, assists, yellow_cards: yellow, red_cards: red };
    } 
    else if (s === 'basketball') {
        let points = 0, rebounds = 0, assists = 0;
        events.forEach(e => {
            const type = (e.type || '').toLowerCase();
            const meta = e.metadata || {};
            // Check metadata for points, otherwise guess by type
            let p = parseInt(meta.points || 0);
            if (p === 0) {
                 if (type.includes('3pt')) p = 3;
                 else if (type.includes('free') || type.includes('ft')) p = 1;
                 else if (type.includes('score') || type.includes('goal')) p = 2;
            }
            points += p;
            if (type.includes('rebound')) rebounds++;
            if (type.includes('assist')) assists++;
        });
        return { ...initialStats, points, rebounds, assists };
    } 
    else if (s === 'cricket') {
        let runs = 0, wickets = 0, catches = 0;
        events.forEach(e => {
            const type = (e.type || '').toLowerCase();
            const meta = e.metadata || {};
            let r = parseInt(meta.runs || 0);
            if (r === 0) {
                if (type.includes('six')) r = 6;
                else if (type.includes('four')) r = 4;
            }
            runs += r;
            if (type.includes('wicket') || type.includes('out')) wickets++;
            if (type.includes('catch')) catches++;
        });
        return { ...initialStats, runs, wickets, catches };
    }
    return initialStats;
  };

  const renderStatCards = () => {
    if (!stats) return null;
    
    // Football Cards
    if (selectedSport === 'football') {
        return (
            <>
                <StatBox icon={<Trophy size={20} className="text-emerald-600"/>} value={stats.goals} label="Goals" color="emerald" />
                <StatBox icon={<Activity size={20} className="text-blue-600"/>} value={stats.matches} label="Matches" color="blue" />
                <StatBox icon={<div className="w-4 h-5 bg-yellow-400 rounded border border-yellow-500 shadow-sm"/>} value={stats.yellow_cards} label="Yellows" color="yellow" />
                <StatBox icon={<div className="w-4 h-5 bg-red-600 rounded border border-red-700 shadow-sm"/>} value={stats.red_cards} label="Reds" color="red" />
            </>
        );
    } 
    // Cricket Cards
    else if (selectedSport === 'cricket') {
        return (
            <>
                <StatBox icon={<Zap size={20} className="text-orange-600"/>} value={stats.runs} label="Runs" color="orange" />
                <StatBox icon={<Activity size={20} className="text-blue-600"/>} value={stats.matches} label="Matches" color="blue" />
                <StatBox icon={<Target size={20} className="text-red-600"/>} value={stats.wickets} label="Wickets" color="red" />
                <StatBox icon={<Hand size={20} className="text-purple-600"/>} value={stats.catches} label="Catches" color="purple" />
            </>
        );
    } 
    // Basketball Cards
    else if (selectedSport === 'basketball') {
        return (
            <>
                <StatBox icon={<Target size={20} className="text-orange-600"/>} value={stats.points} label="Points" color="orange" />
                <StatBox icon={<Activity size={20} className="text-blue-600"/>} value={stats.matches} label="Matches" color="blue" />
                <StatBox icon={<Hand size={20} className="text-green-600"/>} value={stats.rebounds} label="Rebounds" color="green" />
                <StatBox icon={<Zap size={20} className="text-yellow-600"/>} value={stats.assists} label="Assists" color="yellow" />
            </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sport Selector */}
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
            [1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-50 rounded-xl animate-pulse"/>)
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
                <div className="mt-1 bg-gray-100 p-2 rounded-full">
                  <Activity size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 capitalize">
                    {ev.type.replace('_', ' ')}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Calendar size={12} />
                    <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                    {ev.matches?.tournaments?.name && (
                         <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
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