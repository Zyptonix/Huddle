import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(200).json([])

  // Find teams where I am the captain OR a member
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id) 
    
  // Note: If you have a separate 'team_members' table, you would query that too.
  // For now, this assumes you are the owner of the teams you participate in.

  if (error) return res.status(500).json([])
  
  // Return just an array of IDs: [1, 5, 8]
  return res.status(200).json(data.map(t => t.id))
}