import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, Users, UserPlus, Trophy } from 'lucide-react'

// Import Team Components
import CreateTeamForm from '../components/teams/CreateTeamForm'
import CoachTeamList from '../components/teams/CoachTeamList'
import JoinTeamForm from '../components/teams/JoinTeamForm'
import PlayerTeamList from '../components/teams/PlayerTeamList'

export default function TeamPortal() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Loading Portal...
      </div>
    )
  }

  // Organizers shouldn't be here
  if (profile.role === 'organizer') {
     return (
        <div className="p-10 text-center">
            <p>Organizers should use the Tournament Portal.</p>
            <Link href="/tournament_portal" className="text-blue-600 underline">Go there</Link>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Team Portal - Huddle</title>
      </Head>

      <div className="max-w-6xl mx-auto p-6 pt-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Portal</h1>
            <p className="text-gray-500">Manage your team memberships and registrations here.</p>
          </div>
        </div>

        {/* --- COACH VIEW --- */}
        {profile.role === 'coach' && (
          <div className="space-y-8">
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                <Users size={24} /> Coach Workspace
              </h2>
              <p className="text-green-700">
                Create new teams for the upcoming season and manage your existing squads.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Create Form */}
              <div className="lg:col-span-1">
                <CreateTeamForm onTeamCreated={() => setRefreshKey(k => k + 1)} />
              </div>
              
              {/* Right Column: Team List */}
              <div className="lg:col-span-2">
                <CoachTeamList key={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {/* --- PLAYER VIEW --- */}
        {profile.role === 'player' && (
          <div className="space-y-8">
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <UserPlus size={24} /> Player Workspace
              </h2>
              <p className="text-yellow-700">
                Join your coach's team using a Join Code or view your current team memberships.
              </p>
            </div>

             <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Join Form */}
              <div className="lg:col-span-1">
                <JoinTeamForm onJoinSuccess={() => setRefreshKey(k => k + 1)} />
              </div>

              {/* Right Column: Team List */}
              <div className="lg:col-span-2">
                <PlayerTeamList key={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {/* --- FAN VIEW --- */}
        {profile.role === 'fan' && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Actions Available</h3>
            <p className="text-gray-500 mt-2">
              As a Fan, you don't need to create or join teams.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}