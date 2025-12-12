import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, Trophy, MapPin, Users, Activity, User, Heart, 
  Star, TrendingUp, Search, Swords, ClipboardList, Clock, Calendar 
} from 'lucide-react'
import DashboardSection from './DashboardSection'
import StatCard from '../ui/StatCard'

export default function DashboardView({ user, profile }) {
  const [data, setData] = useState({ teams: [], tournaments: [] })
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState({ text: "", author: "" })

  // --- 1. QUOTES DATABASE ---
  const quotes = {
    organizer: [
      { text: "The key is not the will to win. Everybody has that. It is the will to prepare to win that is important.", author: "Bobby Knight" },
      { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
      { text: "Great things come from hard work and perseverance. No excuses.", author: "Kobe Bryant" },
      { text: "Excellence is not a singular act, but a habit. You are what you repeatedly do.", author: "Shaquille O'Neal" }
    ],
    coach: [
      { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
      { text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi" },
      { text: "A trophy carries dust. Memories last forever.", author: "Mary Lou Retton" },
      { text: "Victory requires payment in advance.", author: "Erasmo Riojas" }
    ],
    player: [
      { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
      { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
      { text: "I’ve failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan" },
      { text: "It is not the mountain we conquer, but ourselves.", author: "Sir Edmund Hillary" }
    ],
    fan: [
      { text: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé" },
      { text: "Passion is the fuel for success.", author: "Unknown" },
      { text: "It's not just a game, it's a lifestyle.", author: "Unknown" },
      { text: "Champions keep playing until they get it right.", author: "Billie Jean King" }
    ]
  }

  // --- 2. CONFIGURATION BASED ON ROLE ---
  const roleConfig = {
    organizer: {
      theme: { from: 'from-blue-600', to: 'to-indigo-700', icon: Shield, color: 'blue' },
      title: 'Organizer Workspace',
      description: 'Manage your leagues, track results, and oversee venues.',
      stats: [
        { label: 'Total Events', value: data.tournaments.length, icon: Trophy, color: 'blue' },
        { label: 'Active', value: data.tournaments.filter(t => t.status === 'active').length, icon: Activity, color: 'green' },
        { label: 'Upcoming', value: data.tournaments.filter(t => t.status === 'upcoming').length, icon: Clock, color: 'yellow' }
      ]
    },
    coach: {
      theme: { from: 'from-green-600', to: 'to-emerald-700', icon: Users, color: 'green' },
      title: "Coach's Locker Room",
      description: 'Prepare your squads, manage rosters, and plan your next victory.',
      stats: [
        { label: 'My Teams', value: data.teams.length, icon: Activity, color: 'blue' },
        { label: 'Active Tournaments', value: data.tournaments.length, icon: Trophy, color: 'yellow' },
        { label: 'Tactics Created', value: '3', icon: ClipboardList, color: 'green' } 
      ]
    },
    player: {
      theme: { from: 'from-yellow-500', to: 'to-amber-600', icon: User, color: 'yellow' },
      title: 'Player Hub',
      description: 'Track your performance, view your schedule, and stay connected.',
      stats: [
        { label: 'Team Memberships', value: data.teams.length, icon: Activity, color: 'blue' },
        { label: 'Tournaments', value: data.tournaments.length, icon: Trophy, color: 'green' },
        { label: 'Goals', value: '-', icon: Star, color: 'yellow' }
      ]
    },
    fan: {
      theme: { from: 'from-red-500', to: 'to-rose-600', icon: Heart, color: 'red' },
      title: 'Fan Zone',
      description: 'Follow your favorite teams, catch live scores, and never miss a match.',
      stats: [
        { label: 'Live Matches', value: '0', icon: TrendingUp, color: 'red' },
        { label: 'Tournaments', value: '-', icon: Trophy, color: 'blue' },
        { label: 'Following', value: '0', icon: Heart, color: 'purple' }
      ]
    }
  }

  const config = roleConfig[profile.role] || roleConfig['fan']
  const BannerIcon = config.theme.icon

  // --- 3. DATA FETCHING & QUOTE SELECTION ---
  useEffect(() => {
    // Select a random quote based on role
    const roleQuotes = quotes[profile.role] || quotes['fan']
    const randomQuote = roleQuotes[Math.floor(Math.random() * roleQuotes.length)]
    setQuote(randomQuote)

    async function fetchData() {
      try {
        if (profile.role === 'organizer') {
          const res = await fetch('/api/tournaments/created')
          if (res.ok) setData({ teams: [], tournaments: await res.json() })
        } 
        else if (profile.role === 'coach') {
          const [teamsRes, tourneysRes] = await Promise.all([
            fetch('/api/teams/created'),
            fetch('/api/tournaments/registered')
          ])
          setData({
            teams: teamsRes.ok ? await teamsRes.json() : [],
            tournaments: tourneysRes.ok ? await tourneysRes.json() : []
          })
        }
        else if (profile.role === 'player') {
          const [teamsRes, tourneysRes] = await Promise.all([
            fetch('/api/teams/joined'),
            fetch('/api/tournaments/player')
          ])
          setData({
            teams: teamsRes.ok ? await teamsRes.json() : [],
            tournaments: tourneysRes.ok ? await tourneysRes.json() : []
          })
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [profile.role])

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading dashboard...</div>

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className={`relative rounded-2xl shadow-xl overflow-hidden bg-gradient-to-r ${config.theme.from} ${config.theme.to} text-white`}>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 opacity-90">
              <BannerIcon size={24} />
              <span className="font-bold uppercase tracking-wider text-sm">{config.title}</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-tight italic">
              "{quote.text}"
            </h2>
            <p className="text-lg opacity-80 font-medium">— {quote.author}</p>
            
          </div>
          <div className="text-left md:text-right shrink-0">
             <p className="text-xs uppercase tracking-wider opacity-80 font-bold">Today is</p>
             <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
             <p className="text-sm opacity-90 mt-1">Hello, {profile.username}!</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {config.stats.map((stat, i) => (
          <StatCard key={i} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {profile.role === 'organizer' && (
             <DashboardSection title="Recent Tournaments" icon={Trophy} link="/tournament_portal" linkText="View All" items={data.tournaments} emptyText="No tournaments created yet." type="tournament" />
          )}
          {(profile.role === 'coach' || profile.role === 'player') && (
            <>
              <DashboardSection title="My Teams" icon={Activity} link="/team_portal" linkText={profile.role === 'coach' ? "Manage" : "View All"} items={data.teams} emptyText="No teams yet." type="team" />
              <DashboardSection title="Active Tournaments" icon={Trophy} link="/tournament_portal" linkText="Browse" items={data.tournaments} emptyText="No active tournaments." type="tournament" />
            </>
          )}
          {profile.role === 'fan' && (
             <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Tournaments</h3>
                <p className="text-gray-500 mb-6">Find active leagues and knockout cups happening now.</p>
                <Link href="/tournament_portal" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors gap-2">
                   <Search size={18} /> Browse All
                </Link>
             </div>
          )}
        </div>

        <div className="space-y-4">
           {profile.role === 'organizer' && (
              <Link href="/tournament_portal" className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-purple-50 rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><MapPin size={24} /></div>
                  <h3 className="font-bold text-gray-900">Venue Manager</h3>
                </div>
                <p className="text-sm text-gray-500">Add and manage stadiums for your events.</p>
              </Link>
           )}

           {profile.role === 'coach' && (
              <Link href="/tactics/new" className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Swords size={24} /></div>
                  <h3 className="font-bold text-gray-900">Tactics Board</h3>
                </div>
                <p className="text-sm text-gray-500">Draw formations and strategies.</p>
              </Link>
           )}
           
           {(profile.role === 'coach' || profile.role === 'player') && (
              <Link href="/team_portal" className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-3">
                   <div className="p-3 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={24} /></div>
                   <h3 className="font-bold text-gray-900">Team Portal</h3>
                </div>
                <p className="text-sm text-gray-500">Manage rosters & memberships.</p>
              </Link>
           )}
           
           <Link href="/tournament_portal" className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-yellow-400 hover:shadow-md transition-all group">
             <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white transition-colors"><Trophy size={24} /></div>
                <h3 className="font-bold text-gray-900">Tournaments</h3>
             </div>
             <p className="text-sm text-gray-500">{profile.role === 'organizer' ? 'Manage your events' : 'Browse & Register'}</p>
           </Link>
        </div>
      </div>
    </div>
  )
}