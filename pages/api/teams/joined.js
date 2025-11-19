import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Complex Query: Get teams that this user is a member of.
  const { data, error } = await supabaseServer
    .from('team_members')
    .select(`
      joined_at,
      teams (
        id,
        name,
        sport,
        profiles:coach_id (username) 
      )
    `)
    .eq('player_id', user.id)
    .order('joined_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Flatten the structure a bit for the frontend
  const formattedData = data.map(item => ({
    joined_at: item.joined_at,
    ...item.teams,
    coach_name: item.teams.profiles?.username || 'Unknown Coach'
  }))

  return res.status(200).json(formattedData)
}