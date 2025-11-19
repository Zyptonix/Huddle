import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { tournamentId, teamId } = req.body

  if (!tournamentId || !teamId) {
    return res.status(400).json({ error: 'Missing tournament or team ID' })
  }

  // 1. Verify user owns the team (Security Check)
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('coach_id', user.id)
    .single()

  if (!team) return res.status(403).json({ error: 'You are not the coach of this team.' })

  // 2. Register
  const { data, error } = await supabase
    .from('tournament_registrations')
    .insert([{ tournament_id: tournamentId, team_id: teamId }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
}