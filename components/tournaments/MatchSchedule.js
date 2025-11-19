import { useState } from 'react'
import { Calendar, PlayCircle } from 'lucide-react'

export default function MatchSchedule({ matches, isOrganizer, tournamentId, onScheduleGenerated }) {
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!confirm("This will generate matches for all registered teams. Continue?")) return
    setGenerating(true)
    
    const res = await fetch('/api/tournaments/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId })
    })
    
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      onScheduleGenerated()
    } else {
      alert(data.error)
    }
    setGenerating(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600"/> Match Schedule
        </h3>
        {isOrganizer && (
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Fixtures'}
          </button>
        )}
      </div>

      {matches && matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map(match => (
            <div key={match.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between bg-gray-50">
              <div className="flex-1 text-right font-medium text-gray-900">{match.team_a?.name || 'TBA'}</div>
              <div className="px-4 text-center">
                  <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded">VS</span>
                  <div className="text-[10px] text-gray-400 mt-1">{match.venue?.name || 'TBD'}</div>
              </div>
              <div className="flex-1 text-left font-medium text-gray-900">{match.team_b?.name || 'TBA'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
          <PlayCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No matches scheduled yet.</p>
        </div>
      )}
    </div>
  )
}