import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Trophy, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react'
import DashboardSection from './DashboardSection'
import StatCard from '../ui/StatCard' // NEW

export default function OrganizerDashboard() {
  const [myTournaments, setMyTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/tournaments/created')
      if (res.ok) setMyTournaments(await res.json())
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading workspace...</div>

  // Calculate Stats
  const totalEvents = myTournaments.length
  const activeEvents = myTournaments.filter(t => t.status === 'active').length
  const upcomingEvents = myTournaments.filter(t => t.status === 'upcoming').length

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-lg overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-200" /> Organizer Workspace
          </h2>
          <p className="text-blue-100 max-w-2xl">
            Manage your leagues, track results, and oversee venues all in one place.
          </p>
        </div>
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Events" value={totalEvents} icon={Trophy} color="blue" />
        <StatCard label="Active Now" value={activeEvents} icon={ActivityIcon} color="green" />
        <StatCard label="Upcoming" value={upcomingEvents} icon={Clock} color="yellow" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
         {/* Main Content - 2/3 width */}
         <div className="md:col-span-2 space-y-8">
            <DashboardSection 
              title="Recent Tournaments" 
              icon={Trophy} 
              link="/tournament_portal" 
              linkText="View All" 
              items={myTournaments} 
              emptyText="No tournaments created yet." 
              type="tournament"
            />
         </div>

         {/* Sidebar - 1/3 width */}
         <div className="space-y-4">
            <Link 
              href="/tournament_portal" 
              className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-purple-50 rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>
                <h3 className="font-bold text-gray-900">Venue Manager</h3>
              </div>
              <p className="text-sm text-gray-500">Add and manage stadiums for your events.</p>
            </Link>

            <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-sm text-white">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <Calendar size={20}/> Quick Tip
              </h3>
              <p className="text-sm text-gray-300">
                Don't forget to generate the schedule once teams have registered!
              </p>
            </div>
         </div>
      </div>
    </div>
  )
}

// Helper icon since Activity is used in StatCard prop
function ActivityIcon(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
}