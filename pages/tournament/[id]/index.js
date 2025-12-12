import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import Layout from '../../../components/ui/Layout' // Using the generic Light Mode Layout
import TournamentLayout from '@/components/tournaments/TournamentLayout'
import { 
  Trophy, Calendar, Users, MapPin, 
  Clock, Activity, Tv, Edit3, Loader, Share2 
} from 'lucide-react'

// Helper for dates
const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function TournamentOverview() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`)
      if (res.ok) {
        setData(await res.json())
      } else {
        console.error("Failed to load tournament data")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- LOADING STATE ---
  if (loading) return (
    <Layout>
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    </Layout>
  )

  // --- ERROR STATE ---
  if (!data) return (
    <Layout>
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
        Tournament not found
      </div>
    </Layout>
  )

  const isOrganizer = user?.id === data.organizer_id

  // --- FILTERING LOGIC ---
  const liveMatches = data.matches?.filter(m => m.status === 'live') || []
  const upcomingMatches = data.matches?.filter(m => m.status === 'scheduled') || []
  const finishedMatches = data.matches?.filter(m => m.status === 'finished') || []

  // Feature Priority: Live -> Upcoming -> None
  const featuredMatch = liveMatches.length > 0 ? liveMatches[0] : upcomingMatches[0]

  return (
    <TournamentLayout tournament={data} loading={loading} error={!data}>
       <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-indigo-200">
                        {data.sport} League
                     </span>
                     {data.status === 'live' && (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-200 flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Live
                        </span>
                     )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900">{data.name}</h1>
               </div>
               {isOrganizer && (
                  <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                     Manage Settings
                  </button>
               )}
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Teams</p>
                     <p className="text-xl font-bold text-gray-900">{data.teams?.length || 0}</p>
                  </div>
               </div>
               
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Activity size={20} /></div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Live Now</p>
                     <p className="text-xl font-bold text-gray-900">{liveMatches.length}</p>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Calendar size={20} /></div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Start Date</p>
                     <p className="text-lg font-bold text-gray-900 leading-tight">{new Date(data.start_date).toLocaleDateString()}</p>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-gray-100 text-gray-600 rounded-lg"><Trophy size={20} /></div>
                  <div>
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Finished</p>
                     <p className="text-xl font-bold text-gray-900">{finishedMatches.length}</p>
                  </div>
               </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
               
               {/* MAIN FEED */}
               <div className="lg:col-span-2 space-y-6">
                  
                  {/* FEATURED MATCH CARD */}
                  <div>
                     <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                       <Clock size={18} className="text-indigo-600" /> Match Center
                     </h3>

                     {featuredMatch ? (
                        <div className={`bg-white rounded-2xl border ${featuredMatch.status === 'live' ? 'border-red-200 ring-4 ring-red-50 shadow-red-100' : 'border-gray-200'} shadow-sm overflow-hidden transition-all`}>
                           
                           {/* Match Header */}
                           <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(featuredMatch.match_time)}</span>
                              {featuredMatch.status === 'live' ? (
                                  <span className="flex items-center gap-1 text-red-600 font-bold animate-pulse">● LIVE NOW</span>
                              ) : (
                                  <span className="text-gray-400 font-bold tracking-wider">UPCOMING</span>
                              )}
                              <span className="flex items-center gap-1"><MapPin size={12}/> {featuredMatch.venue || 'Main Stadium'}</span>
                           </div>
                           
                           {/* Match Content */}
                           <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                              {/* Team A */}
                              <div className="flex-1 text-center">
                                 <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-600 border border-gray-200">
                                    {featuredMatch.teams_a?.name?.[0] || 'A'}
                                 </div>
                                 <h4 className="font-bold text-gray-900 text-lg">{featuredMatch.teams_a?.name || 'TBD'}</h4>
                              </div>

                              {/* Score/VS */}
                              <div className="px-6 flex flex-col items-center min-w-[120px]">
                                 {featuredMatch.status === 'live' ? (
                                     <div className="text-4xl font-mono font-black text-gray-900 tracking-widest">
                                         {featuredMatch.score_a} - {featuredMatch.score_b}
                                     </div>
                                 ) : (
                                     <div className="text-3xl font-black text-gray-200 italic">VS</div>
                                 )}
                                 
                                 {/* Action Buttons */}
                                 <div className="mt-6 flex gap-2 w-full">
                                      <Link href={`/match/${featuredMatch.id}`} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-3 rounded-lg text-center flex items-center justify-center gap-2 shadow-md transition-all">
                                          <Tv size={14} /> Watch
                                      </Link>
                                      {isOrganizer && featuredMatch.status !== 'finished' && (
                                          <Link href={`/match/${featuredMatch.id}/operator`} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 px-3 rounded-lg text-center flex items-center justify-center gap-2 transition-all">
                                              <Edit3 size={14} /> Manage
                                          </Link>
                                      )}
                                 </div>
                              </div>

                              {/* Team B */}
                              <div className="flex-1 text-center">
                                 <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-600 border border-gray-200">
                                    {featuredMatch.teams_b?.name?.[0] || 'B'}
                                 </div>
                                 <h4 className="font-bold text-gray-900 text-lg">{featuredMatch.teams_b?.name || 'TBD'}</h4>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="bg-white rounded-xl p-10 text-center border-2 border-dashed border-gray-200">
                           <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                           <p className="text-gray-500 font-medium">No matches scheduled yet.</p>
                        </div>
                     )}
                  </div>

                  {/* RECENT RESULTS */}
                  {finishedMatches.length > 0 && (
                     <div>
                        <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 mt-8 tracking-wider">Recent Results</h3>
                        <div className="space-y-3">
                           {finishedMatches.slice(0, 5).map(m => (
                              <div key={m.id} className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow group">
                                 <div className="flex items-center gap-4">
                                    <span className="text-gray-400 text-xs font-mono w-16">{new Date(m.match_time).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                    <div className="flex items-center gap-3 text-sm">
                                       <span className="font-semibold text-gray-900 text-right w-24 truncate">{m.teams_a?.name}</span>
                                       <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono font-bold text-xs border border-gray-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                                          {m.score_a} - {m.score_b}
                                       </span>
                                       <span className="font-semibold text-gray-900 w-24 truncate">{m.teams_b?.name}</span>
                                    </div>
                                 </div>
                                 <Link href={`/match/${m.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
                                    Report
                                 </Link>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* SIDEBAR */}
               <div className="space-y-6">
                  {/* Rules Card */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                     <h3 className="font-bold text-gray-900 mb-4">Tournament Info</h3>
                     <ul className="space-y-4 text-sm text-gray-600">
                        <li className="flex items-start gap-3">
                           <div className="min-w-[4px] h-4 bg-indigo-500 rounded-full mt-0.5"></div>
                           <span>Format: <span className="font-semibold text-gray-900">{data.format}</span></span>
                        </li>
                        <li className="flex items-start gap-3">
                           <div className="min-w-[4px] h-4 bg-blue-500 rounded-full mt-0.5"></div>
                           <span>Sport: <span className="font-semibold text-gray-900 capitalize">{data.sport}</span></span>
                        </li>
                        <li className="flex items-start gap-3">
                           <div className="min-w-[4px] h-4 bg-emerald-500 rounded-full mt-0.5"></div>
                           <span>Max Teams: <span className="font-semibold text-gray-900">{data.max_teams || 'Unlimited'}</span></span>
                        </li>
                     </ul>
                  </div>

                  {/* Share Card */}
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 rounded-xl shadow-lg text-center text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                     <div className="relative z-10">
                        <Share2 className="mx-auto w-8 h-8 mb-3 opacity-80" />
                        <h3 className="font-bold text-lg mb-2">Invite Players</h3>
                        <p className="text-xs text-indigo-100 mb-6 px-4">Share this tournament link with team captains to get them registered.</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(window.location.href)}
                          className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors w-full shadow-sm"
                        >
                           Copy Link
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
       </div>
    </TournamentLayout>
  )
}