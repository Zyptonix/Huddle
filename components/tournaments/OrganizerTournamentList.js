import { useState, useEffect } from 'react'
import { Trophy, Calendar, Users } from 'lucide-react'

export default function OrganizerTournamentList() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    const res = await fetch('/api/tournaments/created')
    if (res.ok) {
      const data = await res.json()
      setTournaments(data)
    }
    setLoading(false)
  }

  if (loading) return <p className="text-gray-500 mt-4">Loading tournaments...</p>

  if (tournaments.length === 0) {
    return (
      <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Trophy className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tournaments yet</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first tournament to get started.</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Your Tournaments</h3>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {tournaments.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg text-gray-900">{t.name}</h4>
                <div className="flex gap-2 mt-1">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                    {t.sport}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full capitalize">
                    {t.format.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {t.status}
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} /> 
                {t.start_date ? new Date(t.start_date).toLocaleDateString() : 'Date TBD'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}