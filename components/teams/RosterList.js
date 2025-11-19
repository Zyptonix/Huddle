import { Users, User, Calendar } from 'lucide-react'

export default function RosterList({ roster }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Users className="text-blue-600" /> Team Roster
        <span className="text-gray-400 text-lg font-normal">({roster.length} Players)</span>
      </h2>

      {roster.length === 0 ? (
         <p className="text-gray-500 italic">No players have joined this team yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((player) => (
            <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="text-gray-400" size={24} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{player.username || 'Unnamed Player'}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Calendar size={12} />
                  Joined {new Date(player.joined_at).toLocaleDateString()}
                </div>
                {player.height && <p className="text-xs text-gray-500">Height: {player.height}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}