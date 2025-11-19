import { useAuth } from '../context/AuthContext'
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
  const { profile } = useAuth()

  // No loading check needed here! Layout handles it.

  return (
    <Layout title="Dashboard - Huddle">
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-blue-600">{profile.username}</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500 text-sm">Current Role:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
              ${profile.role === 'coach' ? 'bg-green-100 text-green-800' : 
                profile.role === 'player' ? 'bg-yellow-100 text-yellow-800' : 
                profile.role === 'organizer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Role Content */}
      {profile.role === 'organizer' && <OrganizerDashboard />}
      {profile.role === 'coach' && <CoachDashboard />}
      {profile.role === 'player' && <PlayerDashboard />}
      {profile.role === 'fan' && <FanDashboard />}

      {/* Footer Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {(profile.role === 'coach' || profile.role === 'player') && <TeamPortalCard />}
        <TournamentPortalCard role={profile.role} />
      </div>
    </Layout>
  )
}