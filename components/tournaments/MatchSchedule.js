import { useState } from 'react'
import { Calendar, RefreshCw, Trophy, MapPin, Clock } from 'lucide-react'

export default function MatchSchedule({ matches, isOrganizer, tournamentId, onScheduleGenerated }) {
  const [generating, setGenerating] = useState(false)

  // Helper to create team avatar initials
  const getInitials = (name) => {
    if (!name) return '?'
    return name.substring(0, 2).toUpperCase()
  }

  // Helper to format match time nicely
  const formatTime = (dateString, timeString) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const time = timeString || 'TBD'
    return { date, time }
  }

  const handleGenerate = async () => {
    if (!confirm("This will generate fixtures based on registered teams. Existing matches might be reset. Continue?")) return
    setGenerating(true)
    
    try {
      const res = await fetch('/api/tournaments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId })
      })
      
      const data = await res.json()
      if (res.ok) {
        onScheduleGenerated() // Refresh data
      } else {
        alert(data.error || "Failed to generate matches")
      }
    } catch (e) {
      console.error(e)
      alert("An error occurred")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
           <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
             <Calendar className="text-blue-600" /> Match Fixtures
           </h3>
           <p className="text-gray-500 text-sm mt-1">
             {matches?.length || 0} matches scheduled
           </p>
        </div>
        
        {isOrganizer && (
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-md
              ${generating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform active:scale-95'
              }`}
          >
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating Brackets...' : 'Generate Schedule'}
          </button>
        )}
      </div>

      {/* Matches Grid */}
      {matches && matches.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {matches.map((match, index) => {
            const { date, time } = formatTime(match.date, match.time)
            
            return (
              <div key={match.id || index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                
                {/* Match Context Bar */}
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                   <span className="flex items-center gap-1">
                      <Clock size={12} /> {date} • {time}
                   </span>
                   <span className="flex items-center gap-1 text-blue-600">
                      <MapPin size={12} /> {match.venue?.name || 'Main Field'}
                   </span>
                </div>

                {/* Match Card Body */}
                <div className="p-5 flex items-center justify-between relative">
                   
                   {/* Team A */}
                   <div className="flex-1 flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ring-1 ring-gray-100">
                         {getInitials(match.team_a?.name)}
                      </div>
                      <span className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                        {match.team_a?.name || 'TBD'}
                      </span>
                   </div>

                   {/* VS / Score */}
                   <div className="px-4 flex flex-col items-center justify-center z-10">
                      {match.status === 'finished' ? (
                         <div className="text-2xl font-black text-gray-900 tracking-tighter bg-gray-100 px-3 py-1 rounded-lg">
                            {match.score_a} - {match.score_b}
                         </div>
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                            VS
                         </div>
                      )}
                      <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        match.status === 'live' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'text-gray-400 border-transparent'
                      }`}>
                        {match.status === 'live' ? 'LIVE' : match.round || 'League Match'}
                      </span>
                   </div>

                   {/* Team B */}
                   <div className="flex-1 flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-50 text-red-700 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ring-1 ring-gray-100">
                         {getInitials(match.team_b?.name)}
                      </div>
                      <span className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                        {match.team_b?.name || 'TBD'}
                      </span>
                   </div>

                </div>

                {/* Organizer Actions (Optional) */}
                {isOrganizer && (
                   <div className="border-t border-gray-100 p-2 bg-gray-50 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs font-bold text-blue-600 hover:underline">Edit Match Details</button>
                   </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
           <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No Matches Scheduled</h3>
           <p className="text-gray-500 max-w-md mx-auto mb-6">
             {isOrganizer 
               ? "Ready to kick off? Make sure teams are registered, then click 'Generate Schedule' above." 
               : "The organizer hasn't published the fixtures yet. Check back soon!"}
           </p>
           {isOrganizer && (
             <button onClick={handleGenerate} className="text-blue-600 font-bold text-sm hover:underline">
                Generate First Round Now &rarr;
             </button>
           )}
        </div>
      )}
    </div>
  )
}