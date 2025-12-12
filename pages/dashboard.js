import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/ui/Layout'


// Action Cards
import TeamPortalCard from '../components/dashboards/TeamPortalCard'
import TournamentPortalCard from '../components/dashboards/TournamentPortalCard'
import PlayerAvailabilityCard from '../components/dashboards/PlayerAvailabilityCard'
import MessagesPortalCard from '../components/dashboards/MessagesPortalCard'
import DashboardView from '../components/dashboards/DashboardView'
import Loading from '../components/ui/Loading'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Debug Log
  console.log('[Dashboard Debug] Render:', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile 
  })

  useEffect(() => {
    if (!loading && !user) {
      console.log('[Dashboard Debug] Redirecting to login...')
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <Loading message="Authenticating..." />
  }

  if (!user) return null

  // If user exists but no profile, show specific loading state
  if (user && !profile) {
    console.log('[Dashboard Debug] User exists but Profile missing. Showing setup loader.')
    return <Loading message="Setting up your profile..." />
  }

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
        {profile.role === 'coach' && <PlayerAvailabilityCard />}
        <TournamentPortalCard role={profile.role} />
        <MessagesPortalCard />
      </div>
      <DashboardView user={user} profile={profile} />
    </Layout>
  )
}