import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Layout from '../../../components/ui/Layout';
import { Clock, MapPin, BarChart3, List, Trophy, Zap, AlertTriangle, Hash } from 'lucide-react';

// --- Sub-Components for Cleanliness and Style ---

// 1. Event Feed Item
const MatchEvent = ({ event }) => {
  let icon, colorClass, messageClass;

  switch (event.type) {
    case 'goal':
      icon = <Trophy size={16} className="text-teal-600" />;
      colorClass = 'bg-teal-50 border-teal-200 text-teal-800';
      messageClass = 'font-extrabold text-gray-900';
      break;
    case 'yellow_card':
      icon = <Zap size={16} className="text-yellow-600" />;
      colorClass = 'bg-yellow-50 border-yellow-200 text-yellow-800';
      messageClass = 'font-medium text-gray-800';
      break;
    case 'red_card':
      icon = <AlertTriangle size={16} className="text-red-600" />;
      colorClass = 'bg-red-50 border-red-200 text-red-800';
      messageClass = 'font-medium text-gray-800';
      break;
    default:
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

// 2. Stat Bar
const StatBar = ({ label, a, b, teamAColor, teamBColor }) => {
  const total = a + b || 1;
  const percentA = (a / total) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
        <span className="text-xl text-teal-600 w-1/4 text-left">{a}</span>
        <span className="uppercase text-xs tracking-widest text-gray-900 w-2/4 text-center">{label}</span>
        <span className="text-xl text-indigo-600 w-1/4 text-right">{b}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full flex overflow-hidden shadow-inner">
        <div 
          className={teamAColor} 
          style={{ width: `${percentA}%` }} 
          title={`${label}: Team A (${a})`}
        ></div>
        <div 
          className={teamBColor} 
          style={{ width: `${100 - percentA}%` }} 
          title={`${label}: Team B (${b})`}
        ></div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function MatchPublicPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [lineups, setLineups] = useState({ home: [], away: [] });
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // 1. Initial Load (Existing logic remains the same)
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
        const { data: home } = await supabase.from('match_lineups').select('is_starter, jersey_number, profiles(username)').eq('team_id', matchData.team_a_id).eq('match_id', id).order('jersey_number');
        const { data: away } = await supabase.from('match_lineups').select('is_starter, jersey_number, profiles(username)').eq('team_id', matchData.team_b_id).eq('match_id', id).order('jersey_number');
        setLineups({ home: home || [], away: away || [] });
      }
      setLoading(false);
    };
    fetchData();

    // 2. Realtime Sync (Existing logic remains the same)
    const channel = supabase.channel(`public:match:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${id}` },
        (payload) => setEvents(prev => [payload.new, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        (payload) => setMatch(prev => ({ ...prev, ...payload.new })))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  if (loading) return <Layout><div className="p-10 text-gray-500 text-center">Loading Stadium...</div></Layout>;
  if (!match) return <Layout><div className="p-10 text-gray-800 text-center">Match not found</div></Layout>;

  // Light Mode Colors
  const teamAColor = 'bg-teal-500'; // Team A Accent Color
  const teamBColor = 'bg-indigo-500'; // Team B Accent Color
  const finalScoreAColor = match.score_a > match.score_b ? 'text-teal-600' : 'text-gray-400';
  const finalScoreBColor = match.score_b > match.score_a ? 'text-indigo-600' : 'text-gray-400';

  // --- FINISHED MATCH UI ---
  if (match.status === 'finished') {
    return (
      <Layout>
        {/* Header - Light Mode */}
        <div className="w-3/4 bg-white border-b border-gray-200 pb-20 pt-16 px-4 mb-10 text-center relative mx-auto overflow-hidden">
          <div className="relative z-10 animate-fadeIn max-w-4xl mx-auto">
            <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-200 shadow-sm">Full Time</span>
            <div className="flex justify-center items-center gap-4 md:gap-12 mt-8">
              <div className="text-center w-1/3">
                <h1 className="text-xl md:text-3xl font-bold mb-2 text-gray-800">{match.teams_a?.name}</h1>
                <div className={`text-6xl md:text-8xl font-black ${finalScoreAColor} transition-colors duration-500`}>{match.score_a}</div>
              </div>
              <div className="text-gray-300 text-4xl font-extralight pt-8">/</div>
              <div className="text-center w-1/3">
                <h1 className="text-xl md:text-3xl font-bold mb-2 text-gray-800">{match.teams_b?.name}</h1>
                <div className={`text-6xl md:text-8xl font-black ${finalScoreBColor} transition-colors duration-500`}>{match.score_b}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Timeline */}
        <div className="max-w-4xl mx-auto w-full grid md:grid-cols-2 gap-8 p-8 -mt-10 relative z-20">
          {/* Match Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><List size={18} className="text-teal-500"/> Match Highlights</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {events.filter(e => e.type !== 'info').map(e => <MatchEvent key={e.id} event={e} />)}
              {events.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">No highlights recorded.</p>}
            </div>
          </div>

          {/* Final Stats */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500"/> Final Statistics</h3>
            {[
              { label: 'Possession %', a: match.details?.possession_a || 50, b: match.details?.possession_b || 50 },
              { label: 'Shots', a: match.details?.shots_a || 0, b: match.details?.shots_b || 0 },
              { label: 'Shots on Target', a: match.details?.shots_on_target_a || 0, b: match.details?.shots_on_target_b || 0 },
              { label: 'Fouls', a: match.details?.fouls_a || 0, b: match.details?.fouls_b || 0 },
              { label: 'Corners', a: match.details?.corners_a || 0, b: match.details?.corners_b || 0 },
            ].map((stat, i) => (
              <StatBar 
                key={i} 
                label={stat.label} 
                a={stat.a} 
                b={stat.b} 
                teamAColor={teamAColor} 
                teamBColor={teamBColor} 
              />
            ))}
          </div>
        </div>

        {/* Lineups (Below Stats) */}
        <div className="max-w-4xl mx-auto w-full p-8 pt-0">
          <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2"><Hash size={18} className="text-indigo-500"/> Lineups</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Team A Lineup */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
              <h4 className="font-bold text-teal-600 mb-4 border-b border-gray-100 pb-2">{match.teams_a.name}</h4>
              {lineups.home.length === 0 && <p className="text-gray-400 text-sm">No lineup submitted.</p>}
              {lineups.home.map((p,i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-0 items-center">
                  <span className="text-gray-500 font-mono font-bold w-6">{p.jersey_number || '??'}</span>
                  <span className="text-gray-800">{p.profiles?.username || 'Player TBD'}</span>
                  {p.is_starter && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold ml-auto">Starter</span>}
                </div>
              ))}
            </div>
            {/* Team B Lineup */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
              <h4 className="font-bold text-indigo-600 mb-4 border-b border-gray-100 pb-2">{match.teams_b.name}</h4>
              {lineups.away.length === 0 && <p className="text-gray-400 text-sm">No lineup submitted.</p>}
              {lineups.away.map((p,i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-0 items-center">
                  <span className="text-gray-500 font-mono font-bold w-6">{p.jersey_number || '??'}</span>
                  <span className="text-gray-800">{p.profiles?.username || 'Player TBD'}</span>
                  {p.is_starter && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold ml-auto">Starter</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // --- LIVE MATCH UI ---
  return (
    <Layout>
      {/* Header - Light Mode */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> {match.venue || 'Main Arena'}</span>
            {match.status === 'live' && <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold animate-pulse border border-red-200 shadow-md"><span className="w-2 h-2 rounded-full bg-red-600"></span> LIVE</span>}
            {match.status === 'scheduled' && <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold border border-indigo-200">UPCOMING</span>}
          </div>
          <div className="flex items-center justify-between">
            {/* Team A */}
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-3xl font-bold text-teal-600">{match.teams_a?.name || 'TBA'}</h1>
            </div>
            {/* Scoreboard */}
            <div className="px-4 text-center relative">
              <div className="text-5xl md:text-7xl font-mono font-black tracking-tight text-gray-900 mb-2">
                {match.status === 'scheduled' ? 'VS' : `${match.score_a} - ${match.score_b}`}
              </div>
              <div className="inline-block bg-gray-100 px-4 py-1 rounded text-red-500 font-mono text-xl font-bold border border-gray-200">
                <Clock size={16} className="inline-block mr-2 align-middle text-red-600"/>{match.game_clock || (match.status === 'scheduled' ? 'TBD' : "00:00")}
              </div>
            </div>
            {/* Team B */}
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-3xl font-bold text-indigo-600">{match.teams_b?.name || 'TBA'}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {[
            { key: 'feed', label: 'Match Feed', icon: List }, 
            { key: 'stats', label: 'Live Stats', icon: BarChart3 }, 
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
                {tab.label}
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
            {events.length === 0 && <p className="text-center py-20 text-indigo-500 font-medium bg-white rounded-xl border border-gray-200">The action is about to begin...</p>}
            {events.map((ev) => <MatchEvent key={ev.id} event={ev} />)}
          </div>
        )}

        {/* --- Stats Tab --- */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl">
            <h3 className="text-center font-bold text-gray-800 mb-8 uppercase tracking-widest text-lg">Live Statistical Breakdown</h3>
            {[
              { label: 'Possession %', a: match.details?.possession_a || 50, b: match.details?.possession_b || 50 },
              { label: 'Shots', a: match.details?.shots_a || 0, b: match.details?.shots_b || 0 },
              { label: 'Shots on Target', a: match.details?.shots_on_target_a || 0, b: match.details?.shots_on_target_b || 0 },
              { label: 'Fouls Committed', a: match.details?.fouls_a || 0, b: match.details?.fouls_b || 0 },
              { label: 'Corners', a: match.details?.corners_a || 0, b: match.details?.corners_b || 0 },
            ].map((stat, i) => (
              <StatBar 
                key={i} 
                label={stat.label} 
                a={stat.a} 
                b={stat.b} 
                teamAColor={teamAColor} 
                teamBColor={teamBColor} 
              />
            ))}
          </div>
        )}

        {/* --- Lineups Tab --- */}
        {activeTab === 'lineups' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Team A Lineup */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
              <h3 className="font-bold text-teal-600 mb-4 border-b border-gray-100 pb-2">{match.teams_a.name}</h3>
              {lineups.home.length === 0 && <p className="text-gray-400 text-sm">No lineup submitted.</p>}
              {lineups.home.map((p,i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-0 items-center">
                  <span className="text-gray-500 font-mono font-bold w-6">{p.jersey_number || '??'}</span>
                  <span className="text-gray-800">{p.profiles?.username || 'Player TBD'}</span>
                  {p.is_starter && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold ml-auto">Starter</span>}
                </div>
              ))}
            </div>
            {/* Team B Lineup */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
              <h3 className="font-bold text-indigo-600 mb-4 border-b border-gray-100 pb-2">{match.teams_b.name}</h3>
              {lineups.away.length === 0 && <p className="text-gray-400 text-sm">No lineup submitted.</p>}
              {lineups.away.map((p,i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-0 items-center">
                  <span className="text-gray-500 font-mono font-bold w-6">{p.jersey_number || '??'}</span>
                  <span className="text-gray-800">{p.profiles?.username || 'Player TBD'}</span>
                  {p.is_starter && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold ml-auto">Starter</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}