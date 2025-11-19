import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import JoinTeamForm from '../teams/JoinTeamForm'
import PlayerTeamList from '../teams/PlayerTeamList'

export default function PlayerTeamView() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-8">
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
          <UserPlus size={24} /> Player Workspace
        </h2>
        <p className="text-yellow-700">
          Join your coach's team using a Join Code or view your current team memberships.
        </p>
      </div>

       <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Join Form */}
        <div className="lg:col-span-1">
          <JoinTeamForm onJoinSuccess={() => setRefreshKey(k => k + 1)} />
        </div>

        {/* Right Column: Team List */}
        <div className="lg:col-span-2">
          <PlayerTeamList key={refreshKey} />
        </div>
      </div>
    </div>
  )
}