import { useState } from 'react'
import { Users } from 'lucide-react'
import CreateTeamForm from '../teams/CreateTeamForm'
import CoachTeamList from '../teams/CoachTeamList'

export default function CoachTeamView() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-8">
      <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
          <Users size={24} /> Coach Workspace
        </h2>
        <p className="text-green-700">
          Create new teams for the upcoming season and manage your existing squads.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <CreateTeamForm onTeamCreated={() => setRefreshKey(k => k + 1)} />
        </div>
        
        {/* Right Column: Team List */}
        <div className="lg:col-span-2">
          <CoachTeamList key={refreshKey} />
        </div>
      </div>
    </div>
  )
}