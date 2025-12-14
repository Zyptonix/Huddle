import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/ui/Layout'
import { 
  Trophy, Plus, Search, Calendar, 
  Users, ChevronRight, Loader, 
  Briefcase, Medal, Globe // Icons
} from 'lucide-react'

export default function TournamentPortal() {
  const { user, profile, loading: authLoading } = useAuth()
  
  const [tournaments, setTournaments] = useState([])
  const [myTeamIds, setMyTeamIds] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  // State for Filters & Tabs
  const [activeTab, setActiveTab] = useState('') 
  const [statusFilter, setStatusFilter] = useState('all') 
  const [searchQuery, setSearchQuery] = useState('') // <--- NEW: Search State

  const isOrganizer = profile?.role === 'organizer'
  const isParticipant = profile?.role === 'coach' || profile?.role === 'player'

  // 1. Set Default Tab based on Role
  useEffect(() => {
    if (!authLoading && profile) {
      if (isOrganizer) setActiveTab('organizing')
      else if (isParticipant) setActiveTab('participating')
      else setActiveTab('discover')
    }
  }, [authLoading, profile])

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsRes, myTeamsRes] = await Promise.all([
            fetch('/api/tournaments/all'),
            fetch('/api/teams/my-teams') 
        ])

        if (tournamentsRes.ok) {
           setTournaments(await tournamentsRes.json())
        }
        
        if (myTeamsRes.ok) {
            setMyTeamIds(await myTeamsRes.json())
        }

      } catch (error) {
        console.error("Failed to load data", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading && user) fetchData()
  }, [authLoading, user])

  // --- Helper: Check participation ---
  const isParticipatingIn = (tournament) => {
    if (!tournament.teams) return false
    return tournament.teams.some(item => myTeamIds.includes(item.team_id))
  }

  // --- CORE FILTERING LOGIC ---
  const filteredTournaments = tournaments.filter(t => {
    const amIOrganizer = t.organizer_id === user?.id
    const amIParticipating = isParticipatingIn(t)

    // 1. Search Filter (Name check)
    if (searchQuery) {
        if (!t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
        }
    }

    // 2. Tab Logic
    if (activeTab === 'organizing') {
        if (!amIOrganizer) return false
    }
    else if (activeTab === 'participating') {
        if (!amIParticipating) return false
    }
    else if (activeTab === 'discover') {
        // Exclude my events AND events I am playing in
        if (amIOrganizer || amIParticipating) return false
    }

    // 3. Status Filter (Live/Upcoming)
    if (statusFilter !== 'all') {
        if (t.status !== statusFilter) return false
    }

    return true
  })

  // Helper for Status Badge Color
  const getStatusColor = (status) => {
    switch(status) {
      case 'live': return 'bg-red-100 text-red-600 border-red-200 animate-pulse'
      case 'upcoming': return 'bg-blue-100 text-blue-600 border-blue-200'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (authLoading || loading) return <Layout><div className="p-10 text-center text-gray-500">Loading Portal...</div></Layout>

  return (
    <Layout title="Tournament Portal">
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Trophy className="text-yellow-500 fill-yellow-500" /> Tournament Portal
              </h1>
              <p className="text-gray-500 mt-1">Manage your events and discover new competitions.</p>
            </div>
            
            {isOrganizer && (
              <Link href="/tournament/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md flex items-center gap-2">
                 <Plus size={18} /> Create Event
              </Link>
            )}
          </div>

          {/* TABS NAVIGATION */}
          <div className="border-b border-gray-200 flex gap-8 mt-6 overflow-x-auto">
            {isOrganizer && (
                <button 
                    onClick={() => setActiveTab('organizing')}
                    className={`pb-3 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'organizing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Briefcase size={18}/> My Events
                </button>
            )}

            {isParticipant && (
                <button 
                    onClick={() => setActiveTab('participating')}
                    className={`pb-3 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'participating' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Medal size={18}/> Participating
                </button>
            )}

            <button 
                onClick={() => setActiveTab('discover')}
                className={`pb-3 flex items-center gap-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'discover' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Globe size={18}/> Discover
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
             
             {/* Search Input */}
             <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Search tournaments..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium shadow-sm"
                />
             </div>
            
            {/* Status Buttons */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shrink-0 w-full sm:w-auto overflow-x-auto">
              {['all', 'live', 'upcoming'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${statusFilter === f ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* RESULTS GRID */}
          {filteredTournaments.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
              <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {searchQuery ? `No results for "${searchQuery}"` : (activeTab === 'participating' ? "No active participations." : "No tournaments found.")}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'participating' ? "Join a tournament from the 'Discover' tab." : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full flex flex-col">
                    
                    {/* Card Header */}
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

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {tournament.name}
                      </h3>
                      
                      <div className="space-y-3 mt-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={16} className="text-indigo-400" />
                          <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users size={16} className="text-indigo-400" />
                          <span>
                            {tournament.teams?.length || 0} / {tournament.max_teams || '∞'} Teams
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                         <span className="text-indigo-600 font-bold text-sm flex items-center gap-1">
                            View Details <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                         </span>
                         
                         {activeTab === 'participating' && (
                             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Joined</span>
                         )}
                         {activeTab === 'organizing' && (
                             <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">Host</span>
                         )}
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