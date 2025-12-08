import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import TournamentLayout from '../../../components/tournaments/TournamentLayout'
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import StatCard from '../../../components/ui/StatCard'

export default function TournamentOverview() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    const res = await fetch(`/api/tournaments/${id}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  if (!data) return <TournamentLayout loading={true} />

  const nextMatch = data.matches?.find(m => m.status === 'scheduled')
  const latestNews = data.announcements?.[0]

  return (
    <TournamentLayout tournament={data} loading={loading}>
       <div className="grid md:grid-cols-3 gap-6">
          
          {/* Quick Stats */}
          <StatCard label="Registered Teams" value={data.teams.length} icon={Users} color="blue" />
          <StatCard label="Total Matches" value={data.matches.length} icon={Trophy} color="yellow" />
          <StatCard label="Days Running" value={data.start_date ? Math.ceil((new Date() - new Date(data.start_date)) / (1000 * 60 * 60 * 24)) : 0} icon={Calendar} color="green" />

          {/* Featured Content */}
          <div className="md:col-span-2 space-y-6">
             {/* Latest Announcement */}
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-900">Latest Update</h3>
                   <Link href={`/tournament/${id}/announcements`} className="text-xs text-blue-600 font-semibold hover:underline">View All</Link>
                </div>
                {latestNews ? (
                   <div>
                      <h4 className="font-medium text-lg text-gray-800">{latestNews.title}</h4>
                      <p className="text-gray-500 mt-1 line-clamp-2">{latestNews.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(latestNews.created_at).toLocaleDateString()}</p>
                   </div>
                ) : (
                   <p className="text-gray-400 italic text-sm">No announcements yet.</p>
                )}
             </div>

             {/* Next Match */}
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-900">Up Next</h3>
                   <Link href={`/tournament/${id}/fixtures`} className="text-xs text-blue-600 font-semibold hover:underline">View Schedule</Link>
                </div>
                {nextMatch ? (
                   <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div className="text-right font-bold text-gray-900 w-1/3">{nextMatch.team_a?.name}</div>
                      <div className="text-center w-1/3">
                         <span className="text-xs font-bold text-gray-400 block mb-1">VS</span>
                         <span className="text-xs bg-white border px-2 py-1 rounded text-gray-600">
                           {nextMatch.venue?.name || 'Venue TBD'}
                         </span>
                      </div>
                      <div className="text-left font-bold text-gray-900 w-1/3">{nextMatch.team_b?.name}</div>
                   </div>
                ) : (
                   <div className="text-center py-6 text-gray-400 italic">No upcoming matches scheduled.</div>
                )}
             </div>
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-md">
                <h3 className="font-bold text-lg mb-2">Tournament Rules</h3>
                <p className="text-blue-100 text-sm mb-4">Make sure to read the rules before your first match.</p>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                   Read Rules
                </button>
             </div>
          </div>

       </div>
    </TournamentLayout>
  )
}