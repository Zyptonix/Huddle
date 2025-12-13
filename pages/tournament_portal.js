import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext' // Adjust path if needed
import Layout from '../components/ui/Layout'
import { 
  Trophy, Plus, Search, MapPin, Calendar, 
  Users, ChevronRight, Loader, Filter
} from 'lucide-react'

export default function TournamentPortal() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'live'

  // --- 1. Safe Role Access (The Fix for the Build Error) ---
  // We use optional chaining (?.) so it doesn't crash if profile is null
  const isOrganizer = profile?.role === 'organizer'

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      // Assuming you have an API to get all tournaments
      const res = await fetch('/api/tournaments/all') 
      if (res.ok) {
        const data = await res.json()
        setTournaments(data)
      }
    } catch (error) {
      console.error("Failed to load tournaments", error)
    } finally {
      setLoading(false)
    }
  }

  // --- Filtering Logic ---
  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'all') return true
    return t.status === filter
  })

  // --- Render Helpers ---
  const getStatusColor = (status) => {
    switch(status) {
      case 'live': return 'bg-red-100 text-red-600 border-red-200 animate-pulse'
      case 'upcoming': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // --- Loading State ---
  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Tournament Portal">
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* --- Header & Actions --- */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Trophy className="text-yellow-500 fill-yellow-500" /> Tournament Portal
              </h1>
              <p className="text-gray-500 mt-1">Discover, compete, and manage leagues.</p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {/* Only show Create button if safe check passes */}
              {isOrganizer && (
                <Link 
                  href="/tournament/create" 
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md shadow-indigo-200"
                >
                  <Plus size={18} /> Create Event
                </Link>
              )}
            </div>
          </div>

          {/* --- Filters & Search --- */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search tournaments..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium"
              />
            </div>
            
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
              {['all', 'live', 'upcoming'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    filter === f 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* --- Tournament Grid --- */}
          {filteredTournaments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No tournaments found</h3>
              <p className="text-gray-500">Try adjusting your filters or search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full flex flex-col">
                    
                    {/* Card Header (Gradient) */}
                    <div className="h-32 bg-gradient-to-r from-slate-800 to-indigo-900 relative p-4 flex flex-col justify-between">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(tournament.status)}`}>
                          {tournament.status === 'live' && '● '} {tournament.status}
                        </span>
                        <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase">
                          {tournament.sport}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {tournament.name}
                      </h3>
                      
                      <div className="space-y-3 mt-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={16} className="text-indigo-400" />
                          <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={16} className="text-indigo-400" />
                          <span className="truncate">{tournament.venue || 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users size={16} className="text-indigo-400" />
                          <span>{tournament.teams_count || 0} / {tournament.max_teams || '∞'} Teams</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-indigo-600 font-bold text-sm">
                        <span>View Details</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}