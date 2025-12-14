import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function CommentSection({ targetId, table = 'profile_comments', foreignKey = 'profile_id', title = 'Fan Wall' }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetId) fetchComments();
  }, [targetId]);

  const fetchComments = async () => {
    try {
      // Fetch comments AND the author's profile info
      const { data, error } = await supabase
        .from(table)
        .select(`
            *,
            author:author_id ( id, username, avatar_url, role )
        `)
        .eq(foreignKey, targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const payload = {
        content: newComment,
        author_id: user.id,
        [foreignKey]: targetId // Dynamic key: profile_id or team_id
      };

      const { error } = await supabase.from(table).insert([payload]);

      if (error) throw error;
      setNewComment('');
      fetchComments(); // Refresh list
    } catch (err) {
      alert('Failed to post comment');
      console.error(err);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    const { error } = await supabase.from(table).delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
        <MessageCircle size={20} className="text-blue-600"/> {title}
      </h3>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a message..."
            className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl text-center mb-6 text-sm text-gray-500">
            Please <Link href="/login" className="text-blue-600 font-bold hover:underline">log in</Link> to leave a message.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
           <p className="text-gray-400 text-sm">Loading comments...</p>
        ) : comments.length === 0 ? (
           <p className="text-gray-400 italic text-sm">No messages yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <Link href={`/profile/${comment.author.id}`}>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    {comment.author?.avatar_url ? (
                        <img src={comment.author.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                            {comment.author?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>
              </Link>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Link href={`/profile/${comment.author.id}`} className="font-bold text-gray-900 hover:text-blue-600 text-sm">
                            {comment.author?.username || 'Unknown User'}
                        </Link>
                        <span className="text-xs text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    {user?.id === comment.author_id && (
                        <button onClick={() => handleDelete(comment.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}