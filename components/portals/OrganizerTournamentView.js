import { useState } from 'react'
import { Shield } from 'lucide-react'
import CreateTournamentForm from '../tournaments/CreateTournamentForm'
import OrganizerTournamentList from '../tournaments/OrganizerTournamentList'
import VenueManager from '../venues/VenueManager'

export default function OrganizerTournamentView() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tournament Manager</h1>
          <p className="text-gray-500">Create and manage your multi-sport events.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <CreateTournamentForm onTournamentCreated={() => setRefreshKey(k => k + 1)} />
        </div>
        <div className="lg:col-span-2">
          <OrganizerTournamentList key={refreshKey} />
        </div>
      </div>

      <div className="mt-12">
         <VenueManager />
      </div>
    </>
  )
}