import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // 1. Get all Team IDs the player belongs to
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('player_id', user.id)

  if (!memberships || memberships.length === 0) {
    return res.status(200).json([])
  }

  const teamIds = memberships.map(m => m.team_id)

  // 2. Get all Tournaments those teams are registered in
  const { data, error } = await supabase
    .from('tournament_registrations')
    .select(`
      status,
      tournaments (*),
      teams (name)
    `)
    .in('team_id', teamIds)

  if (error) return res.status(500).json({ error: error.message })

  // Format data
  const formatted = data.map(reg => ({
    ...reg.tournaments,
    registration_status: reg.status,
    your_team: reg.teams.name
  }))

  return res.status(200).json(formatted)
}