import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import Button from './Button'; 
import { Heart } from 'lucide-react';

export default function FollowButton({ currentUser, targetId, targetType, onToggle }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser && targetId) {
      checkFollowStatus();
    }
  }, [currentUser, targetId]);

  const checkFollowStatus = async () => {
    const column = targetType === 'user' ? 'following_user_id' : 'following_team_id';
    
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq(column, targetId)
      .maybeSingle(); 

    if (data) setIsFollowing(true);
  };

  const handleToggleFollow = async () => {
    if (!currentUser) return; 
    setLoading(true);

    try {
      if (isFollowing) {
        // --- UNFOLLOW ---
        const column = targetType === 'user' ? 'following_user_id' : 'following_team_id';
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq(column, targetId);

        if (error) throw error;
        setIsFollowing(false);
        if (onToggle) onToggle(false); 

      } else {
        // --- FOLLOW ---
        const insertData = {
          follower_id: currentUser.id,
          [targetType === 'user' ? 'following_user_id' : 'following_team_id']: targetId
        };
        const { error } = await supabase.from('follows').insert([insertData]);

        if (error) throw error;
        setIsFollowing(true);
        if (onToggle) onToggle(true); 
      }
    } catch (error) {
      console.error('Error toggling follow:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.id === targetId) return null;

  return (
    <Button 
      onClick={handleToggleFollow} 
      disabled={loading}
      className={`min-w-[100px] py-2 px-4 transition-all text-sm font-semibold rounded-lg flex items-center justify-center gap-2 ${
        isFollowing 
          ? 'bg-gray-400 text-white hover:bg-gray-600 border border-transparent' 
          : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200 border border-transparent'
      }`}
    >
      <Heart size={16} className={isFollowing ? 'text-gray-600' : 'fill-red-600 text-red-600'} />
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}