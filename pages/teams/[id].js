import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  Users, Shield, Trophy, UserPlus, Edit3, X, 
  Calendar, Activity, LogOut, Check, Ban, Upload, Copy, Lock,
  BarChart2, ChevronRight, Layout as LayoutIcon, TrendingUp, MapPin, Grid
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/ui/Layout'
import Loading from '../../components/ui/Loading'
import TeamSchedule from '@/components/teams/TeamSchedule'
import TeamStats from '@/components/teams/TeamStats'
import FollowButton from '@/components/ui/FollowButton'
import CommentSection from '../../components/ui/CommentSection' // <--- IMPORTED HERE

export default function TeamProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  
  // Data State
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([]
  const [followerCount, setFollowerCount] = useState(0)
  const [topScorers, setTopScorers] = useState([])
  const [participatedTournaments, setParticipatedTournaments] = useState([])
  const [currentUserProfile, setCurrentUserProfile] = useState(null) 
  const [loading, setLoading] = useState(true)

  // UI State
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'matches', 'stats'
  const [isEditing, setIsEditing] = useState(false)

  // Edit Form State
  const [editForm, setEditForm] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // --- ROLES & STATUS LOGIC ---
  const isOwner = team?.owner_id === user?.id
  const myMembership = members.find(m => m.user_id === user?.id)
  
  const activeMembers = members.filter(m => m.status === 'active')
  const pendingRequests = members.filter(m => m.status === 'pending')

  const isActiveMember = myMembership?.status === 'active'
  const isPending = myMembership?.status === 'pending'  
  const isGlobalCoachOrOrganizer = currentUserProfile?.role === 'coach' || currentUserProfile?.role === 'organizer'

  useEffect(() => {
    if (id && user) fetchData()
  }, [id, user])

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // A. Get Current User Profile
      const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setCurrentUserProfile(myProfile)

      // B. Fetch Team Details
      const { data: teamData, error: teamError } = await supabase.from('teams').select('*').eq('id', id).single()
      
      if (teamError || !teamData) {
        setTeam(null); setLoading(false); return
      }

      // 3. Fetch Owner Data
      const { data: ownerData } = await supabase.from('profiles').select('username, avatar_url, positions_preferred').eq('id', teamData.owner_id).single()
      
      const ownerPosition = Array.isArray(ownerData?.positions_preferred) 
        ? ownerData.positions_preferred.join(', ') 
        : ownerData?.positions_preferred || 'Manager';

      const completeTeam = { ...teamData, owner: { ...ownerData, position: ownerPosition } }
      setTeam(completeTeam)
      setEditForm({ ...completeTeam, is_recruiting: completeTeam.is_recruiting || false })

      // 4. Fetch Members
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`*, profiles:user_id (username, positions_preferred, avatar_url, jersey_number)`)
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

      // 5. Fetch Follower Count
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_team_id', id)
      
      setFollowerCount(count || 0)
      

      // D. Fetch Tournament History
      const { data: tourneyData } = await supabase
        .from('tournament_teams')
        .select(`status, tournaments (id, name, start_date, venue)`)
        .eq('team_id', id)

      const formattedTourneys = tourneyData ? tourneyData.map(t => ({
          ...t.tournaments,
          city: t.tournaments?.venue,
          registration_status: t.status
      })) : []
      setParticipatedTournaments(formattedTourneys)

      // E. STATS & SCORERS LOGIC
      const { data: allEvents } = await supabase.from('match_events').select('*').eq('team_id', id)

      if (allEvents) {
        const goalEvents = allEvents.filter(e => e.type && e.type.toLowerCase() === 'goal')
        const goalCounts = {}
        
        goalEvents.forEach(event => {
            if(event.player_id) {
                goalCounts[event.player_id] = (goalCounts[event.player_id] || 0) + 1
            } else if (event.player_name) {
                const matchedMember = formattedMembers.find(m => 
                    m.username && m.username.toLowerCase() === event.player_name.toLowerCase()
                )
                if (matchedMember) {
                    goalCounts[matchedMember.user_id] = (goalCounts[matchedMember.user_id] || 0) + 1
                }
            }
        })

        const scorersList = formattedMembers
            .filter(m => m.status === 'active')
            .map(m => ({ ...m, goals: goalCounts[m.user_id] || 0 }))
            .filter(m => m.goals > 0)
            .sort((a, b) => b.goals - a.goals)

        setTopScorers(scorersList)
      }
      
    } catch (e) {
      console.error("Fetch Error:", e)
    } finally {
      setLoading(false)
    }
  }


  // --- ACTIONS ---
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
    } catch (error) { alert(error.message) }
  }

  const handleManageRequest = async (memberRecordId, action) => {
    try {
      await fetch('/api/teams/handle-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_record_id: memberRecordId, action })
      })
      fetchData() 
    } catch (error) { console.error(error) }
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
        const fileName = `${team.id}/${Date.now()}.${logoFile.name.split('.').pop()}`
        await supabase.storage.from('team-logos').upload(fileName, logoFile, { upsert: true })
        const { data } = supabase.storage.from('team-logos').getPublicUrl(fileName)
        finalLogoUrl = data.publicUrl
      }
      const { error } = await supabase.from('teams').update({
          name: editForm.name, description: editForm.description,
          sport: editForm.sport, logo_url: finalLogoUrl,
          is_recruiting: editForm.is_recruiting 
        }).eq('id', id)
      if (error) throw error
      const updatedTeam = { ...team, ...editForm, logo_url: finalLogoUrl }
      setTeam(updatedTeam); setEditForm(updatedTeam); setIsEditing(false)
      alert("Team updated!")
    } catch (error) { alert("Error: " + error.message) } finally { setUploading(false) }
  }

  const copyJoinCode = () => {
    if (team?.join_code) { navigator.clipboard.writeText(team.join_code); alert("Join code copied!"); }
  }

  // Handle immediate UI update when following/unfollowing
  const handleFollowToggle = (isNowFollowing) => {
    setFollowerCount(prev => isNowFollowing ? prev + 1 : prev - 1)
  }

  if (loading) return <Loading />
  if (!team) return <Layout><div className="p-10 text-center">Team not found</div></Layout>

  // Roster Calculations
  let coaches = activeMembers.filter(m => m.role === 'coach' || m.role === 'owner')
  if (!coaches.find(m => m.user_id === team.owner_id) && team.owner) {
    coaches.unshift({ user_id: team.owner_id, username: team.owner.username, role: 'owner', avatar_url: team.owner.avatar_url })
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
          
          <div className="px-8 pb-6">
             <div className="flex flex-col md:flex-row items-end -mt-16 gap-6">
                {/* Logo */}
                <div className="w-36 h-36 bg-white rounded-2xl shadow-xl p-2 flex items-center justify-center relative z-10">
                   <div className="w-full h-full bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
                      {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Shield size={64} className="text-gray-300" />}
                   </div>
                </div>

                {/* Team Info */}
                <div className="flex-1 mb-2">
                   <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-4xl font-black text-gray-900 tracking-tight">{team.name}</h1>
                      <div className="hidden md:flex gap-1 ml-4">
                        {[1,1,0,1,1].map((r, i) => (
                            <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${r===1 ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {r===1 ? 'W' : 'L'}
                            </span>
                        ))}
                      </div>
                   </div>
                   <h1 className="text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
                   
                   {/* STATS ROW WITH FOLLOWER COUNT */}
                   <p className="text-gray-500 text-sm flex items-center gap-6 font-medium">
                      <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-400"/> {activeMembers.length} Members</span>
                      <span className="flex items-center gap-1.5"><Trophy size={16} className="text-yellow-500"/> {team.wins || 0} Wins</span>
                      <span className="flex items-center gap-1.5"><Heart size={16} className="text-purple-500 fill-purple-500"/> {followerCount} Followers</span>
                   </p>
                   
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
                <div className="mt-4 md:mt-14 flex flex-col md:flex-row gap-3 items-center">
                   
                   <FollowButton 
                        currentUser={user} 
                        targetId={team.id} 
                        targetType="team" 
                        onToggle={handleFollowToggle}
                   />

                   {isOwner ? (
                      <button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
                         <Edit3 size={18} /> Manage Club
                      </button>
                   ) : isActiveMember ? (
                      <button onClick={handleLeave} className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                         <LogOut size={18} /> Leave Club
                      </button>
                   ) : isPending ? (
                      <button disabled className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
                         <Activity size={18} /> Pending...
                      </button>
                   ) : (
                      (!isGlobalCoachOrOrganizer && team.is_recruiting) && (
                          <button onClick={handleRequestJoin} className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-transform hover:scale-105">
                             Request to Join
                          </button>
                      )
                   )}
                </div>
             </div>

             {/* Quick Stats Bar */}
             <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col">
                   <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Total Members</span>
                   <span className="text-2xl font-black text-gray-800">{activeMembers.length}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Season Wins</span>
                   <span className="text-2xl font-black text-emerald-600">{team.wins || 0}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Recruiting</span>
                   <span className={`text-lg font-bold flex items-center gap-1 mt-1 ${team.is_recruiting ? 'text-blue-600' : 'text-gray-500'}`}>
                      {team.is_recruiting ? <><UserPlus size={16}/> Active</> : <><Lock size={16}/> Closed</>}
                   </span>
                </div>
                {isOwner && team.join_code && (
                    <div onClick={copyJoinCode} className="flex flex-col cursor-pointer group">
                        <span className="text-xs uppercase font-bold text-gray-400 tracking-wider group-hover:text-indigo-600 transition-colors">Team Code</span>
                        <span className="text-lg font-mono font-bold text-gray-800 flex items-center gap-2">
                            {team.join_code} <Copy size={14} className="text-gray-300 group-hover:text-indigo-600"/>
                        </span>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* === TABS NAVIGATION === */}
        <div className="flex justify-center">
            <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm inline-flex gap-2">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Grid size={16}/> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('matches')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        activeTab === 'matches' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Calendar size={16}/> Matches & Lineups
                </button>
                <button 
                    onClick={() => setActiveTab('stats')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        activeTab === 'stats' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <BarChart2 size={16}/> Stats Lab
                </button>
            </div>
        </div>

        {/* === TAB CONTENT === */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Col: Info & Admin */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield size={18} className="text-slate-400"/> Club Identity
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                {team.description || "The management has not provided a description for this club yet."}
                            </p>
                            <div className="flex gap-2">
                                <span className={`${sportBg} ${sportColor} text-[10px] font-bold px-3 py-1 rounded-full uppercase`}>{team.sport}</span>
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Dhaka, BD</span>
                            </div>
                        </div>

                        {/* Pending Requests */}
                        {isOwner && pendingRequests.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm">
                                <h4 className="font-bold text-amber-900 mb-3 flex items-center justify-between">
                                    <span>Pending Approvals</span>
                                    <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                                </h4>
                                <div className="space-y-3">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="bg-white p-3 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    {req.avatar_url ? <img src={req.avatar_url} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full font-bold text-xs text-gray-500">{req.username[0]}</span>}
                                                </div>
                                                <span className="font-bold text-sm text-gray-800">{req.username}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleManageRequest(req.id, 'deny')} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><X size={16}/></button>
                                                <button onClick={() => handleManageRequest(req.id, 'accept')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded"><Check size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Roster (Spans 2 cols) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900">Active Roster</h3>
                                <span className="text-xs font-bold text-gray-500">{coaches.length + players.length} Active</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {coaches.map(c => (
                                    <div key={c.user_id} className="p-4 flex items-center gap-3 bg-slate-50/50">
                                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                            {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-200"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">{c.username}</p>
                                            <p className="text-[10px] font-bold uppercase text-slate-500">{c.role}</p>
                                        </div>
                                    </div>
                                ))}
                                {players.map(p => (
                                    <div key={p.user_id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-200"/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{p.username}</p>
                                                <p className="text-xs text-gray-500">{p.position || 'Athlete'}</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-gray-300 text-lg">#{p.jersey_number || '00'}</span>
                                    </div>
                                ))}
                                {players.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Roster is currently empty.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. MATCHES TAB */}
            {activeTab === 'matches' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                    <TeamSchedule teamId={id} isOwner={isOwner || isGlobalCoachOrOrganizer} />
                </div>
            )}

            {/* 3. STATS TAB */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                    {/* Main Charts */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Season Analytics</h3>
                        <TeamStats teamId={id} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Top Scorers */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Top Scorers</h3>
                            {topScorers.length > 0 ? (
                                <div className="space-y-3">
                                    {topScorers.map((scorer, i) => (
                                        <div key={scorer.user_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-gray-400 font-bold w-4 text-center">{i+1}</span>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    {scorer.avatar_url ? <img src={scorer.avatar_url} className="w-full h-full object-cover"/> : null}
                                                </div>
                                                <span className="font-bold text-gray-700 text-sm">{scorer.username}</span>
                                            </div>
                                            <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">
                                                {scorer.goals} Goals
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <Trophy size={32} className="mb-2 opacity-30"/>
                                    <span className="text-sm">No goals recorded yet</span>
                                </div>
                            )}
                        </div>

                        {/* Tournament History */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={18} className="text-red-500"/> Tournaments</h3>
                            {participatedTournaments.length > 0 ? (
                                <div className="space-y-3">
                                    {participatedTournaments.map((t) => (
                                        <div key={t.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.city || 'TBD'}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                                                t.registration_status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                t.registration_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {t.registration_status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <MapPin size={32} className="mb-2 opacity-30"/>
                                    <span className="text-sm">No tournament history</span>
                                </div>
                            )}
                        </div>
                    </div>
                 ))}
             </div>

             {/* --- COMMENT SECTION ADDED HERE --- */}
             <CommentSection 
                targetId={id} 
                table="team_comments" 
                foreignKey="team_id" 
                title="Fan Wall" 
            />

           </div>
        </div>

        {/* === EDIT MODAL (Global) === */}
        {isEditing && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border p-2 rounded-lg" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-1">Description</label><textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border p-2 rounded-lg h-24" /></div>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div><span className="block text-sm font-bold text-blue-900">Recruiting</span><span className="text-xs text-blue-700">Allow players to join?</span></div>
                            <input type="checkbox" checked={editForm.is_recruiting} onChange={(e) => setEditForm({...editForm, is_recruiting: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={uploading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">{uploading ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </Layout>
  )
}