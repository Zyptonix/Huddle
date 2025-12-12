import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import { User, Shield, Trophy, Send, MessageSquare, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import FollowButton from '../../components/ui/FollowButton'

export default function PublicProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Follow Stats
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProfileData()
      fetchFollowStats()
    }
  }, [id])

  const fetchFollowStats = async () => {
    // 1. Get count of people following THIS profile (id)
    const { count: followers } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_user_id', id)

    // 2. Get count of people/teams THIS profile is following
    const { count: following } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', id)

    setFollowerCount(followers || 0)
    setFollowingCount(following || 0)
  }

  const fetchProfileData = async () => {
    try {
      // Fetch user details from the 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error.message)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    // Logic to post comment...
    console.log("Posting comment:", newComment)
    setNewComment('')
  }

  // --- MESSAGE LOGIC ---
  const handleMessage = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.id === id) {
        alert("You cannot message yourself.");
        return;
    }

    try {
      setActionLoading(true);

      // STEP 1: CHECK IF CONVERSATION EXISTS (User 1 = Me)
      const { data: existingAsUser1 } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user.id)
        .eq('user2_id', id)
        .maybeSingle();

      if (existingAsUser1) {
        router.push({ pathname: '/messages', query: { conversationId: existingAsUser1.id } });
        return;
      }

      // STEP 2: CHECK IF CONVERSATION EXISTS (User 2 = Me)
      const { data: existingAsUser2 } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', id)
        .eq('user2_id', user.id)
        .maybeSingle();

      if (existingAsUser2) {
        router.push({ pathname: '/messages', query: { conversationId: existingAsUser2.id } });
        return;
      }

      // STEP 3: CREATE NEW CONVERSATION
      const { data: newConvo, error: createError } = await supabase
        .from('conversations')
        .insert([{ user1_id: user.id, user2_id: id }])
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError.message);
        alert("Could not start chat. Please try again.");
        setActionLoading(false);
        return;
      }

      // STEP 4: OPEN THE NEW CHAT
      router.push({ pathname: '/messages', query: { conversationId: newConvo.id } });

    } catch (error) {
      console.error("Unexpected error in message handler:", error);
      setActionLoading(false);
    }
  }

  if (loading) return <Layout><div className="p-10 text-center">Loading Profile...</div></Layout>

  // If loading finished but no profile found
  if (!profile) return (
    <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <User size={64} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700">User not found</h2>
            <p className="text-gray-500">The profile you are looking for does not exist.</p>
        </div>
    </Layout>
  )

  return (
    <Layout title={`${profile.username || 'User'} - Profile`}>
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl relative">
        
        {/* Top Right Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {user?.id === id ? (
                <button onClick={() => router.push('/account')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-all border border-white/50">
                    Edit Profile
                </button>
            ) : (
                <>
                    <FollowButton 
                        currentUser={user} 
                        targetId={id} 
                        targetType="user" 
                        onToggle={() => fetchFollowStats()} 
                    />
                    
                    <button 
                        onClick={handleMessage}
                        disabled={actionLoading}
                        className="bg-white text-gray-900 hover:bg-gray-100 border border-black px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all min-w-[100px] justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <MessageSquare size={16} />
                        {actionLoading ? 'Loading...' : 'Message'}
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-gray-200 px-8 pb-8 mb-8">
        <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 mb-6 gap-6">
           {/* Avatar */}
           <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
             {profile.avatar_url ? (
               <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
             ) : (
               <div className="h-full w-full bg-gray-100 flex items-center justify-center"><User size={40} className="text-gray-300"/></div>
             )}
           </div>
           
           <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-extrabold text-gray-900">{profile.username || 'Unknown User'}</h1>
              
              <div className="flex flex-col md:flex-row gap-4 mt-2">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                     <Shield size={16} /> <span className="capitalize">{profile.role || 'Member'}</span>
                     {profile.jersey_number && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">#{profile.jersey_number}</span>}
                  </div>

                  {/* Stats Display */}
                  <div className="flex items-center gap-4 text-sm">
                      <div className="flex gap-1 text-gray-600">
                          <span className="font-bold text-gray-900">{followerCount}</span> Followers
                      </div>
                      <div className="flex gap-1 text-gray-600">
                          <span className="font-bold text-gray-900">{followingCount}</span> Following
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8">
           {/* Left Column: Info */}
           <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><User size={18}/> About</h3>
                 <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Age:</strong> {profile.age || 'N/A'}</p>
                    <p className="flex items-center gap-1">
                        <MapPin size={14} /> 
                        {profile.address || 'Location Hidden'}
                    </p>
                    {profile.positions_preferred && (
                        <div>
                            <strong className="block mb-1">Positions:</strong>
                            <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{profile.positions_preferred}</span>
                        </div>
                    )}
                 </div>
              </div>

               {(profile.notable_achievements || profile.previous_teams) && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2"><Trophy size={18}/> Career</h3>
                      {profile.previous_teams && (
                          <div className="mb-2">
                              <span className="text-xs font-bold text-yellow-800 uppercase">Teams</span>
                              <p className="text-sm text-yellow-700">{profile.previous_teams}</p>
                          </div>
                      )}
                      {profile.notable_achievements && (
                          <div>
                              <span className="text-xs font-bold text-yellow-800 uppercase">Achievements</span>
                              <p className="text-sm text-yellow-700">{profile.notable_achievements}</p>
                          </div>
                      )}
                  </div>
              )}
           </div>

           {/* Right Column: Wall / Comments */}
           <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h3 className="font-bold text-gray-900 mb-4">Wall</h3>
                 {user && (
                    <form onSubmit={handlePostComment} className="flex gap-3 mb-8">
                       <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {/* Ideally fetch current user avatar here too, using placeholder for now */}
                          <div className="h-full w-full bg-gray-300 flex items-center justify-center"><User size={20} className="text-white"/></div>
                       </div>
                       <div className="flex-grow relative">
                          <input 
                             type="text" 
                             className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                             placeholder={`Write something to ${profile.username}...`}
                             value={newComment}
                             onChange={e => setNewComment(e.target.value)}
                          />
                          <button type="submit" className="absolute right-2 top-1.5 p-1 text-blue-600 hover:bg-blue-100 rounded-full">
                             <Send size={18} />
                          </button>
                       </div>
                    </form>
                 )}
                 {/* Comments List would go here */}
                 <div className="space-y-4">
                    {comments.length === 0 ? <p className="text-gray-400 italic text-center">No comments yet.</p> : comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                           {/* Render Comment */}
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