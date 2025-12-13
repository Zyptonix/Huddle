import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'  // Ensure this path is correct
import { Trophy, Medal, Crown, ChevronDown, ChevronUp, ArrowRight, Zap, Loader } from 'lucide-react'

export default function Leaderboards() {
  const router = useRouter()
  
  // --- STATE MANAGEMENT ---
  const [activeTournamentId, setActiveTournamentId] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [standings, setStandings] = useState([])
  const [scorers, setScorers] = useState([])
  const [loading, setLoading] = useState(true)

  // Toggle views
  const [showFullTable, setShowFullTable] = useState(false)
  const [showAllScorers, setShowAllScorers] = useState(false)

  // --- 1. FETCH TOURNAMENTS (For the Tabs) ---
  useEffect(() => {
    async function fetchTournaments() {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('id, name, sport')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data.length > 0) {
          setTournaments(data)
          // Set the first tournament as active by default
          setActiveTournamentId(data[0].id)
        }
      } catch (err) {
        console.error("Error loading tournaments:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTournaments()
  }, [])

  // --- 2. FETCH DATA WHEN ACTIVE TOURNAMENT CHANGES ---
  useEffect(() => {
    if (!activeTournamentId) return

    async function fetchData() {
      setLoading(true)
      
      try {
        // A. Fetch Teams participating in this tournament
        // We use the joining table 'tournament_teams' to get the actual teams
        const { data: teamData, error: teamError } = await supabase
          .from('tournament_teams')
          .select(`
            team_id,
            teams (id, name, logo_url)
          `)
          .eq('tournament_id', activeTournamentId)

        if (teamError) throw teamError

        // B. Fetch Completed Matches for this tournament (to calc stats)
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', activeTournamentId)
          .eq('status', 'completed')
          .order('date', { ascending: true }) // Order by date for "Form" calculation

        if (matchError) throw matchError

        // C. Calculate Standings Logic
        const calculatedStandings = calculateStandings(teamData, matchData)
        setStandings(calculatedStandings)

        // D. Fetch Top Scorers (from match_events)
        const { data: eventsData, error: eventsError } = await supabase
          .from('match_events')
          .select('player_name, team_id, teams(name)')
          .eq('type', 'goal') // Assuming 'goal' is your event type string
          .in('match_id', matchData.map(m => m.id)) // Only events from these matches

        if (eventsError) throw eventsError

        const calculatedScorers = calculateTopScorers(eventsData)
        setScorers(calculatedScorers)

      } catch (err) {
        console.error("Error fetching leaderboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTournamentId])

  // --- HELPER: Calculate Table Logic ---
  const calculateStandings = (tournamentTeams, matches) => {
    // 1. Initialize stats for every team
    const stats = {}
    
    tournamentTeams.forEach(({ teams: team }) => {
      if (team) {
        stats[team.id] = {
          team: team.name,
          teamId: team.id,
          p: 0, w: 0, d: 0, l: 0, pts: 0,
          form: [] // To store 'w', 'l', 'd' history
        }
      }
    })

    // 2. Loop through matches to update stats
    matches.forEach(match => {
      const home = stats[match.team_a_id]
      const away = stats[match.team_b_id]

      // Skip if team data missing (e.g. deleted team)
      if (!home || !away) return 

      home.p += 1
      away.p += 1

      if (match.score_a > match.score_b) {
        // Home Win
        home.w += 1; home.pts += 3; home.form.push('w');
        away.l += 1; away.form.push('l');
      } else if (match.score_a < match.score_b) {
        // Away Win
        away.w += 1; away.pts += 3; away.form.push('w');
        home.l += 1; home.form.push('l');
      } else {
        // Draw
        home.d += 1; home.pts += 1; home.form.push('d');
        away.d += 1; away.pts += 1; away.form.push('d');
      }
    })

    // 3. Convert to array and sort by Points (desc), then Goal Diff (optional)
    return Object.values(stats)
      .sort((a, b) => b.pts - a.pts)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        form: item.form.slice(-5) // Keep only last 5 games
      }))
  }

  // --- HELPER: Calculate Scorers Logic ---
  const calculateTopScorers = (events) => {
    const counts = {}

    events.forEach(event => {
      const name = event.player_name || 'Unknown'
      if (!counts[name]) {
        counts[name] = { 
          name: name, 
          team: event.teams?.name || 'Free Agent', 
          score: 0, 
          label: 'Goals' 
        }
      }
      counts[name].score += 1
    })

    return Object.values(counts)
      .sort((a, b) => b.score - a.score)
  }

  // --- Helpers for Display ---
  const activeTournamentName = tournaments.find(t => t.id === activeTournamentId)?.name || 'Loading...'
  const activeSport = tournaments.find(t => t.id === activeTournamentId)?.sport || 'Sports'

  // Slice data based on "Show More"
  const displayedStandings = showFullTable ? standings : standings.slice(0, 4)
  const displayedScorers = showAllScorers ? scorers : scorers.slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 relative overflow-hidden">
      
      {/* Background Blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
        
        {/* === HEADER === */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                 Live Updates
               </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Leaderboards
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Track the champions of the <span className="font-semibold text-blue-600">{activeTournamentName}</span>.
            </p>
          </div>

          {/* Tournament Tabs (Dynamic) */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto max-w-full no-scrollbar">
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTournamentId(t.id)
                  setShowFullTable(false)
                  setShowAllScorers(false)
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTournamentId === t.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && standings.length === 0 ? (
           <div className="flex justify-center items-center py-20">
             <Loader className="w-10 h-10 text-blue-600 animate-spin" />
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* === MAIN STANDINGS TABLE === */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                
                {/* Table Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white via-white to-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600 shadow-sm">
                      <Trophy size={24} fill="currentColor" className="opacity-90" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-xl">{activeSport} Standings</h2>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time stats</span>
                    </div>
                  </div>
                  
                  {standings.length > 4 && (
                    <button 
                      onClick={() => setShowFullTable(!showFullTable)}
                      className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {showFullTable ? 'Collapse' : 'Full Table'}
                      {showFullTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>

                {/* The Table */}
                <div className="overflow-x-auto">
                  {standings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No matches played yet.</div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-8 py-5 w-20 text-center">Rank</th>
                          <th className="px-6 py-5">Team</th>
                          <th className="px-4 py-5 text-center">P</th>
                          <th className="px-4 py-5 text-center">W</th>
                          <th className="px-4 py-5 text-center">D</th>
                          <th className="px-4 py-5 text-center">L</th>
                          <th className="px-4 py-5 text-center hidden sm:table-cell">Form</th>
                          <th className="px-8 py-5 text-center text-slate-900">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedStandings.map((team, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-8 py-5 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm
                                ${team.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                                  team.rank === 2 ? 'bg-slate-200 text-slate-700' : 
                                  team.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-slate-500'}`}>
                                {team.rank}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md
                                  ${team.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                  {team.team.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900 text-base">{team.team}</span>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center font-medium text-slate-600">{team.p}</td>
                            <td className="px-4 py-5 text-center font-medium text-slate-600">{team.w}</td>
                            <td className="px-4 py-5 text-center font-medium text-slate-600">{team.d}</td>
                            <td className="px-4 py-5 text-center font-medium text-slate-600">{team.l}</td>
                            
                            <td className="px-4 py-5 hidden sm:table-cell">
                              <div className="flex justify-center gap-1">
                                {team.form.map((f, i) => (
                                  <div key={i} className={`w-2 h-2 rounded-full ${f === 'w' ? 'bg-green-500' : f === 'l' ? 'bg-red-400' : 'bg-slate-300'}`} />
                                ))}
                              </div>
                            </td>

                            <td className="px-8 py-5 text-center">
                              <span className="font-black text-slate-900 text-lg">{team.pts}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Mobile Show More */}
                {standings.length > 4 && (
                  <div className="sm:hidden p-4 border-t border-slate-100">
                     <button 
                        onClick={() => setShowFullTable(!showFullTable)}
                        className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm"
                     >
                        {showFullTable ? 'Show Less' : 'View Full Table'}
                     </button>
                  </div>
                )}
              </div>
            </div>

            {/* === RIGHT COLUMN === */}
            <div className="space-y-8">
              
              {/* Top Scorers */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
                     <Medal size={20} fill="currentColor" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Top Performers</h3>
                </div>

                <div className="space-y-4">
                  {displayedScorers.length === 0 ? (
                    <div className="text-gray-400 text-sm italic">No goals recorded yet.</div>
                  ) : (
                    displayedScorers.map((player, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-lg font-black
                            ${idx === 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                            {idx + 1}
                          </div>
                          {idx === 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow-sm ring-2 ring-white">
                               <Crown size={12} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{player.name}</h4>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{player.team}</p>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-2xl text-slate-900 leading-none">
                            {player.score}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {player.label}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {scorers.length > 3 && (
                  <button 
                    onClick={() => setShowAllScorers(!showAllScorers)}
                    className="w-full mt-6 py-3.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                    {showAllScorers ? 'Show Top 3' : 'View All Players'}
                    {showAllScorers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>

              {/* Promo Card */}
              <div className="relative group overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/20">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-700 transition-transform duration-500 group-hover:scale-105" />
                 <div className="relative z-10 p-8 text-white">
                     <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                        <Zap size={24} className="text-yellow-300" fill="currentColor" />
                     </div>
                     <h3 className="font-black text-2xl mb-2">Join the Action!</h3>
                     <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed opacity-90">
                       Think your team has what it takes? Register now for the upcoming Summer League qualifiers.
                     </p>
                     <button 
                       onClick={() => router.push('/auth/register')}
                       className="w-full bg-white text-blue-700 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                     >
                         Register Now
                         <ArrowRight size={16} />
                     </button>
                 </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}