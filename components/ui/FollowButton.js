import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import Button from './Button'; 

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
      // UPDATED COLORS HERE
      className={`min-w-[100px] transition-colors ${
        isFollowing 
          ? 'bg-gray-500 text-white hover:bg-gray-700 border border-black' 
          : 'bg-blue-600 text-black hover:bg-blue-800 border border-black'
      }`}
    >
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}