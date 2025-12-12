import { useState, useEffect } from 'react'
import { Shield, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext' 
import { supabase } from '../../lib/supabaseClient'
import FollowButton from '../ui/FollowButton'

export default function TeamHeader({ team }) {
  const { user } = useAuth()
  const [followerCount, setFollowerCount] = useState(0)

  useEffect(() => {
    if (team?.id) {
      fetchTeamFollowers()
    }
  }, [team?.id])

  const fetchTeamFollowers = async () => {
    const { count } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_team_id', team.id)
    
    setFollowerCount(count || 0)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">{team.name}</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase">
              {team.sport}
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
                <Shield size={18} />
                <span>Coach: <strong>{team.coach?.username || 'Unknown'}</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
                <Users size={18} />
                {/* Count will now update instantly */}
                <span><strong>{followerCount}</strong> Followers</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
            <div className="text-right">
               <span className="text-gray-400 text-sm font-mono block">Join Code</span>
               <span className="text-2xl font-mono font-bold text-gray-800">{team.join_code}</span>
            </div>
            
            <div className="mt-2">
                {/* UPDATED: Added onToggle to refresh stats */}
                <FollowButton 
                    currentUser={user} 
                    targetId={team.id} 
                    targetType="team" 
                    onToggle={() => fetchTeamFollowers()}
                />
            </div>
        </div>
      </div>
    </div>
  )
}