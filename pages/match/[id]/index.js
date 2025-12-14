import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/ui/Layout';
import { Clock, MapPin, BarChart3, List, Trophy, Zap, AlertTriangle, Hash, Calendar, User, Target, XCircle, Wifi } from 'lucide-react';

// --- 1. SUB-COMPONENTS ---

const MatchEvent = ({ event }) => {
  let icon, colorClass, messageClass;
  const type = event.type ? event.type.toLowerCase().trim() : '';

  // Generic/Football
  if (type === 'goal' || type === '3pt' || type === 'six' || type === 'four') {
    icon = <Trophy size={16} className="text-teal-600" />;
    colorClass = 'bg-teal-50 border-teal-200 text-teal-800';
    messageClass = 'font-extrabold text-gray-900';
  } else if (type.includes('yellow') || type === 'foul_p' || type === 'wide' || type === 'nb') {
    icon = <Zap size={16} className="text-yellow-600" />;
    colorClass = 'bg-yellow-50 border-yellow-200 text-yellow-800';
    messageClass = 'font-medium text-gray-800';
  } else if (type.includes('red') || type === 'wicket' || type === 'foul_t') {
    icon = <AlertTriangle size={16} className="text-red-600" />;
    colorClass = 'bg-red-50 border-red-200 text-red-800';
    messageClass = 'font-medium text-gray-800';
  } else if (type === 'shot_on' || type === 'ft') {
    icon = <Target size={16} className="text-blue-600" />;
    colorClass = 'bg-blue-50 border-blue-200 text-blue-800';
    messageClass = 'font-medium text-gray-800';
  } else if (type === 'shot_off' || type === 'dot' || type === 'turnover') {
    icon = <XCircle size={16} className="text-gray-400" />;
    colorClass = 'bg-gray-100 border-gray-200 text-gray-600';
    messageClass = 'font-medium text-gray-600';
  } else {
    icon = <List size={16} className="text-indigo-600" />;
    colorClass = 'bg-gray-50 border-gray-200 text-gray-700';
    messageClass = 'font-medium text-gray-800';
  }

  return (
    <div className={`flex gap-4 animate-slideIn border-l-2 border-indigo-200 pl-4 py-2 hover:bg-gray-50 transition-colors`}>
      <div className="w-12 text-right font-mono text-gray-400 text-sm py-3 flex-shrink-0">{event.timestamp}'</div>
      <div className={`flex items-center gap-3 flex-1 p-3 rounded-xl border ${colorClass}`}>
        {icon}
        <p className={`text-gray-800 ${messageClass}`}>{event.message}</p>
      </div>
    </div>
  );
};

const StatBar = ({ label, a, b, teamAColor, teamBColor }) => {
  const valA = Number(a) || 0;
  const valB = Number(b) || 0;
  const total = valA + valB || 1; 
  const percentA = (valA / total) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
        <span className="text-xl text-teal-600 w-1/4 text-left">{valA}</span>
        <span className="uppercase text-xs tracking-widest text-gray-900 w-2/4 text-center">{label}</span>
        <span className="text-xl text-indigo-600 w-1/4 text-right">{valB}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full flex overflow-hidden shadow-inner">
        <div className={teamAColor} style={{ width: `${percentA}%` }} title={`${label}: Team A (${valA})`}></div>
        <div className={teamBColor} style={{ width: `${100 - percentA}%` }} title={`${label}: Team B (${valB})`}></div>
      </div>
    </div>
  );
};

const PlayerRow = ({ player, isStarter }) => (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
            {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
            ) : (
                <User size={16} className="text-gray-400" />
            )}
        </div>
        <span className="text-gray-400 font-mono font-bold w-6 text-center text-sm">
            {player.number || ''}
        </span>
        <div className="flex-1">
            <span className="text-gray-800 text-sm font-medium block leading-tight">{player.name}</span>
            {isStarter && player.position && (
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{player.position}</span>
            )}
        </div>
    </div>
);

// --- 2. MAIN COMPONENT ---

export default function MatchPublicPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  
  const [lineups, setLineups] = useState({ 
      home: { starters: [], bench: [] }, 
      away: { starters: [], bench: [] } 
  });
  
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('Connecting...');

  // Identify Sport
  const sport = match?.tournaments?.sport?.toLowerCase() || 'football';

  // --- MULTI-SPORT STATS CALCULATOR ---
  const computedStats = useMemo(() => {
    // Initialize stats object based on sport
    let stats = { possession_a: match?.details?.possession_a || 50, possession_b: match?.details?.possession_b || 50 };

    if (sport === 'basketball') {
        Object.assign(stats, {
            pts3_a: 0, pts3_b: 0,
            pts2_a: 0, pts2_b: 0,
            ft_a: 0, ft_b: 0,
            rebounds_a: 0, rebounds_b: 0,
            assists_a: 0, assists_b: 0,
            steals_a: 0, steals_b: 0,
            blocks_a: 0, blocks_b: 0,
            turnovers_a: 0, turnovers_b: 0,
            fouls_a: 0, fouls_b: 0
        });
    } else if (sport === 'cricket') {
        Object.assign(stats, {
            sixes_a: 0, sixes_b: 0,
            fours_a: 0, fours_b: 0,
            wickets_a: 0, wickets_b: 0,
            extras_a: 0, extras_b: 0,
            dots_a: 0, dots_b: 0
        });
    } else {
        // Football / Default
        Object.assign(stats, {
            goals_a: 0, goals_b: 0,
            ontarget_a: 0, ontarget_b: 0,
            offtarget_a: 0, offtarget_b: 0,
            corners_a: 0, corners_b: 0,
            yellow_a: 0, yellow_b: 0,
            red_a: 0, red_b: 0
        });
    }

    if (!match || !events) return stats;

    events.forEach((event) => {
        const type = event.type ? event.type.toLowerCase().trim() : 'unknown';
        const isTeamA = String(event.team_id) === String(match.team_a_id);
        const isTeamB = String(event.team_id) === String(match.team_b_id);

        const increment = (keyA, keyB) => {
            if (isTeamA) stats[keyA]++;
            else if (isTeamB) stats[keyB]++;
        };

        if (sport === 'basketball') {
            if (type === '3pt') increment('pts3_a', 'pts3_b');
            else if (type === '2pt') increment('pts2_a', 'pts2_b');
            else if (type === 'ft') increment('ft_a', 'ft_b');
            else if (type === 'reb' || type === 'rebound') increment('rebounds_a', 'rebounds_b');
            else if (type === 'assist') increment('assists_a', 'assists_b');
            else if (type === 'steal') increment('steals_a', 'steals_b');
            else if (type === 'block') increment('blocks_a', 'blocks_b');
            else if (type === 'turnover') increment('turnovers_a', 'turnovers_b');
            else if (type.includes('foul')) increment('fouls_a', 'fouls_b');
        } 
        else if (sport === 'cricket') {
            if (type === 'six') increment('sixes_a', 'sixes_b');
            else if (type === 'four') increment('fours_a', 'fours_b');
            else if (type === 'wicket') increment('wickets_a', 'wickets_b');
            else if (type === 'wide' || type === 'nb' || type === 'noball') increment('extras_a', 'extras_b');
            else if (type === 'dot') increment('dots_a', 'dots_b');
        } 
        else {
            // Football
            if (type === 'goal') {
                increment('goals_a', 'goals_b');
                increment('ontarget_a', 'ontarget_b');
            } 
            else if (type === 'shot_on') increment('ontarget_a', 'ontarget_b');
            else if (type === 'shot_off') increment('offtarget_a', 'offtarget_b');
            else if (type === 'card_yellow') increment('yellow_a', 'yellow_b');
            else if (type === 'card_red') increment('red_a', 'red_b');
            else if (type === 'corner') increment('corners_a', 'corners_b');
        }
    });

    return stats;
  }, [match, events, sport]);

  // --- FETCH LINEUPS ---
  const fetchSquads = async (matchId, teamAId, teamBId) => {
    try {
        const { data: allMembers } = await supabase
            .from('team_members')
            .select(`
                team_id,
                user_id,
                profiles:user_id ( id, username, jersey_number, avatar_url )
            `)
            .in('team_id', [teamAId, teamBId])
            .eq('status', 'active');

        const { data: lineupRows } = await supabase
            .from('match_lineups')
            .select('team_id, player_id, position_name')
            .eq('match_id', matchId);

        const processed = { 
            home: { starters: [], bench: [] }, 
            away: { starters: [], bench: [] } 
        };

        const lineupMap = new Map(); 
        lineupRows?.forEach(r => lineupMap.set(r.player_id, r.position_name));

        allMembers?.forEach(m => {
            const player = {
                id: m.profiles.id,
                name: m.profiles.username,
                number: m.profiles.jersey_number, 
                avatar: m.profiles.avatar_url,
                position: lineupMap.get(m.profiles.id) 
            };

            const isHome = m.team_id === teamAId;
            const targetTeam = isHome ? processed.home : processed.away;

            if (player.position) {
                targetTeam.starters.push(player);
            } else {
                targetTeam.bench.push(player);
            }
        });

        setLineups(processed);

    } catch (err) {
        console.error("Error fetching squads:", err);
    }
  };

  useEffect(() => {
    if (!id) return;

    // 1. Initial Load
    const fetchData = async () => {
      const { data: matchData } = await supabase
        .from('matches')
        .select(`*, tournaments(sport), teams_a:team_a_id(*), teams_b:team_b_id(*)`)
        .eq('id', id)
        .single();
      
      setMatch(matchData);

      const { data: eventData } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: false });
      setEvents(eventData || []);

      if (matchData) {
        await fetchSquads(id, matchData.team_a_id, matchData.team_b_id);
      }
      setLoading(false);
    };

    fetchData();

    // 2. REALTIME SUBSCRIPTION
    console.log("Setting up subscription for Match ID:", id);
    
    const channel = supabase.channel(`public:match:${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        (payload) => {
           console.log("MATCH UPDATED:", payload);
           setMatch(prev => ({ ...prev, ...payload.new }));
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${id}` },
        (payload) => {
           console.log("EVENT RECEIVED:", payload);
           if (payload.eventType === 'INSERT') {
               setEvents(prev => [payload.new, ...prev]);
           } else if (payload.eventType === 'UPDATE') {
               setEvents(prev => prev.map(ev => ev.id === payload.new.id ? payload.new : ev));
           } else if (payload.eventType === 'DELETE') {
               setEvents(prev => prev.filter(ev => ev.id !== payload.old.id));
           }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'match_lineups', filter: `match_id=eq.${id}` },
        async () => {
           console.log("LINEUP CHANGED");
           if(match) fetchSquads(id, match.team_a_id, match.team_b_id);
        }
      )
      .subscribe((status) => {
          console.log("CHANNEL STATUS:", status);
          setRealtimeStatus(status);
      });

    return () => {
        console.log("Cleaning up subscription");
        supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return <Layout><div className="p-10 text-gray-500 text-center flex flex-col items-center justify-center min-h-[50vh]"><Zap className="animate-pulse mb-4 text-indigo-400"/>Loading Match Center...</div></Layout>;
  if (!match) return <Layout><div className="p-10 text-gray-800 text-center">Match not found</div></Layout>;

  // Formatting
  const teamAColor = 'bg-teal-500';
  const teamBColor = 'bg-indigo-500';
  const matchDateFormatted = match.date 
    ? new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) 
    : 'TBD';
  const matchTimeFormatted = match.match_time ? match.match_time.slice(0, 5) : '';

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          {/* Debug Status */}
          <div className="flex justify-end mb-2">
             <span className={`text-[10px] font-mono px-2 py-1 rounded border ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <Wifi size={10} className="inline mr-1"/>
                Socket: {realtimeStatus}
             </span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <MapPin size={12}/> {match.venue || 'Main Arena'} • <span className="text-indigo-500">{sport.toUpperCase()}</span>
            </span>
            
            {match.status === 'live' && <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold animate-pulse border border-red-200"><span className="w-2 h-2 rounded-full bg-red-600"></span> LIVE</span>}
            {match.status === 'scheduled' && <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold border border-indigo-200">UPCOMING</span>}
            {match.status === 'finished' && <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">FULL TIME</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-3xl font-bold text-teal-600 leading-tight">{match.teams_a?.name || 'TBA'}</h1>
            </div>
            
            <div className="px-4 text-center relative min-w-[140px]">
              <div className="text-5xl md:text-7xl font-mono font-black tracking-tight text-gray-900 mb-2">
                {match.status === 'scheduled' ? 'VS' : `${match.score_a} - ${match.score_b}`}
              </div>
              
              <div className="inline-block bg-gray-100 px-4 py-1 rounded text-gray-600 font-mono text-sm font-bold border border-gray-200">
                {match.status === 'live' ? (
                   <span className="text-red-600 flex items-center gap-1"><Clock size={14}/> {match.game_clock || "00:00"}</span>
                ) : (
                   <span className="flex items-center gap-1"><Calendar size={14}/> {matchDateFormatted} • {matchTimeFormatted}</span>
                )}
              </div>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-3xl font-bold text-indigo-600 leading-tight">{match.teams_b?.name || 'TBA'}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {[
            { key: 'feed', label: 'Match Feed', icon: List }, 
            { key: 'stats', label: 'Stats', icon: BarChart3 }, 
            { key: 'lineups', label: 'Lineups', icon: Hash }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key)} 
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors duration-300 
                ${activeTab === tab.key ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Icon size={16} className={activeTab === tab.key ? 'text-teal-500' : 'text-gray-400'}/>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-[500px] bg-gray-50">
        
        {/* --- Feed Tab --- */}
        {activeTab === 'feed' && (
          <div className="space-y-2">
            {events.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                   <Trophy className="mx-auto text-indigo-200 mb-2" size={48} />
                   <p className="text-indigo-500 font-medium">The action hasn't started yet.</p>
               </div>
            ) : (
               events.map((ev) => <MatchEvent key={ev.id} event={ev} />)
            )}
          </div>
        )}

        {/* --- Stats Tab (CONDITIONAL RENDERING) --- */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl animate-in fade-in">
            <h3 className="text-center font-bold text-gray-800 mb-8 uppercase tracking-widest text-lg">
                {sport === 'football' && 'Match Stats'}
                {sport === 'basketball' && 'Game Statistics'}
                {sport === 'cricket' && 'Match Scorecard'}
            </h3>
            
            {/* BASKETBALL STATS */}
            {sport === 'basketball' && [
                { label: '3 Pointers', a: computedStats.pts3_a, b: computedStats.pts3_b },
                { label: '2 Pointers', a: computedStats.pts2_a, b: computedStats.pts2_b },
                { label: 'Free Throws', a: computedStats.ft_a, b: computedStats.ft_b },
                { label: 'Rebounds', a: computedStats.rebounds_a, b: computedStats.rebounds_b },
                { label: 'Assists', a: computedStats.assists_a, b: computedStats.assists_b },
                { label: 'Steals', a: computedStats.steals_a, b: computedStats.steals_b },
                { label: 'Blocks', a: computedStats.blocks_a, b: computedStats.blocks_b },
                { label: 'Turnovers', a: computedStats.turnovers_a, b: computedStats.turnovers_b },
                { label: 'Fouls', a: computedStats.fouls_a, b: computedStats.fouls_b },
            ].map((stat, i) => (
                <StatBar key={i} label={stat.label} a={stat.a} b={stat.b} teamAColor={teamAColor} teamBColor={teamBColor} />
            ))}

            {/* CRICKET STATS */}
            {sport === 'cricket' && [
                { label: 'Sixes', a: computedStats.sixes_a, b: computedStats.sixes_b },
                { label: 'Fours', a: computedStats.fours_a, b: computedStats.fours_b },
                { label: 'Wickets', a: computedStats.wickets_a, b: computedStats.wickets_b },
                { label: 'Extras', a: computedStats.extras_a, b: computedStats.extras_b },
                { label: 'Dot Balls', a: computedStats.dots_a, b: computedStats.dots_b },
            ].map((stat, i) => (
                <StatBar key={i} label={stat.label} a={stat.a} b={stat.b} teamAColor={teamAColor} teamBColor={teamBColor} />
            ))}

            {/* FOOTBALL STATS (Default) */}
            {sport !== 'basketball' && sport !== 'cricket' && [
                { label: 'Possession %', a: computedStats.possession_a, b: computedStats.possession_b },
                { label: 'Goals', a: computedStats.goals_a, b: computedStats.goals_b },
                { label: 'Shots on Target', a: computedStats.ontarget_a, b: computedStats.ontarget_b },
                { label: 'Shots Missed', a: computedStats.offtarget_a, b: computedStats.offtarget_b },
                { label: 'Corners', a: computedStats.corners_a, b: computedStats.corners_b },
                { label: 'Yellow Cards', a: computedStats.yellow_a, b: computedStats.yellow_b },
                { label: 'Red Cards', a: computedStats.red_a, b: computedStats.red_b },
            ].map((stat, i) => (
                <StatBar key={i} label={stat.label} a={stat.a} b={stat.b} teamAColor={teamAColor} teamBColor={teamBColor} />
            ))}
          </div>
        )}

        {/* --- Lineups Tab --- */}
        {activeTab === 'lineups' && (
          <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
            
            {/* Team A */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="bg-teal-50 px-4 py-3 border-b border-teal-100 flex justify-between items-center">
                    <h3 className="font-bold text-teal-800">{match.teams_a.name}</h3>
                    <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded">HOME</span>
                </div>
                <div className="p-4">
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Starting XI</h4>
                        {lineups.home.starters.length > 0 ? lineups.home.starters.map(p => <PlayerRow key={p.id} player={p} isStarter={true} />) : <p className="text-sm text-gray-400 italic py-2">No starting lineup confirmed.</p>}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Substitutes / Squad</h4>
                        {lineups.home.bench.length > 0 ? lineups.home.bench.map(p => <PlayerRow key={p.id} player={p} isStarter={false} />) : <p className="text-sm text-gray-400 italic py-2">No players available.</p>}
                    </div>
                </div>
            </div>

            {/* Team B */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                    <h3 className="font-bold text-indigo-800">{match.teams_b.name}</h3>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">AWAY</span>
                </div>
                <div className="p-4">
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Starting XI</h4>
                        {lineups.away.starters.length > 0 ? lineups.away.starters.map(p => <PlayerRow key={p.id} player={p} isStarter={true} />) : <p className="text-sm text-gray-400 italic py-2">No starting lineup confirmed.</p>}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Substitutes / Squad</h4>
                        {lineups.away.bench.length > 0 ? lineups.away.bench.map(p => <PlayerRow key={p.id} player={p} isStarter={false} />) : <p className="text-sm text-gray-400 italic py-2">No players available.</p>}
                    </div>
                </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}