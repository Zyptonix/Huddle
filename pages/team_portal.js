import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
// FIX: Correct path
import Layout from '../components/ui/Layout'

// Portal Views
import CoachTeamView from '../components/portals/CoachTeamView'
import PlayerTeamView from '../components/portals/PlayerTeamView'

export default function TeamPortal() {
  const { profile } = useAuth()

  // Organizer Redirect View
  if (profile.role === 'organizer') {
     return (
        <Layout title="Team Portal">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-blue-50 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Organizers don't manage teams here.</h3>
            <p className="text-gray-500 mb-4">Please use the Tournament Portal to manage your events.</p>
            <Link href="/tournament_portal" className="text-blue-600 font-semibold hover:underline">
              Go to Tournament Portal &rarr;
            </Link>
          </div>
        </Layout>
     )
  }

  return (
    <Layout title="Team Portal - Huddle">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Portal</h1>
          <p className="text-gray-500">Manage your team memberships and registrations.</p>
        </div>
      </div>

      {profile.role === 'coach' && <CoachTeamView />}
      {profile.role === 'player' && <PlayerTeamView />}
      
      {profile.role === 'fan' && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Fan Access</h3>
          <p className="text-gray-500 mt-2">Fans view teams through the Tournament pages.</p>
        </div>
      )}
    </Layout>
  )
}