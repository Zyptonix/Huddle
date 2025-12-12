import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  Users, Shield, Trophy, MapPin, Calendar, 
  LogOut, UserPlus, Settings, Hash, Lock 
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import Loading from '../../components/ui/Loading'

export default function TeamProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile } = useAuth()
  
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [myJoinedTeams, setMyJoinedTeams] = useState([]) // For "One Sport" check
  const [loading, setLoading] = useState(true)

  // Roles
  const isOwner = team?.owner_id === user?.id
  const myMembership = members.find(m => m.user_id === user?.id)
  const isMember = !!myMembership
  
  useEffect(() => {
    if (id && user) fetchData()
  }, [id, user])

  const fetchData = async () => {
    try {
      const [teamRes, membersRes, myTeamsRes] = await Promise.all([
        fetch(`/api/teams/${id}`),
        fetch(`/api/teams/${id}/members`),
        fetch(`/api/teams/joined`) // Get all teams I'm in to check sport conflict
      ])

      if (teamRes.ok) setTeam(await teamRes.json())
      if (membersRes.ok) setMembers(await membersRes.json())
      if (myTeamsRes.ok) setMyJoinedTeams(await myTeamsRes.json())
      
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---

  const handleJoin = async () => {
    // 1. Check if I'm already in a team for this sport
    const conflict = myJoinedTeams.find(t => t.sport === team.sport)
    if (conflict) {
      alert(`Transfer Error: You are already playing ${team.sport} for "${conflict.name}". You must leave that team first.`)
      return
    }

    if (confirm(`Join ${team.name}?`)) {
      const res = await fetch(`/api/teams/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        fetchData() // Refresh roster
      }
    }
  }

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave the team?")) {
      await fetch(`/api/teams/${id}/leave`, {
         method: 'POST', 
         body: JSON.stringify({ userId: user.id }) 
      })
      router.push('/team_portal')
    }
  }

  if (loading) return <Loading />
  if (!team) return <Layout>Team not found</Layout>

  // Group members by role
  const coaches = members.filter(m => m.role === 'coach' || m.role === 'owner')
  const captains = members.filter(m => m.role === 'captain')
  const players = members.filter(m => m.role === 'player')

  return (
    <Layout title={`${team.name} - Huddle`}>
      
      {/* 1. HERO BANNER */}
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className={`h-48 w-full ${team.sport === 'football' ? 'bg-gradient-to-r from-emerald-800 to-green-600' : 'bg-gradient-to-r from-blue-900 to-indigo-800'}`}>
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        
        <div className="px-8 pb-6 relative">
           <div className="flex flex-col md:flex-row items-start gap-6 -mt-12">
              
              {/* Logo Box */}
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg p-2 border-4 border-white flex items-center justify-center">
                 {team.logo_url ? (
                    <img src={team.logo_url} className="w-full h-full object-cover rounded-xl" />
                 ) : (
                    <Shield size={64} className="text-gray-300" />
                 )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-14 md:pt-0">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{team.sport}</span>
                    {team.is_recruiting && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><UserPlus size={10} /> Recruiting</span>}
                 </div>
                 <h1 className="text-3xl font-black text-gray-900 leading-none mb-2">{team.name}</h1>
                 <p className="text-gray-500 text-sm flex items-center gap-4">
                    <span className="flex items-center gap-1"><Users size={14}/> {members.length} Active Players</span>
                    <span className="flex items-center gap-1"><Trophy size={14}/> 0 Titles</span>
                 </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-14">
                 {isOwner ? (
                    <button className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                       <Settings size={16} /> Manage
                    </button>
                 ) : isMember ? (
                    <button onClick={handleLeave} className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                       <LogOut size={16} /> Leave Team
                    </button>
                 ) : (
                    team.is_recruiting ? (
                       <button onClick={handleJoin} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-blue-200 text-sm">
                          Join Squad
                       </button>
                    ) : (
                       <button disabled className="flex-1 md:flex-none bg-gray-100 text-gray-400 font-bold py-2 px-6 rounded-lg text-sm cursor-not-allowed flex items-center gap-2">
                          <Lock size={14} /> Invite Only
                       </button>
                    )
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         
         {/* LEFT COLUMN - STATS & INFO */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-blue-600"/> Club Info
               </h3>
               <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {team.description || "This team keeps a low profile. No bio available."}
               </p>
               
               <div className="space-y-3">
                  <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                     <span className="text-gray-500">Established</span>
                     <span className="font-bold text-gray-900">{new Date(team.created_at).getFullYear()}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                     <span className="text-gray-500">Home Ground</span>
                     <span className="font-bold text-gray-900">Not Set</span>
                  </div>
                  {team.code && isOwner && (
                     <div className="bg-yellow-50 p-3 rounded-lg mt-4 border border-yellow-100">
                        <p className="text-[10px] uppercase font-bold text-yellow-800 mb-1">Invite Code</p>
                        <div className="flex items-center justify-between">
                           <code className="text-lg font-mono font-bold text-gray-900">{team.code}</code>
                           <Hash size={16} className="text-yellow-600"/>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Recent Form (Mock) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-4">Recent Form</h3>
               <div className="flex gap-2">
                  {['W','W','L','D','W'].map((r, i) => (
                     <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white
                        ${r === 'W' ? 'bg-green-500' : r === 'L' ? 'bg-red-500' : 'bg-gray-400'}`}>
                        {r}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN - ROSTER */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Staff Section */}
            {(coaches.length > 0 || captains.length > 0) && (
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 font-bold text-gray-700 text-sm">
                     Coaching Staff & Captains
                  </div>
                  <div className="p-6 grid sm:grid-cols-2 gap-4">
                     {[...coaches, ...captains].map(staff => (
                        <div key={staff.user_id} className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {staff.username?.[0] || 'S'}
                           </div>
                           <div>
                              <p className="font-bold text-gray-900 text-sm">{staff.username || 'Unknown'}</p>
                              <p className="text-xs text-blue-600 uppercase font-bold">{staff.role}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Players Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-sm">Active Roster</span>
                  <span className="text-xs text-gray-400 font-mono">{players.length} Players</span>
               </div>
               
               {players.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                     {players.map(player => (
                        <div key={player.user_id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold">
                                 {player.username?.[0] || 'P'}
                              </div>
                              <div>
                                 <p className="font-bold text-gray-900 text-sm">{player.username}</p>
                                 <p className="text-xs text-gray-400">{player.position || 'No Position'}</p>
                              </div>
                           </div>
                           {/* Stats Placeholder */}
                           <div className="text-right">
                              <p className="font-mono font-bold text-gray-900 text-sm">0</p>
                              <p className="text-[10px] uppercase text-gray-400">Apps</p>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="p-8 text-center text-gray-400 italic">
                     No players in the squad yet.
                  </div>
               )}
            </div>
         </div>

      </div>
    </Layout>
  )
}