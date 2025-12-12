import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TournamentLayout from '../../../components/tournaments/TournamentLayout'
import { 
  Trophy, Calendar, Users, ArrowRight, MapPin, 
  Clock, AlertCircle, ChevronRight, Activity 
} from 'lucide-react'

// Helper for nice dates
const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric' 
  })
}

export default function TournamentOverview() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!data && loading) return <TournamentLayout loading={true} />
  if (!data) return <TournamentLayout error="Tournament not found" />

  const nextMatch = data.matches?.find(m => m.status === 'scheduled')
  const activeMatches = data.matches?.filter(m => m.status === 'live') || []
  const latestNews = data.announcements?.[0]

  return (
    <TournamentLayout tournament={data} loading={loading}>
       <div className="space-y-8">
          
          {/* 1. HERO STATS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                   <Users size={20} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-bold uppercase">Teams</p>
                   <p className="text-xl font-bold text-gray-900">{data.teams?.length || 0}</p>
                </div>
             </div>
             
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                   <Trophy size={20} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-bold uppercase">Matches</p>
                   <p className="text-xl font-bold text-gray-900">{data.matches?.length || 0}</p>
                </div>
             </div>

             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                   <Calendar size={20} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-bold uppercase">Start Date</p>
                   <p className="text-lg font-bold text-gray-900 leading-tight">{formatDate(data.start_date)}</p>
                </div>
             </div>

             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                   <Activity size={20} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                   <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 uppercase">
                     {data.status}
                   </span>
                </div>
             </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
             
             {/* 2. MAIN FEED (Left 2/3) */}
             <div className="lg:col-span-2 space-y-6">
                
                {/* NEXT MATCH TICKET */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Clock size={18} /> Match Center
                      </h3>
                      <Link href={`/tournament/${id}/fixtures`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Full Schedule &rarr;
                      </Link>
                   </div>

                   {nextMatch ? (
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                         {/* Ticket Header */}
                         <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(nextMatch.date)}</span>
                            <span className="flex items-center gap-1"><MapPin size={12}/> {nextMatch.venue?.name || 'Main Stadium'}</span>
                         </div>
                         
                         {/* Match Content */}
                         <div className="p-6 flex items-center justify-between">
                            {/* Team A */}
                            <div className="flex-1 text-center">
                               <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                                  {/* Placeholder for Logo */}
                                  {nextMatch.team_a?.name?.[0] || 'A'}
                               </div>
                               <h4 className="font-bold text-gray-900 text-lg">{nextMatch.team_a?.name || 'TBD'}</h4>
                            </div>

                            {/* VS Badge */}
                            <div className="px-6 flex flex-col items-center">
                               <div className="text-3xl font-black text-gray-200 italic">VS</div>
                               <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                                  {nextMatch.time || '20:00'}
                               </div>
                            </div>

                            {/* Team B */}
                            <div className="flex-1 text-center">
                               <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                                  {/* Placeholder for Logo */}
                                  {nextMatch.team_b?.name?.[0] || 'B'}
                               </div>
                               <h4 className="font-bold text-gray-900 text-lg">{nextMatch.team_b?.name || 'TBD'}</h4>
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                         <Trophy className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                         <p className="text-gray-500 font-medium">No matches scheduled yet.</p>
                      </div>
                   )}
                </div>

                {/* LATEST ANNOUNCEMENT */}
                <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                   <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                      <AlertCircle size={18} /> Tournament News
                   </h3>
                   
                   {latestNews ? (
                      <div className="relative z-10">
                         <h4 className="font-bold text-xl mb-2">{latestNews.title}</h4>
                         <p className="text-indigo-100 leading-relaxed mb-4 line-clamp-2">{latestNews.content}</p>
                         <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="text-xs text-indigo-300">{new Date(latestNews.created_at).toLocaleDateString()}</span>
                            <Link href={`/tournament/${id}/announcements`} className="text-sm font-bold hover:text-white text-indigo-200 flex items-center gap-1">
                               Read More <ChevronRight size={14}/>
                            </Link>
                         </div>
                      </div>
                   ) : (
                      <div className="relative z-10 text-indigo-200 italic">
                         No recent announcements from the organizers.
                      </div>
                   )}
                </div>
             </div>

             {/* 3. SIDEBAR (Right 1/3) */}
             <div className="space-y-6">
                
                {/* Rules Card */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="font-bold text-gray-900 mb-3">Information</h3>
                   <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-start gap-3">
                         <div className="min-w-[4px] h-4 bg-blue-500 rounded-full mt-1"></div>
                         <span>Format: {data.format || 'Knockout'}</span>
                      </li>
                      <li className="flex items-start gap-3">
                         <div className="min-w-[4px] h-4 bg-blue-500 rounded-full mt-1"></div>
                         <span>Max Teams: {data.max_teams || 'Unlimited'}</span>
                      </li>
                   </ul>
                   <button className="w-full mt-4 py-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      View Rules PDF
                   </button>
                </div>

                {/* Share Card */}
                <div className="bg-blue-600 text-white p-5 rounded-xl shadow-md text-center">
                   <h3 className="font-bold mb-2">Invite Players</h3>
                   <p className="text-xs text-blue-100 mb-4">Share this tournament link with captains.</p>
                   <div className="flex gap-2 justify-center">
                      <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                         Copy Link
                      </button>
                   </div>
                </div>

             </div>
          </div>
       </div>
    </TournamentLayout>
  )
}