import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, Trophy, MapPin, Users, Activity, User, Heart, 
  Star, TrendingUp, Search, Swords, ClipboardList, Clock,
  MessageCircle, Send, UserCheck, UserX, Plus, Calendar
} from 'lucide-react'
import DashboardSection from './DashboardSection'
import StatCard from '../ui/StatCard'
import DashboardCard from '../ui/DashboardCard'

// Unique Gradients for distinct sections
const GRADIENTS = {
  teams: "from-blue-600 to-indigo-700",
  tournaments: "from-cyan-500 to-blue-600",
  messages: "from-purple-600 to-pink-600",
  availability: "from-emerald-500 to-teal-600",
  tactics: "from-violet-600 to-fuchsia-600",
  training: "from-lime-600 to-green-700",
  venue: "from-indigo-500 to-purple-600",
  merch: "from-orange-500 to-red-600",
  leaderboard: "from-amber-500 to-orange-500",
  findPlayers: "from-sky-500 to-cyan-600"
};

export default function DashboardView({ user, profile }) {
  const [data, setData] = useState({ teams: [], tournaments: [] })
  const [myTeamIds, setMyTeamIds] = useState([]) // <--- NEW: Store My Team IDs
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState({ text: "", author: "" })

  // --- QUOTES & ROLE CONFIG ---
  const quotes = {
    organizer: [
      { text: "The key is not the will to win. Everybody has that. It is the will to prepare to win that is important.", author: "Bobby Knight" },
      { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" }
    ],
    coach: [
      { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
      { text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi" }
    ],
    player: [
      { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
      { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" }
    ],
    fan: [
      { text: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé" },
      { text: "Passion is the fuel for success.", author: "Unknown" }
    ]
  }

  // --- HELPER: Filter Tournaments I am participating in ---
  const getMyTournaments = () => {
    // If I am an organizer, I want the ones I created (already handled by API usually, but safe to filter)
    if (profile.role === 'organizer') {
        return data.tournaments.filter(t => t.organizer_id === user.id)
    }
    
    // If I am Coach/Player, check if my teams are in the tournament
    if (profile.role === 'coach' || profile.role === 'player') {
        return data.tournaments.filter(t => {
            if (!t.teams) return false
            // Check if any of the tournament's teams match my team IDs
            return t.teams.some(item => myTeamIds.includes(item.team_id))
        })
    }
    
    return []
  }

  const myTournaments = getMyTournaments()

  const roleConfig = {
    organizer: {
      theme: { from: 'from-blue-600', to: 'to-indigo-700', icon: Shield },
      title: 'Organizer Workspace',
      stats: [
        { label: 'Total Events', value: myTournaments.length, icon: Trophy, color: 'blue' },
        { label: 'Active', value: myTournaments.filter(t => t.status === 'live').length, icon: Activity, color: 'green' },
        { label: 'Upcoming', value: myTournaments.filter(t => t.status === 'upcoming').length, icon: Clock, color: 'yellow' }
      ]
    },
    coach: {
      theme: { from: 'from-green-600', to: 'to-emerald-700', icon: Users },
      title: "Coach's Locker Room",
      stats: [
        { label: 'My Teams', value: data.teams.length, icon: Activity, color: 'blue' },
        { label: 'Active Tournaments', value: myTournaments.length, icon: Trophy, color: 'yellow' },
        { label: 'Tactics Created', value: '3', icon: ClipboardList, color: 'green' } 
      ]
    },
    player: {
      theme: { from: 'from-yellow-500', to: 'to-amber-600', icon: User },
      title: 'Player Hub',
      stats: [
        { label: 'Team Memberships', value: data.teams.length, icon: Activity, color: 'blue' },
        { label: 'Tournaments', value: myTournaments.length, icon: Trophy, color: 'green' },
        { label: 'Goals', value: '-', icon: Star, color: 'yellow' }
      ]
    },
    fan: {
      theme: { from: 'from-red-500', to: 'to-rose-600', icon: Heart },
      title: 'Fan Zone',
      stats: [
        { label: 'Live Matches', value: '0', icon: TrendingUp, color: 'red' },
        { label: 'Tournaments', value: '-', icon: Trophy, color: 'blue' },
        { label: 'Following', value: '0', icon: Heart, color: 'purple' }
      ]
    }
  }

  const config = roleConfig[profile.role] || roleConfig['fan']
  const { theme } = config 
  const BannerIcon = theme.icon

  // --- DATA FETCHING ---
  useEffect(() => {
    const roleQuotes = quotes[profile.role] || quotes['fan']
    setQuote(roleQuotes[Math.floor(Math.random() * roleQuotes.length)])

    async function fetchData() {
      try {
        if (profile.role === 'organizer') {
          // Organizers just need their own events
          const res = await fetch('/api/tournaments/all') // Changed to all, we filter locally for consistency
          if (res.ok) setData({ teams: [], tournaments: await res.json() })
        } 
        else if (profile.role === 'coach' || profile.role === 'player') {
          // Players/Coaches need: 
          // 1. Their Teams
          // 2. ALL Tournaments (to filter)
          // 3. Their Team IDs (to know what to filter)
          
          const teamEndpoint = profile.role === 'coach' ? '/api/teams/created' : '/api/teams/joined'
          
          const [teamsRes, allTourneysRes, myTeamsRes] = await Promise.all([
            fetch(teamEndpoint),
            fetch('/api/tournaments/all'),
            fetch('/api/teams/my-teams')
          ])

          const teamsData = teamsRes.ok ? await teamsRes.json() : []
          const tourneysData = allTourneysRes.ok ? await allTourneysRes.json() : []
          const myTeamIdsData = myTeamsRes.ok ? await myTeamsRes.json() : []

          setData({
            teams: teamsData,
            tournaments: tourneysData
          })
          setMyTeamIds(myTeamIdsData)
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchData()
  }, [profile.role, user])

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading dashboard...</div>

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* --- BANNER --- */}
      <div className={`relative rounded-2xl shadow-xl overflow-hidden bg-gradient-to-r ${theme.from} ${theme.to} text-white`}>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 opacity-90">
              <BannerIcon size={24} />
              <span className="font-bold uppercase tracking-wider text-sm">{config.title}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 italic">"{quote.text}"</h2>
            <p className="text-lg opacity-80 font-medium">— {quote.author}</p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <p className="text-xs uppercase tracking-wider opacity-80 font-bold">Today is</p>
            <p className="text-2xl font-bold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm opacity-90 mt-1">Hello, {profile.username}!</p>
          </div>
        </div>
      </div>

      {/* --- STATS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {config.stats.map((stat, i) => (
          <StatCard key={i} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="space-y-10">
        
        {/* --- 1. TOP ROW: LISTS (Side by Side) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Organizer View */}
          {profile.role === 'organizer' && (
            <div className="md:col-span-2"> 
              <DashboardSection 
                title="Recent Tournaments" 
                icon={Trophy} 
                link="/tournament_portal" 
                linkText="View All" 
                items={myTournaments} // Uses the filtered list
                emptyText="No tournaments created yet." 
                type="tournament" 
              />
            </div>
          )}

          {/* Coach & Player View (Teams & Tournaments Side-by-Side) */}
          {(profile.role === 'coach' || profile.role === 'player') && (
            <>
              <DashboardSection 
                title="My Teams" 
                icon={Activity} 
                link="/team_portal" 
                linkText={profile.role === 'coach' ? "Manage" : "View All"} 
                items={data.teams} 
                emptyText="No teams yet." 
                type="team" 
              />

              <DashboardSection 
                title="Active Tournaments" 
                icon={Trophy} 
                link="/tournament_portal"
                linkText="Browse" 
                items={myTournaments} // <--- Uses the filtered "Participating" list
                emptyText="No active tournaments."
                type="tournament" 
              />
            </>
          )}

          {/* Fan View */}
          {profile.role === 'fan' && (
            <div className="bg-white p-8 border rounded-xl shadow-sm text-center md:col-span-2">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Tournaments</h3>
              <p className="text-gray-500 mb-6">Find active leagues and knockout cups happening now.</p>
              <Link href="/tournament_portal" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors gap-2">
                <Search size={18} /> Browse All
              </Link>
            </div>
          )}
        </div>

        {/* --- 2. BOTTOM ROW: ACTION BUTTONS (Grid) --- */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* MESSAGES (Available to ALL users) */}
            <DashboardCard
              title="Messages"
              subtitle="Team chat & DMs."
              icon={MessageCircle}
              link="/messages"
              gradient={GRADIENTS.messages}
            >
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">New</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-white/70" />
                  <span className="text-white/70 font-bold text-xs uppercase tracking-wider">Inbox</span>
                </div>
              </div>
            </DashboardCard>

            {/* AVAILABILITY (Coach & Player Only) */}
            {(profile.role === 'coach') && (
              <DashboardCard
                title="Availability"
                subtitle="Match status."
                icon={Calendar}
                link="/player-availability" 
                gradient={GRADIENTS.availability}
              >
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-xs uppercase tracking-wider">In</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-white/70" />
                    <span className="text-white/70 font-bold text-xs uppercase tracking-wider">Out</span>
                  </div>
                </div>
              </DashboardCard>
            )}

            {/* VENUE MANAGER (Organizer Only) */}
            {profile.role === 'organizer' && (
              <DashboardCard
                title="Venue Manager"
                subtitle="Add and manage stadiums."
                icon={MapPin}
                link="/tournament_portal" 
                gradient={GRADIENTS.venue}
              />
            )}

            {/* TACTICS BOARD (Coach Only) */}
            {profile.role === 'coach' && (
              <DashboardCard
                title="Tactics Board"
                subtitle="Draw formations and strategies."
                icon={Swords}
                link="/tactics/new" 
                gradient={GRADIENTS.tactics}
              />
            )}

            {/* TRAINING PLANNER (Coach Only) */}
            {profile.role === 'coach' && (
              <DashboardCard
                title="Training Planner"
                subtitle="Create and manage sessions."
                icon={ClipboardList}
                link="/training" 
                gradient={GRADIENTS.training}
              />
            )}

            {/* TEAM PORTAL (Coach & Player) */}
            {(profile.role === 'coach' || profile.role === 'player') && (
              <DashboardCard
                title="Team Portal"
                subtitle="Manage rosters & memberships."
                icon={Users}
                link="/team_portal" 
                gradient={GRADIENTS.teams}
              />
            )}

            {/* MERCH SHOP (Fan Only) */}
            {profile.role === 'fan' && (
              <DashboardCard
                title="Merch Shop"
                subtitle="Buy official merchandise."
                icon={Heart}
                link="/merch" 
                gradient={GRADIENTS.merch}
              />
            )}

            {/* LEADERBOARDS (All Users) */}
            <DashboardCard
              title="Leaderboards"
              subtitle="View standings and top scorers."
              icon={TrendingUp}
              link="/leaderboards" 
              gradient={GRADIENTS.leaderboard}
            />

            {/* TOURNAMENTS (All Users - Contextual Text) */}
            <DashboardCard
              title="Tournaments"
              subtitle={profile.role === 'organizer' ? 'Manage your events.' : 'Browse & Register.'}
              icon={Trophy}
              link="/tournament_portal" 
              gradient={GRADIENTS.tournaments}
            />

          </div>
        </div>

      </div>
    </div>
  )
}