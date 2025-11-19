import { useState, useEffect } from 'react'
import { Shield, Calendar } from 'lucide-react'
import Link from 'next/link'
import EmptyState from '../ui/EmptyState' // NEW

export default function PlayerTeamList() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const res = await fetch('/api/teams/joined')
    if (res.ok) setTeams(await res.json())
    setLoading(false)
  }

  if (loading) return <p className="text-gray-500 mt-4">Loading your teams...</p>

  if (teams.length === 0) {
    return <EmptyState icon={Shield} title="No teams yet" message="Enter a code above to join your coach's team." />
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">My Teams</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/team/${team.id}`} className="font-bold text-lg text-gray-900 hover:text-yellow-600 hover:underline">
                  {team.name}
                </Link>
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full capitalize mt-1 block w-max">
                  {team.sport}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">Coach:</span> {team.coach_name}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Calendar size={14} /> Joined: {new Date(team.joined_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}