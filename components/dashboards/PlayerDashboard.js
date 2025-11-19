import { useState, useEffect } from 'react'
import { User, Activity, Trophy, Star } from 'lucide-react'
import DashboardSection from './DashboardSection'
import StatCard from '../ui/StatCard'

export default function PlayerDashboard() {
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

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading player data...</div>

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl p-8 shadow-lg overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <User className="h-8 w-8 text-yellow-100" /> Player Hub
          </h2>
          <p className="text-yellow-50 max-w-2xl">
            Track your performance, view your schedule, and stay connected with your team.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Team Memberships" value={myTeams.length} icon={Activity} color="blue" />
        <StatCard label="Tournaments" value={myTournaments.length} icon={Trophy} color="green" />
        <StatCard label="Goals Scored" value="-" icon={Star} color="yellow" /> {/* Placeholder for future feature */}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <DashboardSection title="My Teams" icon={Activity} link="/team_portal" linkText="View All" items={myTeams} emptyText="You haven't joined any teams yet." type="team" />
        <DashboardSection title="My Tournaments" icon={Trophy} link="/tournament_portal" linkText="Browse" items={myTournaments} emptyText="No tournaments found." type="tournament" />
      </div>
    </div>
  )
}