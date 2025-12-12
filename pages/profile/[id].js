import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import { User, MapPin, Phone, Shield, Trophy, Star, Send } from 'lucide-react'

export default function PublicProfile() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    // 1. Fetch Profile Data
    const res = await fetch(`/api/profile/${id}`) // You'll need to create this simple GET endpoint or use supabase client directly here for read-only
    // For simplicity in this snippet, let's assume we fetch directly since it's public data
    // In a real app, use an API route to keep logic hidden, but here:
    // ... logic to fetch profile + comments ...
    setLoading(false)
  }
  
  // NOTE: For brevity, I'll mock the fetch logic structure here. 
  // You should create 'pages/api/profile/[id].js' that returns profile + comments.
  
  useEffect(() => {
    if(id) {
       // Placeholder: Fetch logic would go here
       setLoading(false) 
    }
  }, [id])

  const handlePostComment = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/profile/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id, content: newComment })
    })
    if(res.ok) {
       setNewComment('')
       // refresh comments
    }
  }

  if (loading) return <Layout><div className="p-10 text-center">Loading Profile...</div></Layout>
  // Placeholder data for visualization if fetch isn't implemented yet
  const displayProfile = profile || { username: "Player One", role: "player", avatar_url: null, bio: "Top striker.", notable_achievements: "MVP 2024", jersey_number: 10 }

  return (
    <Layout title={`${displayProfile.username} - Profile`}>
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl relative">
        {user?.id === id && (
            <button onClick={() => router.push('/account')} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-all">
                Edit Profile
            </button>
        )}
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-gray-200 px-8 pb-8 mb-8">
        <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 mb-6 gap-6">
           {/* Avatar */}
           <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
             {displayProfile.avatar_url ? (
               <img src={displayProfile.avatar_url} className="h-full w-full object-cover" />
             ) : (
               <div className="h-full w-full bg-gray-100 flex items-center justify-center"><User size={40} className="text-gray-300"/></div>
             )}
           </div>
           
           <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-extrabold text-gray-900">{displayProfile.username}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mt-1">
                 <Shield size={16} /> <span className="capitalize">{displayProfile.role}</span>
                 {displayProfile.jersey_number && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">#{displayProfile.jersey_number}</span>}
              </div>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8">
           {/* Left: Stats/Info */}
           <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><User size={18}/> About</h3>
                 <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Age:</strong> {displayProfile.age || 'N/A'}</p>
                    <p><strong>Location:</strong> {displayProfile.address || 'N/A'}</p>
                    {displayProfile.positions_preferred && <p><strong>Positions:</strong> {displayProfile.positions_preferred}</p>}
                 </div>
              </div>

              {(displayProfile.notable_achievements || displayProfile.previous_teams) && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                     <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2"><Trophy size={18}/> Career</h3>
                     {displayProfile.previous_teams && <p className="text-sm text-yellow-700 mb-2"><strong>Teams:</strong> {displayProfile.previous_teams}</p>}
                     {displayProfile.notable_achievements && <p className="text-sm text-yellow-700"><strong>Achievements:</strong> {displayProfile.notable_achievements}</p>}
                  </div>
              )}
           </div>

           {/* Center/Right: Feed & Comments */}
           <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h3 className="font-bold text-gray-900 mb-4">Wall</h3>
                 
                 {/* Comment Input */}
                 {user && (
                    <form onSubmit={handlePostComment} className="flex gap-3 mb-8">
                       <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {/* Current user avatar */}
                       </div>
                       <div className="flex-grow relative">
                          <input 
                             type="text" 
                             className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                             placeholder={`Write something to ${displayProfile.username}...`}
                             value={newComment}
                             onChange={e => setNewComment(e.target.value)}
                          />
                          <button type="submit" className="absolute right-2 top-1.5 p-1 text-blue-600 hover:bg-blue-100 rounded-full">
                             <Send size={18} />
                          </button>
                       </div>
                    </form>
                 )}

                 {/* Comments List (Mock) */}
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