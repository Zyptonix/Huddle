import Link from 'next/link'
import { Heart, Trophy, Search, TrendingUp } from 'lucide-react'
import StatCard from '../ui/StatCard'

export default function FanDashboard() {
  return (
    <div className="space-y-8">
       {/* Banner */}
       <div className="relative bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-8 shadow-lg overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-100" /> Fan Zone
          </h2>
          <p className="text-red-50 max-w-2xl">
            Follow your favorite teams, catch live scores, and never miss a match.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Quick Stats / Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Live Matches" value="0" icon={TrendingUp} color="red" />
        <StatCard label="Tournaments" value="-" icon={Trophy} color="blue" />
        <StatCard label="Following" value="0" icon={Heart} color="purple" />
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center flex flex-col items-center justify-center h-64">
            <Trophy className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Tournaments</h3>
            <p className="text-gray-500 mb-6">Find active leagues and knockout cups happening now.</p>
            <Link href="/tournament_portal" className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
               <Search size={18} /> Browse All
            </Link>
         </div>

         <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center flex flex-col items-center justify-center h-64">
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Follow Teams</h3>
            <p className="text-gray-500 mb-6">Search for teams and players to get updates on their feed.</p>
            <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-colors cursor-not-allowed">
               Coming Soon
            </button>
         </div>
      </div>
    </div>
  )
}