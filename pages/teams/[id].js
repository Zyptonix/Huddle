import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  Users, Shield, Trophy, UserPlus, Settings, Hash, Lock, 
  Activity, ClipboardList, LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import Loading from '../../components/ui/Loading'

export default function TeamProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Roles
  const isOwner = team?.owner_id === user?.id
  const myMembership = members.find(m => m.user_id === user?.id)
  const isCoach = isOwner || myMembership?.role === 'coach' || myMembership?.role === 'captain'
  const isMember = !!myMembership
  
  useEffect(() => {
    if (id && user) fetchData()
  }, [id, user])

  const fetchData = async () => {
    try {
      const [teamRes, membersRes] = await Promise.all([
        fetch(`/api/teams/${id}`),
        fetch(`/api/teams/${id}/members`)
      ])

      if (teamRes.ok) setTeam(await teamRes.json())
      if (membersRes.ok) setMembers(await membersRes.json())
      
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---
  const handleJoin = async () => {
    if (confirm(`Join ${team.name}?`)) {
      const res = await fetch(`/api/teams/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }) 
      })
      if (res.ok) fetchData()
    }
  }

  const handleLeave = async () => {
    if (confirm("Leave team?")) {
      await fetch(`/api/teams/${id}/leave`, { method: 'POST' })
      router.push('/team_portal')
    }
  }

  if (loading) return <Loading />
  if (!team) return <Layout><div className="p-10 text-center">Team not found</div></Layout>

  const coaches = members.filter(m => m.role === 'coach' || m.role === 'owner')
  const players = members.filter(m => m.role === 'player')

  // Light Theme Accents
  const sportColor = team.sport === 'basketball' ? 'text-orange-600' : 'text-emerald-600'
  const sportBg = team.sport === 'basketball' ? 'bg-orange-50' : 'bg-emerald-50'

  return (
    <Layout title={`${team.name} - Huddle`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* 1. HERO BANNER - White Card Style */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-r from-indigo-600 to-blue-500 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          </div>
          
          <div className="px-8 pb-8">
             <div className="flex flex-col md:flex-row items-start gap-6 -mt-12">
                
                {/* Logo */}
                <div className="w-32 h-32 bg-white rounded-2xl shadow-md p-1.5 flex items-center justify-center relative z-10">
                   {team.logo_url ? (
                      <img src={team.logo_url} className="w-full h-full object-cover rounded-xl" />
                   ) : (
                      <Shield size={64} className="text-gray-300" />
                   )}
                </div>

                {/* Info */}
                <div className="flex-1 pt-14 md:pt-0">
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`${sportBg} ${sportColor} border border-gray-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest`}>{team.sport}</span>
                      {team.is_recruiting && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><UserPlus size={10} /> Recruiting</span>}
                   </div>
                   <h1 className="text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
                   <p className="text-gray-500 text-sm flex items-center gap-4 font-medium">
                      <span className="flex items-center gap-1"><Users size={16} className="text-gray-400"/> {members.length} Members</span>
                      <span className="flex items-center gap-1"><Trophy size={16} className="text-yellow-500"/> {team.wins || 0} Wins</span>
                   </p>
                </div>

                {/* Actions */}
                <div className="mt-4 md:mt-14">
                   {isOwner ? (
                      <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-all">
                         <Settings size={16} /> Manage
                      </button>
                   ) : isMember ? (
                      <button onClick={handleLeave} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm">
                         <LogOut size={16} /> Leave
                      </button>
                   ) : (
                      <button onClick={handleJoin} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md shadow-indigo-200 text-sm transition-all">
                         Join Squad
                      </button>
                   )}
                </div>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           
           {/* LEFT COLUMN */}
           <div className="space-y-6">
              
              {/* STATS CARD */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-600"/> Season Stats
                 </h3>
                 <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                       <span className="text-2xl font-bold text-emerald-600">{team.wins || 0}</span>
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Wins</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                       <span className="text-2xl font-bold text-gray-600">{team.draws || 0}</span>
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Draws</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                       <span className="text-2xl font-bold text-red-500">{team.losses || 0}</span>
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Losses</p>
                    </div>
                 </div>
              </div>

              {/* COACH SHORTCUT */}
              {isCoach && (
                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                       <ClipboardList size={20}/> Tactical Center
                    </h3>
                    <p className="text-sm text-indigo-700 mb-4">Set your starting XI for the upcoming match.</p>
                    <Link href={`/match/upcoming/lineup`}>
                       <button className="w-full bg-white text-indigo-600 font-bold py-2.5 rounded-lg text-sm border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm">
                          Manage Lineup
                       </button>
                    </Link>
                 </div>
              )}

              {/* INFO CARD */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-4">About</h3>
                 <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {team.description || "No bio available."}
                 </p>
                 <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-500">Established</span>
                    <span className="font-semibold text-gray-900">{new Date(team.created_at).getFullYear()}</span>
                 </div>
                 {team.code && isOwner && (
                    <div className="bg-yellow-50 p-3 rounded-lg mt-4 border border-yellow-200 flex justify-between items-center">
                       <span className="text-xs font-bold text-yellow-800 uppercase">Invite Code</span>
                       <code className="text-lg font-mono font-bold text-yellow-900">{team.code}</code>
                    </div>
                 )}
              </div>
           </div>

           {/* RIGHT COLUMN - ROSTER */}
           <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-700">Active Roster</span>
                    <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{players.length} Players</span>
                 </div>
                 
                 {/* COACHES */}
                 {coaches.map(staff => (
                    <div key={staff.user_id} className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-indigo-50/30">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {staff.username?.[0] || 'C'}
                       </div>
                       <div>
                          <p className="font-bold text-gray-900 text-sm">{staff.username}</p>
                          <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">{staff.role}</p>
                       </div>
                    </div>
                 ))}

                 {/* PLAYERS */}
                 <div className="divide-y divide-gray-100">
                    {players.map(player => (
                       <div key={player.user_id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center justify-center font-bold text-sm">
                                {player.username?.[0] || 'P'}
                             </div>
                             <div>
                                <p className="font-semibold text-gray-900 text-sm">{player.username}</p>
                                <p className="text-xs text-gray-500">{player.position || 'Player'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="font-mono font-bold text-gray-900 text-sm">#{player.jersey_number || '-'}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </Layout>
  )
}