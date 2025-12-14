import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  Users, Shield, Trophy, UserPlus, Edit3, X, MapPin, 
  Calendar, Activity, ClipboardList, LogOut, Check, Ban, Upload, Copy
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/ui/Layout'
import Loading from '../../components/ui/Loading'
import TeamSchedule from '@/components/teams/TeamSchedule'
import StatCard from '@/components/ui/StatCard'
import TeamStats from '@/components/teams/TeamStats'

export default function TeamProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [currentUserProfile, setCurrentUserProfile] = useState(null) // To check current user's global role
  const [loading, setLoading] = useState(true)

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // --- 1. ROLES & STATUS LOGIC ---
  const isOwner = team?.owner_id === user?.id
  const myMembership = members.find(m => m.user_id === user?.id)
  
  // Filter members based on status
  const activeMembers = members.filter(m => m.status === 'active')
  const pendingRequests = members.filter(m => m.status === 'pending')

  // Check specific user statuses within THIS team
  const isActiveMember = myMembership?.status === 'active'
  const isPending = myMembership?.status === 'pending'
  
  // Permission: Coach or Captain or Owner can set lineups (Logic usually handled in Schedule/Modal, but status defined here)
  const isTeamStaff = isOwner || (isActiveMember && (myMembership?.role === 'coach' || myMembership?.role === 'captain'))

  // Global Role Check (from public.profiles) to prevent other coaches from joining
  // Assuming 'role' in profiles table is 'fan', 'player', 'coach', or 'organizer'
  const isGlobalCoachOrOrganizer = currentUserProfile?.role === 'coach' || currentUserProfile?.role === 'organizer'

  useEffect(() => {
    if (id && user) fetchData()
  }, [id, user])

  const fetchData = async () => {
    try {
      // 1. Fetch Current User Profile (for global role check)
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setCurrentUserProfile(myProfile)

      // 2. Fetch Team Details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

      if (teamError || !teamData) {
        setTeam(null)
        setLoading(false)
        return
      }

      // 3. Fetch Owner's Profile Manually
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('username, avatar_url, positions_preferred') 
        .eq('id', teamData.owner_id)
        .single()
      
      const ownerPosition = Array.isArray(ownerData?.positions_preferred) 
        ? ownerData.positions_preferred.join(', ') 
        : ownerData?.positions_preferred || 'Manager';

      const completeOwner = ownerData ? {
        ...ownerData,
        position: ownerPosition
      } : null

      const completeTeam = { ...teamData, owner: completeOwner }
      setTeam(completeTeam)
      setEditForm(completeTeam)

      // 4. Fetch ALL Members
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:user_id (username, positions_preferred, avatar_url, jersey_number)
        `)
        .eq('team_id', id)
      
      const formattedMembers = membersData ? membersData.map(m => {
        const posRaw = m.profiles?.positions_preferred;
        const posStr = Array.isArray(posRaw) ? posRaw.join(', ') : posRaw;

        return {
            ...m,
            username: m.profiles?.username,
            position: posStr, 
            jersey_number: m.profiles?.jersey_number,
            avatar_url: m.profiles?.avatar_url
        }
      }) : []
      
      setMembers(formattedMembers)
      
    } catch (e) {
      console.error("Global fetch error:", e)
    } finally {
      setLoading(false)
    }
  }

  // --- 2. ACTIONS ---

  const handleRequestJoin = async () => {
    try {
      const res = await fetch(`/api/teams/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }) 
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Request failed')
      }
      
      alert("Request sent to team owner!")
      fetchData() 
    } catch (error) {
      alert(error.message)
    }
  }

  const handleManageRequest = async (memberRecordId, action) => {
    try {
      const res = await fetch('/api/teams/handle-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_record_id: memberRecordId, action })
      })
      if (res.ok) fetchData() 
    } catch (error) {
      console.error(error)
    }
  }

  const handleLeave = async () => {
    if (confirm("Leave team?")) {
      await fetch(`/api/teams/${id}/leave`, { method: 'POST' })
      router.push('/team_portal')
    }
  }

  const handleUpdateTeam = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      let finalLogoUrl = editForm.logo_url
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${team.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('team-logos').upload(fileName, logoFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('team-logos').getPublicUrl(fileName)
        finalLogoUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('teams').update({
          name: editForm.name,
          description: editForm.description,
          sport: editForm.sport,
          logo_url: finalLogoUrl
        }).eq('id', id)

      if (error) throw error
      setTeam({ ...team, ...editForm, logo_url: finalLogoUrl })
      setIsEditing(false)
      alert("Team updated successfully!")
    } catch (error) {
      alert("Error updating team: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const copyJoinCode = () => {
    if (team?.join_code) {
        navigator.clipboard.writeText(team.join_code);
        alert("Join code copied to clipboard!");
    }
  }

  if (loading) return <Loading />
  if (!team) return <Layout><div className="p-10 text-center">Team not found</div></Layout>

  // --- ROSTER LOGIC ---
  let coaches = activeMembers.filter(m => m.role === 'coach' || m.role === 'owner')
  
  // Ensure owner is visible in coaches list
  const ownerInList = coaches.find(m => m.user_id === team.owner_id)
  if (!ownerInList && team.owner) {
    coaches.unshift({
        user_id: team.owner_id,
        username: team.owner.username,
        role: 'owner',
        avatar_url: team.owner.avatar_url,
        position: team.owner.position
    })
  }

  const players = activeMembers.filter(m => m.role === 'player')

  const sportColor = team.sport === 'basketball' ? 'text-orange-600' : 'text-emerald-600'
  const sportBg = team.sport === 'basketball' ? 'bg-orange-50' : 'bg-emerald-50'

  return (
    <Layout title={`${team.name} - Huddle`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* EDIT MODAL */}
        {isEditing && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg">Edit Team Details</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleUpdateTeam} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Team Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                    {logoFile ? <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover" /> : 
                                     editForm.logo_url ? <img src={editForm.logo_url} className="w-full h-full object-cover" /> : <Shield className="text-gray-300" />}
                                </div>
                                <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
                                    <Upload size={16}/> Upload New Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files[0])} />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
                            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" />
                        </div>
                        <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={uploading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">{uploading ? 'Uploading...' : 'Save Changes'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* HERO BANNER */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8 relative z-10">
          <div className="h-40 bg-gradient-to-r from-indigo-600 to-blue-500 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
          </div>
          
          <div className="px-8 pb-8 z-50">
             <div className="flex flex-col md:flex-row items-start gap-6 -mt-7">
                <div className="w-32 h-32 bg-white rounded-2xl shadow-md p-1.5 flex items-center justify-center relative z-10 overflow-hidden">
                   {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover rounded-xl" /> : <Shield size={64} className="text-gray-300" />}
                </div>
                <div className="flex-1 pt-14 md:pt-0">
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`${sportBg} ${sportColor} border border-gray-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest`}>{team.sport}</span>
                      {team.is_recruiting && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><UserPlus size={10} /> Recruiting</span>}
                   </div>
                   <h1 className="text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
                   <p className="text-gray-500 text-sm flex items-center gap-4 font-medium">
                      <span className="flex items-center gap-1"><Users size={16} className="text-gray-400"/> {activeMembers.length} Members</span>
                      <span className="flex items-center gap-1"><Trophy size={16} className="text-yellow-500"/> {team.wins || 0} Wins</span>
                   </p>
                   
                   {/* JOIN CODE DISPLAY (OWNER ONLY) */}
                   {isOwner && team.join_code && (
                       <div className="mt-3 inline-flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group" onClick={copyJoinCode}>
                           <div className="flex flex-col">
                               <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Team Join Code</span>
                               <span className="font-mono font-bold text-lg text-gray-800 tracking-wider leading-none mt-1">{team.join_code}</span>
                           </div>
                           <Copy size={16} className="text-gray-400 group-hover:text-indigo-600" />
                       </div>
                   )}
                </div>
                
                {/* 3. BUTTON LOGIC */}
                <div className="mt-4 md:mt-14">
                   {isOwner ? (
                      <button onClick={() => setIsEditing(true)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-all"><Edit3 size={16} /> Edit Team</button>
                   ) : isActiveMember ? (
                      <button onClick={handleLeave} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm"><LogOut size={16} /> Leave</button>
                   ) : isPending ? (
                      <button disabled className="bg-gray-100 text-gray-500 font-semibold py-2 px-6 rounded-lg text-sm cursor-not-allowed border border-gray-200 flex items-center gap-2">
                        <Activity size={16} className="animate-pulse" /> Request Pending...
                      </button>
                   ) : (
                      // RESTRICT JOIN: If user is a coach or organizer, they cannot see the Join button
                      !isGlobalCoachOrOrganizer && (
                          <button onClick={handleRequestJoin} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md shadow-indigo-200 text-sm transition-all">
                             Request to Join
                          </button>
                      )
                   )}
                </div>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="space-y-6">

             {/* REMOVED: Tactical Center (Default Strategy) as requested */}

             {/* ABOUT */}
             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-4">About</h3>
                 <p className="text-sm text-gray-600 mb-6 leading-relaxed">{team.description || "No bio available."}</p>
                 <div className="flex justify-between text-sm py-2 border-b border-gray-100"><span className="text-gray-500">Established</span><span className="font-semibold text-gray-900">{new Date(team.created_at).getFullYear()}</span></div>
             </div>
           </div>

           <div className="lg:col-span-2 space-y-6">
             
             {/* PENDING REQUESTS (OWNER ONLY) */}
             {isOwner && (
                <div className="bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 mb-6">
                    <div className="px-6 py-4 border-b border-yellow-100 flex justify-between items-center">
                        <span className="font-bold text-yellow-800 flex items-center gap-2">
                           <UserPlus size={18}/> Pending Requests
                        </span>
                        <span className="text-xs font-bold bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full">
                           {pendingRequests.length}
                        </span>
                    </div>
                    
                    {pendingRequests.length === 0 ? (
                        <div className="p-6 text-center text-yellow-700/60 text-sm font-medium italic">
                           No incoming requests at the moment.
                        </div>
                    ) : (
                        <div className="divide-y divide-yellow-100">
                           {pendingRequests.map(req => (
                               <div key={req.id} className="p-4 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700 overflow-hidden">
                                          {req.avatar_url ? <img src={req.avatar_url} className="w-full h-full object-cover"/> : (req.username?.[0] || 'U')}
                                       </div>
                                       <div>
                                           <p className="font-bold text-gray-900">{req.username}</p>
                                           <p className="text-xs text-gray-500">Wants to join as Player</p>
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => handleManageRequest(req.id, 'deny')} className="p-2 text-red-600 bg-white hover:bg-red-50 border border-red-100 rounded-lg shadow-sm transition-colors" title="Deny"><Ban size={18} /></button>
                                       <button onClick={() => handleManageRequest(req.id, 'accept')} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm shadow-sm transition-colors"><Check size={16} /> Accept</button>
                                   </div>
                               </div>
                           ))}
                        </div>
                    )}
                </div>
             )}

             {/* SCHEDULE */}
             {/* The TeamSchedule component should likely handle the Match Lineup Modal internally. */}
             {/* We pass the teamID. If permissions issues persist in the modal, they must be fixed in TeamSchedule or MatchLineupModal.js */}
             <TeamSchedule teamId={id} />
            
             {/* STATS */}
             <TeamStats teamId={id} />

             {/* ROSTER */}
             <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center"><span className="font-bold text-gray-700 flex items-center gap-2"><Users size={18} className="text-indigo-500"/> Active Roster</span><span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{coaches.length + players.length} Players</span></div>
                 
                 {/* COACHES LIST */}
                 {coaches.map(staff => (
                    <div key={staff.user_id} className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-indigo-50/30">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm overflow-hidden">
                          {staff.avatar_url ? <img src={staff.avatar_url} className="w-full h-full object-cover"/> : (staff.username?.[0] || 'C')}
                       </div>
                       <div><p className="font-bold text-gray-900 text-sm">{staff.username}</p><p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">{staff.role}</p></div>
                    </div>
                 ))}

                 {players.map(player => (
                    <div key={player.user_id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center justify-center font-bold text-sm overflow-hidden">
                             {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover"/> : (player.username?.[0] || 'P')}
                          </div>
                          <div><p className="font-semibold text-gray-900 text-sm">{player.username}</p><p className="text-xs text-gray-500">{player.position || 'Player'}</p></div>
                       </div>
                       <div className="text-right"><span className="font-mono font-bold text-gray-900 text-sm">#{player.jersey_number || '-'}</span></div>
                    </div>
                 ))}
             </div>
           </div>
        </div>
      </div>
    </Layout>
  )
}