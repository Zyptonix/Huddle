import { useState } from 'react'
import Link from 'next/link'
import { Users, CheckCircle } from 'lucide-react'

export default function RegisteredTeamsList({ teams, myTeams, profile, tournamentId, sport, onRefresh }) {
  const [selectedTeam, setSelectedTeam] = useState('')

  const handleRegister = async () => {
    if (!selectedTeam) return alert('Please select a team')
    const res = await fetch('/api/tournaments/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, teamId: selectedTeam })
    })
    if (res.ok) {
      alert('Team Registered!')
      onRefresh()
    } else {
      const data = await res.json()
      alert(data.error)
    }
  }

  return (
    <div className="space-y-8">
      {profile?.role === 'coach' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="font-bold text-gray-900 mb-4">Register Your Team</h3>
           {myTeams.length > 0 ? (
             <div className="space-y-3">
               <select 
                 className="w-full p-2 border rounded-md text-gray-900"
                 value={selectedTeam}
                 onChange={(e) => setSelectedTeam(e.target.value)}
               >
                 <option value="">Select a team...</option>
                 {myTeams.filter(t => t.sport === sport).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
               </select>
               <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">
                 Join Tournament
               </button>
               <p className="text-xs text-gray-500 text-center">Only {sport} teams shown.</p>
             </div>
           ) : (
             <p className="text-sm text-red-500">You have no teams created yet.</p>
           )}
         </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-600"/> Participating Teams
        </h3>
        {teams.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No teams have joined yet.</p>
        ) : (
          <ul className="space-y-3">
            {teams.map(team => (
              <li key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Link href={`/team/${team.id}`} className="font-medium text-gray-900 hover:underline hover:text-blue-600">
                  {team.name}
                </Link>
                {team.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}