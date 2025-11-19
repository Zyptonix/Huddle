import { Trophy, Search } from 'lucide-react'
import PublicTournamentList from '../tournaments/PublicTournamentList'

export default function PublicTournamentView() {
  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Tournaments</h1>
          <p className="text-gray-500">Find active tournaments and register your teams.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-8">
        <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-2">
           <Search size={20} /> Ready to compete?
        </h2>
        <p className="text-blue-700">
          Browse the list below. Click <strong>"View Details"</strong> to see the schedule, teams, and register your squad.
        </p>
      </div>

      <PublicTournamentList />
    </>
  )
}