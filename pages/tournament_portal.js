import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, Shield, Trophy, Search } from 'lucide-react'

// Components
import CreateTournamentForm from '../components/tournaments/CreateTournamentForm'
import OrganizerTournamentList from '../components/tournaments/OrganizerTournamentList'
import PublicTournamentList from '../components/tournaments/PublicTournamentList'

export default function TournamentPortal() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user || !profile) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>
  }

  // --- ORGANIZER VIEW (Management) ---
  if (profile.role === 'organizer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head><title>Tournament Manager - Huddle</title></Head>

        <div className="max-w-6xl mx-auto p-6 pt-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournament Manager</h1>
              <p className="text-gray-500">Create and manage your multi-sport events.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <CreateTournamentForm onTournamentCreated={() => setRefreshKey(k => k + 1)} />
            </div>
            <div className="lg:col-span-2">
              <OrganizerTournamentList key={refreshKey} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- COACH / PLAYER / FAN VIEW (Browsing) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Browse Tournaments - Huddle</title></Head>

      <div className="max-w-6xl mx-auto p-6 pt-12">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Explore Tournaments</h1>
            <p className="text-gray-500">Find active tournaments and register your teams.</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-8">
          <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-2">
             <Search size={20} /> Ready to compete?
          </h2>
          <p className="text-blue-700">
            Browse the list below. Click <strong>"View Details"</strong> to see the schedule, teams, and register your squad.
          </p>
        </div>

        <PublicTournamentList />
      </div>
    </div>
  )
}