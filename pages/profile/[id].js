import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import { User, Shield, MessageSquare, MapPin, Award, Calendar, Shirt, Briefcase, Clipboard, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import FollowButton from '../../components/ui/FollowButton'
import PlayerStatsDashboard from '../../components/dashboards/PlayerStatsDashboard'
import CommentSection from '../../components/ui/CommentSection' // <--- IMPORTED HERE

export default function PublicProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProfileData()
      fetchFollowStats()
    }
  }, [id])

  const fetchFollowStats = async () => {
    const { count: followers } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_user_id', id)
    const { count: following } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id)
    setFollowerCount(followers || 0)
    setFollowingCount(following || 0)
  }

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
      if (!error) setProfile(data)
    } catch (err) { console.error(err) } 
    finally { setLoading(false) }
  }

  const handleMessage = async () => {
    if (!user) return router.push('/login');
    try {
      const res = await fetch('/api/messages/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: id })
      });
      const data = await res.json();
      router.push({ pathname: '/messages', query: { conversationId: data.id } });
    } catch (error) { alert("Could not open chat."); }
  }

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></Layout>

  if (!profile) return <Layout><div className="p-10 text-center">User not found</div></Layout>

  // --- ROLE LOGIC ---
  const role = (profile.role || 'fan').toLowerCase();
  const isPlayer = role === 'player';
  const isCoach = role === 'coach';
  const isOrganizer = role === 'organizer';

  // Dynamic Labels
  const labels = {
    historyTitle: isCoach ? 'Coaching History' : isOrganizer ? 'Events Organized' : 'Career Journey',
    historyItem: isCoach ? 'Managed' : isOrganizer ? 'Hosted' : 'Former Team',
    achievements: isCoach ? 'Philosophy & Certs' : isOrganizer ? 'Organization Details' : 'Achievements',
    ageLabel: isCoach ? 'Experience (Yrs)' : 'Age'
  };

  return (
    <Layout title={`${profile.username} - ${role.charAt(0).toUpperCase() + role.slice(1)} Profile`}>
      {/* --- HERO HEADER --- */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${isCoach ? 'from-orange-500 via-red-500' : 'from-blue-500 via-purple-500'} to-transparent`}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
            
            {/* Avatar */}
            <div className="relative group">
              <div className="h-40 w-40 md:h-48 md:w-48 rounded-2xl border-4 border-white/10 bg-gray-800 shadow-2xl overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                  <User size={64} className="text-gray-600"/>
                )}
              </div>
            </div>

            {/* Name & Role Info */}
            <div className="flex-grow text-center md:text-left z-10">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-4 mb-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic">{profile.username}</h1>
                
                {isPlayer && profile.jersey_number && (
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 opacity-80">
                    #{profile.jersey_number}
                  </span>
                )}
                {isCoach && (
                   <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <Clipboard size={16} /> Head Coach
                   </span>
                )}
                {isOrganizer && (
                   <span className="bg-purple-500/20 text-purple-300 border border-purple-500/50 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <Megaphone size={16} /> Organizer
                   </span>
                )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-300 text-sm font-medium mb-6">
                 {profile.sport && (
                   <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                     <Shield size={14} className="text-blue-400"/> {profile.sport}
                   </span>
                 )}
                 {isPlayer && profile.positions_preferred && (
                   <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                     <Shirt size={14} className="text-purple-400"/> {profile.positions_preferred}
                   </span>
                 )}
                 <span className="flex items-center gap-1">
                   <MapPin size={14} /> {profile.address || 'Unknown Location'}
                 </span>
              </div>

              <div className="flex gap-4">
                 <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-white">{followerCount}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Followers</div>
                 </div>
                 <div className="w-px bg-gray-700 h-10"></div>
                 <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-white">{followingCount}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Following</div>
                 </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 z-10">
                {user?.id !== id ? (
                    <>
                        <FollowButton currentUser={user} targetId={id} targetType="user" onToggle={fetchFollowStats} />
                        <button onClick={handleMessage} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 p-3 rounded-xl transition-all">
                            <MessageSquare size={20} />
                        </button>
                    </>
                ) : (
                    <button onClick={() => router.push('/account')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">
                        Edit Profile
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Details */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                        {isCoach ? 'Coach Details' : 'Personal Details'}
                    </h3>
                    <div className="space-y-4">
                        <DetailRow label={labels.ageLabel} value={profile.age || 'N/A'} />
                        {isPlayer && <DetailRow label="Height" value={profile.height || 'N/A'} />}
                        <DetailRow label="Role" value={role.toUpperCase()} />
                        <DetailRow label="Joined" value={new Date(profile.created_at).toLocaleDateString()} />
                    </div>
                </div>

                <div className={`rounded-2xl border p-6 ${isCoach ? 'bg-orange-50 border-orange-100' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isCoach ? 'text-orange-800' : 'text-yellow-800'}`}>
                        {isCoach ? <Briefcase size={18}/> : <Award size={18}/>} 
                        {labels.achievements}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {profile.notable_achievements || `No ${labels.achievements.toLowerCase()} listed.`}
                    </p>
                </div>
            </div>

            {/* RIGHT COLUMN: Stats & History & COMMENTS */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. STATS (Players Only) */}
                {isPlayer && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <h2 className="font-black text-xl text-gray-800 flex items-center gap-2">
                                <ActivityIcon /> Live Season Stats
                            </h2>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">ACTIVE</span>
                        </div>
                        <div className="p-6">
                            <PlayerStatsDashboard playerId={id} />
                        </div>
                    </div>
                )}

                {/* 2. HISTORY */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                        <Calendar size={20} className={isCoach ? "text-orange-600" : "text-blue-600"}/> 
                        {labels.historyTitle}
                    </h3>
                    {profile.previous_teams ? (
                        <div className="space-y-0">
                            {profile.previous_teams.split(',').map((team, index) => (
                                <div key={index} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full border-2 transition-colors z-10 ${
                                            isCoach ? 'bg-orange-200 border-orange-600 group-hover:bg-orange-600' : 'bg-blue-200 border-blue-600 group-hover:bg-blue-600'
                                        }`}></div>
                                        {index !== profile.previous_teams.split(',').length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-200 -my-1"></div>
                                        )}
                                    </div>
                                    <div className="pb-8 -mt-1.5">
                                        <p className="font-bold text-gray-800 text-lg">{team.trim()}</p>
                                        <p className="text-sm text-gray-500">{labels.historyItem}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-400 italic">No history added yet.</p>
                        </div>
                    )}
                </div>

                {/* 3. COMMENTS SECTION (New!) */}
                <CommentSection 
                    targetId={id} 
                    table="profile_comments" 
                    foreignKey="profile_id" 
                    title={isCoach ? "Coach's Guestbook" : "Fan Wall"} 
                />

            </div>
        </div>
      </div>
    </Layout>
  )
}

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className="font-semibold text-gray-900 text-sm">{value}</span>
        </div>
    )
}

function ActivityIcon() {
    return (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    )
}