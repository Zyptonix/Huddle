import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'

// FIX: Correct path to UI Atom
import Layout from '../components/ui/Layout'

// Dashboards
import OrganizerDashboard from '../components/dashboards/OrganizerDashboard'
import CoachDashboard from '../components/dashboards/CoachDashboard'
import PlayerDashboard from '../components/dashboards/PlayerDashboard'
import FanDashboard from '../components/dashboards/FanDashboard'

// Action Cards
import TeamPortalCard from '../components/dashboards/TeamPortalCard'
import TournamentPortalCard from '../components/dashboards/TournamentPortalCard'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // --- FIX: Restore the guard clause ---
  if (loading || !user || !profile) return null

  // --- HELPER: Get Theme based on Role ---
  const getTheme = (role) => {
    switch (role) {
      case 'organizer': return { gradient: 'from-blue-600 to-indigo-700', icon: '🛡️' }
      case 'coach': return { gradient: 'from-green-600 to-emerald-700', icon: '📋' }
      case 'player': return { gradient: 'from-yellow-500 to-amber-600', icon: '⚽' }
      case 'fan': return { gradient: 'from-red-500 to-rose-600', icon: '❤️' }
      default: return { gradient: 'from-gray-600 to-gray-700', icon: '👤' }
    }
  }

  const theme = getTheme(profile.role)

  return (
    <Layout title="Dashboard - Huddle">
      
      {/* --- NEW HERO BANNER --- */}
      <div className={`relative mb-10 rounded-2xl shadow-xl overflow-hidden bg-gradient-to-r ${theme.gradient} text-white`}>
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">
              Welcome back, {profile.username}!
            </h2>
            <div className="flex items-center gap-3 text-blue-50 font-medium">
              <span className="bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-sm uppercase tracking-wide flex items-center gap-2">
                <span>{theme.icon}</span> {profile.role}
              </span>
              <span className="opacity-75 text-sm hidden sm:inline">{user.email}</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-wider opacity-80 font-bold">Today is</p>
            <p className="text-2xl font-bold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* --- Role Content --- */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {profile.role === 'organizer' && <OrganizerDashboard />}
        {profile.role === 'coach' && <CoachDashboard />}
        {profile.role === 'player' && <PlayerDashboard />}
        {profile.role === 'fan' && <FanDashboard />}
      </div>

      {/* --- Footer Actions --- */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {(profile.role === 'coach' || profile.role === 'player') && <TeamPortalCard />}
        <TournamentPortalCard role={profile.role} />
      </div>
    </Layout>
  )
}