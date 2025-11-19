import { useState } from 'react'
import { Megaphone, Send } from 'lucide-react'

export default function AnnouncementFeed({ announcements, tournamentId, isOrganizer, user, onRefresh }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [commentInputs, setCommentInputs] = useState({})

  const handlePostAnnouncement = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/tournaments/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, title, content })
    })
    if (res.ok) {
      setTitle('')
      setContent('')
      onRefresh()
    }
  }

  const handlePostComment = async (announcementId) => {
    const commentContent = commentInputs[announcementId]
    if (!commentContent) return

    const res = await fetch('/api/tournaments/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcementId, content: commentContent })
    })
    if (res.ok) {
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }))
      onRefresh()
    }
  }

  return (
    <div className="space-y-8">
      {isOrganizer && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Megaphone size={20} /> Post New Announcement
          </h3>
          <form onSubmit={handlePostAnnouncement} className="space-y-3">
            <input 
              type="text" placeholder="Title" 
              className="w-full p-2 border rounded text-gray-900" 
              value={title} onChange={e => setTitle(e.target.value)} required 
            />
            <textarea 
              placeholder="Message content..." 
              className="w-full p-2 border rounded h-24 text-gray-900" 
              value={content} onChange={e => setContent(e.target.value)} required 
            />
            <div className="text-right">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Post</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Tournament Updates</h3>
        {announcements.length === 0 ? (
           <p className="text-gray-500">No announcements yet.</p>
        ) : (
           announcements.map(ann => (
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
                     <input 
                       type="text" placeholder="Write a comment..." 
                       className="flex-grow p-2 border rounded-md text-sm text-gray-900" 
                       value={commentInputs[ann.id] || ''} 
                       onChange={e => setCommentInputs({...commentInputs, [ann.id]: e.target.value})} 
                     />
                     <button onClick={() => handlePostComment(ann.id)} className="bg-white border border-gray-300 p-2 rounded-md hover:bg-gray-100 text-blue-600">
                       <Send size={16} />
                     </button>
                   </div>
                 )}
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  )
}