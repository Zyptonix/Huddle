import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Find registrations for teams owned by this user
  // We use !inner to enforce the filter on the joined 'teams' table
  const { data, error } = await supabase
    .from('tournament_registrations')
    .select(`
      status,
      tournaments (*),
      teams!inner (name, coach_id)
    `)
    .eq('teams.coach_id', user.id)

  if (error) return res.status(500).json({ error: error.message })

  // Clean up the data structure
  const formatted = data.map(reg => ({
    registration_status: reg.status,
    team_name: reg.teams.name,
    ...reg.tournaments
  }))

  return res.status(200).json(formatted)
}