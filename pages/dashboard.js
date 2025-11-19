import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import Head from 'next/head'
import {
  Shield, Users, User, Heart, LogOut, Settings, ArrowRight, Trophy, Activity, Calendar
} from 'lucide-react'

// --- COMPONENTS FOR DASHBOARD SECTIONS ---

const DashboardSection = ({ title, icon: Icon, link, linkText, items, emptyText, type }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <Icon size={18} className="text-blue-600"/> {title}
      </h3>
      <Link href={link} className="text-xs font-semibold text-blue-600 hover:underline">
        {linkText}
      </Link>
    </div>
    <div className="p-4">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.slice(0, 5).map((item, i) => (
            <li key={i} className="pb-2 border-b border-gray-50 last:border-0 last:pb-0">
               {type === 'team' ? (
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.sport === 'football' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      <span className="font-medium text-gray-900">{item.name}</span>
                   </div>
                   <span className="text-xs text-gray-400 uppercase">{item.sport}</span>
                 </div>
               ) : (
                 <Link href={`/tournament/${item.id}`} className="block hover:bg-gray-50 rounded p-1 -m-1 transition-colors">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="flex justify-between mt-1">
                       <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12}/> {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'TBD'}
                       </span>
                       {item.registration_status && (
                         <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">
                            {item.registration_status}
                         </span>
                       )}
                    </div>
                 </Link>
               )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)

// --- DASHBOARDS ---

const OrganizerDashboard = () => {
  const [myTournaments, setMyTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/tournaments/created')
      if (res.ok) setMyTournaments(await res.json())
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="p-6 bg-blue-100 border border-blue-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-700" />
          <h2 className="text-2xl font-bold text-blue-900">Organizer Dashboard</h2>
        </div>
        <p className="text-blue-800">
          You are managing {myTournaments.length} tournaments.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
         <DashboardSection 
            title="My Tournaments" 
            icon={Trophy} 
            link="/tournament_portal" 
            linkText="Manage All" 
            items={myTournaments} 
            emptyText="No tournaments created yet." 
            type="tournament"
         />
         {/* Placeholder for Venue Management */}
         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
            <Settings className="text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-bold text-gray-800">Venue Management</h3>
            <p className="text-sm text-gray-500 mb-4">Add stadiums and fields for your events.</p>
            <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed">Coming Soon</button>
         </div>
      </div>
    </div>
  )
}

const CoachDashboard = () => {
  const [myTeams, setMyTeams] = useState([])
  const [activeTournaments, setActiveTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [teamsRes, tourneysRes] = await Promise.all([
        fetch('/api/teams/created'),
        fetch('/api/tournaments/registered')
      ])
      if (teamsRes.ok) setMyTeams(await teamsRes.json())
      if (tourneysRes.ok) setActiveTournaments(await tourneysRes.json())
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="p-6 bg-green-100 border border-green-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-green-700" />
          <h2 className="text-2xl font-bold text-green-900">Coach Dashboard</h2>
        </div>
        <p className="text-green-800">
          Managing {myTeams.length} teams across {activeTournaments.length} tournaments.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <DashboardSection title="My Teams" icon={Activity} link="/team_portal" linkText="Manage" items={myTeams} emptyText="No teams created yet." type="team" />
        <DashboardSection title="Active Tournaments" icon={Trophy} link="/tournament_portal" linkText="Browse" items={activeTournaments} emptyText="No active tournaments." type="tournament" />
      </div>
    </div>
  )
}

const PlayerDashboard = () => {
  const [myTeams, setMyTeams] = useState([])
  const [myTournaments, setMyTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [teamsRes, tourneysRes] = await Promise.all([
        fetch('/api/teams/joined'),
        fetch('/api/tournaments/player')
      ])
      if (teamsRes.ok) setMyTeams(await teamsRes.json())
      if (tourneysRes.ok) setMyTournaments(await tourneysRes.json())
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="p-6 bg-yellow-100 border border-yellow-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8 text-yellow-700" />
          <h2 className="text-2xl font-bold text-yellow-900">Player Dashboard</h2>
        </div>
        <p className="text-yellow-800">
          Playing for {myTeams.length} teams in {myTournaments.length} tournaments.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <DashboardSection title="My Teams" icon={Activity} link="/team_portal" linkText="View All" items={myTeams} emptyText="You haven't joined any teams yet." type="team" />
        <DashboardSection title="My Tournaments" icon={Trophy} link="/tournament_portal" linkText="Browse" items={myTournaments} emptyText="No tournaments found." type="tournament" />
      </div>
    </div>
  )
}

const FanDashboard = () => (
  <div className="space-y-6">
    <div className="p-6 bg-gray-100 border border-gray-200 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <Heart className="h-8 w-8 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-800">Fan Dashboard</h2>
      </div>
      <p className="text-gray-700">
        You can follow teams and see leaderboards here.
      </p>
    </div>
    <Link href="/tournament_portal" className="block p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all text-center">
       <Trophy size={40} className="mx-auto text-red-600 mb-3" />
       <h3 className="text-xl font-bold text-gray-900">View Tournaments</h3>
       <p className="text-gray-500">See live results and upcoming matches.</p>
    </Link>
  </div>
)

// --- The Main Page ---
export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-blue-600 font-semibold">Loading Huddle...</div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case 'organizer': return <OrganizerDashboard />
      case 'coach': return <CoachDashboard />
      case 'player': return <PlayerDashboard />
      case 'fan': return <FanDashboard />
      default: return <p>Welcome! Your role is not set.</p>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard - Huddle</title>
      </Head>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600">Huddle</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/account"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Settings size={20} />
                <span className="hidden sm:inline">My Account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 p-6 bg-white rounded-lg shadow flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome, <span className="text-blue-600">{profile.username || user.email}</span>!
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500">Role:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase 
                ${profile.role === 'coach' ? 'bg-green-100 text-green-800' : 
                  profile.role === 'player' ? 'bg-yellow-100 text-yellow-800' : 
                  profile.role === 'organizer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        {renderDashboard()}

        {/* --- ACTION CARDS (Bottom Links) --- */}
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(profile.role === 'coach' || profile.role === 'player') && (
             <Link 
              href="/team_portal"
              className="group block p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Activity size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Team Portal
                    </h3>
                    <p className="text-gray-500 mt-1">Manage rosters & memberships</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" size={32} />
              </div>
            </Link>
          )}

          <Link 
            href="/tournament_portal"
            className="group block p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Trophy size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Tournament Portal
                  </h3>
                  <p className="text-gray-500 mt-1">
                    {profile.role === 'organizer' ? 'Manage your events' : 'Browse & Register'}
                  </p>
                </div>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" size={32} />
            </div>
          </Link>
        </div>

      </main>
    </div>
  )
}