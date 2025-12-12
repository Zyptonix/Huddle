import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      // Fetch members and join with the 'profiles' table to get names/avatars
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role,
          position,
          status,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('team_id', id)
        .eq('status', 'active') // Only show active members

      if (error) throw error

      // Flatten the data for the frontend
      const formattedMembers = data.map(member => ({
        user_id: member.user_id,
        role: member.role,
        position: member.position,
        username: member.profiles?.username || 'Unknown Player',
        avatar_url: member.profiles?.avatar_url
      }))

      return res.status(200).json(formattedMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
      return res.status(500).json({ error: error.message })
    }
  }
}