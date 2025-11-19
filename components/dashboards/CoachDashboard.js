import { useState, useEffect } from 'react'
import { Users, Activity, Trophy, Swords, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import DashboardSection from './DashboardSection'
import StatCard from '../ui/StatCard'

export default function CoachDashboard() {
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

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading coach data...</div>

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 shadow-lg overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-green-200" /> Coach's Locker Room
          </h2>
          <p className="text-green-100 max-w-2xl">
            Prepare your squads, manage rosters, and plan your next victory.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="My Teams" value={myTeams.length} icon={Activity} color="blue" />
        <StatCard label="Active Tournaments" value={activeTournaments.length} icon={Trophy} color="yellow" />
        <StatCard label="Pending Requests" value="0" icon={ClipboardList} color="green" /> {/* Placeholder */}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <DashboardSection title="My Teams" icon={Activity} link="/team_portal" linkText="Manage" items={myTeams} emptyText="No teams created yet." type="team" />
          <DashboardSection title="Active Tournaments" icon={Trophy} link="/tournament_portal" linkText="Browse" items={activeTournaments} emptyText="No active tournaments." type="tournament" />
        </div>

        <div className="space-y-4">
           <Link 
              href="/tactics/new" 
              className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Swords size={24} />
                </div>
                <h3 className="font-bold text-gray-900">Tactics Board</h3>
              </div>
              <p className="text-sm text-gray-500">Draw formations and strategize for your next match.</p>
            </Link>

            <Link 
              href="/team_portal" 
              className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-green-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-green-50 rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-gray-900">Roster Management</h3>
              </div>
              <p className="text-sm text-gray-500">Add players and manage invites.</p>
            </Link>
        </div>
      </div>
    </div>
  )
}