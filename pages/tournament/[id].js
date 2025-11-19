import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { useAuth } from '../../context/AuthContext'
import { 
  Trophy, Calendar, Shield, Users, Megaphone, MessageSquare, Send, CheckCircle, Edit2, Save, X
} from 'lucide-react'

export default function TournamentPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile } = useAuth()
  
  const [tournament, setTournament] = useState(null)
  const [myTeams, setMyTeams] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form States
  const [selectedTeam, setSelectedTeam] = useState('')
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceContent, setAnnounceContent] = useState('')
  const [commentInputs, setCommentInputs] = useState({})
  
  // Edit States
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    if (id) {
      fetchTournament()
      if (profile?.role === 'coach') fetchMyTeams()
    }
  }, [id, profile])

  const fetchTournament = async () => {
    const res = await fetch(`/api/tournaments/${id}`)
    if (res.ok) {
      const data = await res.json()
      setTournament(data)
      setEditForm({
        name: data.name,
        sport: data.sport,
        format: data.format,
        start_date: data.start_date || '',
        status: data.status
      })
    }
    setLoading(false)
  }

  const fetchMyTeams = async () => {
    const res = await fetch('/api/teams/created') 
    if (res.ok) setMyTeams(await res.json())
  }

  const handleRegister = async () => {
    if (!selectedTeam) return alert('Please select a team')
    const res = await fetch('/api/tournaments/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: id, teamId: selectedTeam })
    })
    if (res.ok) { alert('Team Registered!'); fetchTournament() } 
    else { const data = await res.json(); alert(data.error) }
  }

  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/tournaments/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: id, title: announceTitle, content: announceContent })
    })
    if (res.ok) { setAnnounceTitle(''); setAnnounceContent(''); fetchTournament() }
  }

  const handlePostComment = async (announcementId) => {
    const content = commentInputs[announcementId]
    if (!content) return
    const res = await fetch('/api/tournaments/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcementId, content })
    })
    if (res.ok) { setCommentInputs(prev => ({ ...prev, [announcementId]: '' })); fetchTournament() }
  }

  const handleUpdateTournament = async () => {
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
    if (res.ok) {
      setIsEditing(false)
      fetchTournament()
    } else {
      alert('Failed to update tournament')
    }
  }

  if (loading || !tournament) return <div className="p-10 text-center">Loading Tournament...</div>

  const isOrganizer = user?.id === tournament.organizer_id

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Head><title>{tournament.name} - Huddle</title></Head>

      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-12 shadow-sm">
        <div className="max-w-5xl mx-auto">
           <div className="flex justify-between items-start">
             <div>
               <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
                  <Trophy size={16} /> {tournament.sport} Tournament
               </div>
               
               {isEditing ? (
                 <input 
                   type="text" 
                   className="text-4xl font-extrabold text-gray-900 mb-4 border-b-2 border-blue-500 outline-none w-full"
                   value={editForm.name}
                   onChange={e => setEditForm({...editForm, name: e.target.value})}
                 />
               ) : (
                 <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{tournament.name}</h1>
               )}
               
               <div className="flex flex-wrap gap-6 text-gray-600 items-center">
                 <div className="flex items-center gap-2">
                   <Shield size={18} /> Organizer: <span className="font-semibold text-gray-900">{tournament.organizerName}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Calendar size={18} /> Start: 
                   {isEditing ? (
                     <input 
                       type="date" 
                       className="border rounded p-1 text-sm"
                       value={editForm.start_date}
                       onChange={e => setEditForm({...editForm, start_date: e.target.value})}
                     />
                   ) : (
                     <span className="font-semibold text-gray-900">{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}</span>
                   )}
                 </div>
                 {isEditing && (
                   <select 
                     className="border rounded p-1 text-sm"
                     value={editForm.status}
                     onChange={e => setEditForm({...editForm, status: e.target.value})}
                   >
                     <option value="upcoming">Upcoming</option>
                     <option value="active">Active</option>
                     <option value="completed">Completed</option>
                   </select>
                 )}
               </div>
             </div>

             {isOrganizer && (
               <div>
                 {isEditing ? (
                   <div className="flex gap-2">
                     <button onClick={() => setIsEditing(false)} className="p-2 text-red-600 hover:bg-red-50 rounded"><X size={24} /></button>
                     <button onClick={handleUpdateTournament} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save size={24} /></button>
                   </div>
                 ) : (
                   <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                     <Edit2 size={18} /> Edit
                   </button>
                 )}
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid lg:grid-cols-3 gap-8 mt-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-8">
          {profile?.role === 'coach' && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h3 className="font-bold text-gray-900 mb-4">Register Your Team</h3>
               {myTeams.length > 0 ? (
                 <div className="space-y-3">
                   <select 
                     className="w-full p-2 border rounded-md text-gray-900"
                     value={selectedTeam}
                     onChange={(e) => setSelectedTeam(e.target.value)}
                   >
                     <option value="">Select a team...</option>
                     {myTeams.filter(t => t.sport === tournament.sport).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                   <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium">Join Tournament</button>
                 </div>
               ) : (
                 <p className="text-sm text-red-500">You have no teams created yet.</p>
               )}
             </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600"/> Participating Teams
            </h3>
            {tournament.teams.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No teams have joined yet.</p>
            ) : (
              <ul className="space-y-3">
                {tournament.teams.map(team => (
                  <li key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Link href={`/team/${team.id}`} className="font-medium text-gray-900 hover:underline hover:text-blue-600">
                      {team.name}
                    </Link>
                    {team.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
           {isOrganizer && (
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
               <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Megaphone size={20} /> Post New Announcement</h3>
               <form onSubmit={handlePostAnnouncement} className="space-y-3">
                 <input type="text" placeholder="Title" className="w-full p-2 border rounded text-gray-900" value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} required />
                 <textarea placeholder="Message content..." className="w-full p-2 border rounded h-24 text-gray-900" value={announceContent} onChange={e => setAnnounceContent(e.target.value)} required />
                 <div className="text-right"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Post</button></div>
               </form>
             </div>
           )}

           <div className="space-y-6">
             <h3 className="text-xl font-bold text-gray-900">Tournament Updates</h3>
             {tournament.announcements.length === 0 ? <p className="text-gray-500">No announcements yet.</p> : (
                tournament.announcements.map(ann => (
                  <div key={ann.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-bold text-gray-900">{ann.title}</h4>
                        <span className="text-xs text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{ann.content}</p>
                    </div>
                    <div className="bg-gray-50 p-4">
                      <div className="space-y-3 mb-4">
                        {ann.comments.map(comment => (
                          <div key={comment.id} className="flex gap-3 text-sm">
                            <div className="font-bold text-gray-900 flex-shrink-0">{comment.profiles?.username}:</div>
                            <div className="text-gray-700">{comment.content}</div>
                          </div>
                        ))}
                      </div>
                      {user && (
                        <div className="flex gap-2">
                          <input type="text" placeholder="Write a comment..." className="flex-grow p-2 border rounded-md text-sm text-gray-900" value={commentInputs[ann.id] || ''} onChange={e => setCommentInputs({...commentInputs, [ann.id]: e.target.value})} />
                          <button onClick={() => handlePostComment(ann.id)} className="bg-white border border-gray-300 p-2 rounded-md hover:bg-gray-100 text-blue-600"><Send size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
             )}
           </div>
        </div>
      </div>
    </div>
  )
}