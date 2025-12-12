import { useState } from 'react'
import { useRouter } from 'next/router' // Import Router for navigation
import { Trophy, Medal, Crown, ChevronDown, ChevronUp, ArrowRight, Zap } from 'lucide-react'

export default function Leaderboards() {
  const router = useRouter() // Initialize router for the Register button
  const [activeTournament, setActiveTournament] = useState('Winter Cup 2024')
  
  // State to toggle "Show More" views
  const [showFullTable, setShowFullTable] = useState(false)
  const [showAllScorers, setShowAllScorers] = useState(false)

  // Expanded Data to demonstrate the "View Full Table" functionality
  const tournamentData = {
    'Winter Cup 2024': {
      type: 'Football',
      standings: [
        { rank: 1, team: 'Northside FC', p: 8, w: 6, d: 2, l: 0, pts: 20, form: ['w','w','w','d','w'] },
        { rank: 2, team: 'Real Frost', p: 8, w: 5, d: 2, l: 1, pts: 17, form: ['w','d','w','w','l'] },
        { rank: 3, team: 'Glacier United', p: 8, w: 4, d: 3, l: 1, pts: 15, form: ['d','d','w','w','w'] },
        { rank: 4, team: 'Winter Wolves', p: 8, w: 3, d: 2, l: 3, pts: 11, form: ['l','w','l','d','l'] },
        // Extra data that shows when "Full Table" is clicked
        { rank: 5, team: 'Southside Strikers', p: 8, w: 2, d: 2, l: 4, pts: 8, form: ['l','l','d','w','l'] },
        { rank: 6, team: 'East End XI', p: 8, w: 1, d: 1, l: 6, pts: 4, form: ['l','l','l','l','d'] },
      ],
      scorers: [
        { name: 'Marcus R.', team: 'Northside FC', score: 12, label: 'Goals' },
        { name: 'Sarah K.', team: 'Real Frost', score: 9, label: 'Goals' },
        { name: 'Jayden T.', team: 'Winter Wolves', score: 7, label: 'Goals' },
        // Extra data
        { name: 'Alex M.', team: 'Glacier Utd', score: 5, label: 'Goals' },
        { name: 'Sam P.', team: 'Southside', score: 4, label: 'Goals' }
      ]
    },
    'City Slam Dunk': {
      type: 'Basketball',
      standings: [
        { rank: 1, team: 'Downtown Dunkers', p: 12, w: 10, d: 0, l: 2, pts: 20, form: ['w','w','w','w','l'] },
        { rank: 2, team: 'Metro Ballers', p: 12, w: 9, d: 0, l: 3, pts: 18, form: ['w','l','w','w','w'] },
        { rank: 3, team: 'Hoop Dreams', p: 12, w: 6, d: 0, l: 6, pts: 12, form: ['l','l','w','l','w'] },
        { rank: 4, team: 'Net Rippers', p: 12, w: 4, d: 0, l: 8, pts: 8, form: ['l','w','l','l','l'] },
      ],
      scorers: [
        { name: 'Tyrone J.', team: 'Metro Ballers', score: 24.5, label: 'PPG' },
        { name: 'Mike Ross', team: 'Downtown Dunkers', score: 22.1, label: 'PPG' },
        { name: 'Kobe L.', team: 'Hoop Dreams', score: 19.8, label: 'PPG' },
      ]
    },
    'Super Sixes Cricket': {
      type: 'Cricket',
      standings: [
        { rank: 1, team: 'Mumbai Blasters', p: 5, w: 4, d: 0, l: 1, pts: 8, form: ['w','w','l','w','w'] },
        { rank: 2, team: 'Sydney Sixers', p: 5, w: 3, d: 0, l: 2, pts: 6, form: ['w','l','w','l','w'] },
        { rank: 3, team: 'London Lions', p: 5, w: 2, d: 0, l: 3, pts: 4, form: ['l','l','l','w','w'] },
      ],
      scorers: [
        { name: 'Virat K.', team: 'Mumbai Blasters', score: 240, label: 'Runs' },
        { name: 'Steve S.', team: 'Sydney Sixers', score: 185, label: 'Runs' },
        { name: 'Joe R.', team: 'London Lions', score: 150, label: 'Runs' },
      ]
    }
  }

  const currentData = tournamentData[activeTournament]

  // Slice data based on whether "Show More" is active
  const displayedStandings = showFullTable ? currentData.standings : currentData.standings.slice(0, 4)
  const displayedScorers = showAllScorers ? currentData.scorers : currentData.scorers.slice(0, 3)

  // Navigation Handler
  const handleRegisterClick = () => {
    // Navigate to your register page (adjust path if your file is named differently)
    router.push('/auth/register')
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 relative overflow-hidden">
      
      {/* Decorative Background Blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
        
        {/* === PAGE HEADER === */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                 Live Updates
               </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Leaderboards
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Track the champions of the <span className="font-semibold text-blue-600">{activeTournament}</span>.
            </p>
          </div>

          {/* Tournament Tabs */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto max-w-full">
            {Object.keys(tournamentData).map((name) => (
              <button
                key={name}
                onClick={() => {
                  setActiveTournament(name)
                  setShowFullTable(false) // Reset view on switch
                  setShowAllScorers(false)
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTournament === name
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* === MAIN STANDINGS TABLE (Left 2 Columns) === */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              
              {/* Card Header with Gradient */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white via-white to-slate-50">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600 shadow-sm">
                    <Trophy size={24} fill="currentColor" className="opacity-90" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-xl">{currentData.type} Standings</h2>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Season 5 • Week 12</span>
                  </div>
                </div>
                
                {/* Functional Toggle Button */}
                <button 
                  onClick={() => setShowFullTable(!showFullTable)}
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {showFullTable ? 'Collapse Table' : 'Full Table'}
                  {showFullTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-8 py-5 w-20 text-center">Rank</th>
                      <th className="px-6 py-5">Team Club</th>
                      <th className="px-4 py-5 text-center">P</th>
                      <th className="px-4 py-5 text-center">W</th>
                      <th className="px-4 py-5 text-center">D</th>
                      <th className="px-4 py-5 text-center">L</th>
                      <th className="px-4 py-5 text-center hidden sm:table-cell">Form</th>
                      <th className="px-8 py-5 text-center text-slate-900">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStandings.map((team, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm
                            ${team.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                              team.rank === 2 ? 'bg-slate-200 text-slate-700' : 
                              team.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-slate-500'}`}>
                            {team.rank}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {/* Team Avatar */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md transform group-hover:scale-110 transition-transform duration-300
                              ${team.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                              {team.team.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 text-base">{team.team}</span>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center font-medium text-slate-600">{team.p}</td>
                        <td className="px-4 py-5 text-center font-medium text-slate-600">{team.w}</td>
                        <td className="px-4 py-5 text-center font-medium text-slate-600">{team.d}</td>
                        <td className="px-4 py-5 text-center font-medium text-slate-600">{team.l}</td>
                        
                        <td className="px-4 py-5 hidden sm:table-cell">
                          <div className="flex justify-center gap-1">
                            {team.form.map((f, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${f === 'w' ? 'bg-green-500' : f === 'l' ? 'bg-red-400' : 'bg-slate-300'}`} />
                            ))}
                          </div>
                        </td>

                        <td className="px-8 py-5 text-center">
                          <span className="font-black text-slate-900 text-lg">
                            {team.pts}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile "Show More" Button (visible only on small screens) */}
              <div className="sm:hidden p-4 border-t border-slate-100">
                 <button 
                    onClick={() => setShowFullTable(!showFullTable)}
                    className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm"
                 >
                    {showFullTable ? 'Show Less' : 'View Full Table'}
                 </button>
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN (Stats & Promo) === */}
          <div className="space-y-8">
            
            {/* Top Performers Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
                   <Medal size={20} fill="currentColor" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Top Performers</h3>
              </div>

              <div className="space-y-4">
                {displayedScorers.map((player, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-default">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-lg font-black
                        ${idx === 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                        {idx + 1}
                      </div>
                      {idx === 0 && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow-sm ring-2 ring-white">
                           <Crown size={12} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{player.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{player.team}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-2xl text-slate-900 leading-none">
                        {player.score}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {player.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowAllScorers(!showAllScorers)}
                className="w-full mt-6 py-3.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                {showAllScorers ? 'Show Top 3' : 'View All Players'}
                {showAllScorers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* === PROMO / REGISTER CARD (Functional) === */}
            <div className="relative group overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/20">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-700 transition-transform duration-500 group-hover:scale-105" />
                
                {/* Content */}
                <div className="relative z-10 p-8 text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                       <Zap size={24} className="text-yellow-300" fill="currentColor" />
                    </div>
                    
                    <h3 className="font-black text-2xl mb-2">Join the Action!</h3>
                    <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed opacity-90">
                      Think your team has what it takes? Register now for the upcoming Summer League qualifiers.
                    </p>
                    
                    <button 
                      onClick={handleRegisterClick}
                      className="w-full bg-white text-blue-700 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        Register Now
                        <ArrowRight size={16} />
                    </button>
                </div>
                
                {/* Decorative Circles */}
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl" />
                <div className="absolute top-12 -right-6 w-24 h-24 bg-blue-400 opacity-20 rounded-full blur-xl" />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}