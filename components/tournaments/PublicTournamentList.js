import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Calendar, Shield, ArrowRight } from 'lucide-react'
import EmptyState from '../ui/EmptyState' // NEW

export default function PublicTournamentList() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournaments = async () => {
      const res = await fetch('/api/tournaments/all')
      if (res.ok) setTournaments(await res.json())
      setLoading(false)
    }
    fetchTournaments()
  }, [])

  if (loading) return <div className="text-center p-10 text-gray-500">Loading tournaments...</div>

  if (tournaments.length === 0) {
    return <EmptyState icon={Trophy} title="No tournaments found" message="Check back later for upcoming events." />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((t) => (
        <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                t.sport === 'football' ? 'bg-green-100 text-green-800' : 
                t.sport === 'cricket' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {t.sport}
              </span>
              <span className="text-xs font-medium text-gray-500 border px-2 py-1 rounded">
                {t.format.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Shield size={16} />
              <span>By {t.profiles?.username || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{t.start_date ? new Date(t.start_date).toLocaleDateString() : 'Coming Soon'}</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <Link 
              href={`/tournament/${t.id}`}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
            >
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}