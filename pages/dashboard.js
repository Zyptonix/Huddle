import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import Head from 'next/head'
import {
  Shield,
  Users,
  User,
  Heart,
  LogOut,
  Settings,
} from 'lucide-react'

// --- Define simple components for each role's dashboard ---
const OrganizerDashboard = () => (
  <div className="p-6 bg-blue-100 border border-blue-200 rounded-lg shadow-md">
    <div className="flex items-center gap-3 mb-3">
      <Shield className="h-8 w-8 text-blue-600" />
      <h2 className="text-2xl font-bold text-blue-800">Organizer Dashboard</h2>
    </div>
    <p className="text-blue-700">
      You can create tournaments and manage venues here.
    </p>
  </div>
)
const CoachDashboard = () => (
  <div className="p-6 bg-green-100 border border-green-200 rounded-lg shadow-md">
    <div className="flex items-center gap-3 mb-3">
      <Users className="h-8 w-8 text-green-600" />
      <h2 className="text-2xl font-bold text-green-800">Coach Dashboard</h2>
    </div>
    <p className="text-green-700">
      You can manage your roster and plan tactics here.
    </p>
  </div>
)
const PlayerDashboard = () => (
  <div className="p-6 bg-yellow-100 border border-yellow-200 rounded-lg shadow-md">
    <div className="flex items-center gap-3 mb-3">
      <User className="h-8 w-8 text-yellow-600" />
      <h2 className="text-2xl font-bold text-yellow-800">Player Dashboard</h2>
    </div>
    <p className="text-yellow-700">
      You can view your stats and check your schedule here.
    </p>
  </div>
)
const FanDashboard = () => (
  <div className="p-6 bg-gray-100 border border-gray-200 rounded-lg shadow-md">
    <div className="flex items-center gap-3 mb-3">
      <Heart className="h-8 w-8 text-red-600" />
      <h2 className="text-2xl font-bold text-gray-800">Fan Dashboard</h2>
    </div>
    <p className="text-gray-700">
      You can follow teams and see leaderboards here.
    </p>
  </div>
)

// --- The Main Page ---
export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // 1. Redirect to login if user is not found
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 2. Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 3. Show loading state
  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading dashboard...
      </div>
    )
  }

  // 4. Render the correct dashboard based on role
  const renderDashboard = () => {
    switch (profile.role) {
      case 'organizer':
        return <OrganizerDashboard />
      case 'coach':
        return <CoachDashboard />
      case 'player':
        return <PlayerDashboard />
      case 'fan':
        return <FanDashboard />
      default:
        return <p>Welcome! Your role is not set.</p>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Your Dashboard - Huddle</title>
      </Head>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome,{' '}
            <span className="text-blue-600">
              {profile.username || user.email}
            </span>
            !
          </h2>
          <p className="text-gray-600 mt-1">
            Your role is: <strong>{profile.role}</strong>
          </p>
        </div>

        {renderDashboard()}
      </main>
    </div>
  )
}