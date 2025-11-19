import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, User, Shield, Users, Calendar } from 'lucide-react'

export default function TeamPage() {
  const router = useRouter()
  const { id } = router.query
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) fetchTeam()
  }, [id])

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${id}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      setTeam(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading team...</div>
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>
  if (!team) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{team.name} - Huddle</title>
      </Head>

      <div className="max-w-5xl mx-auto p-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:underline mb-6">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        {/* Team Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{team.name}</h1>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase">
                  {team.sport}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield size={18} />
                <span>Coach: <strong>{team.coach?.username || 'Unknown'}</strong></span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-gray-400 text-sm font-mono block">Join Code</span>
               <span className="text-2xl font-mono font-bold text-gray-800">{team.join_code}</span>
            </div>
          </div>
        </div>

        {/* Roster Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="text-blue-600" /> Team Roster
            <span className="text-gray-400 text-lg font-normal">({team.roster.length} Players)</span>
          </h2>

          {team.roster.length === 0 ? (
             <p className="text-gray-500 italic">No players have joined this team yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.roster.map((player) => (
                <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="text-gray-400" size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{player.username || 'Unnamed Player'}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar size={12} />
                      Joined {new Date(player.joined_at).toLocaleDateString()}
                    </div>
                    {player.height && <p className="text-xs text-gray-500">Height: {player.height}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}