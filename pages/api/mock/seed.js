import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  // This is a dangerous endpoint, so you might want to protect it or only use it locally
  // For now, let's just protect it with a simple query param ?secret=huddle
  if (req.query.secret !== 'huddle') return res.status(403).json({ error: 'Forbidden' })

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Must be logged in to seed data' })

  // 1. Create a Mock Tournament
  const { data: tournament } = await supabase.from('tournaments').insert([
    { 
      name: 'Mock Super Cup 2025', 
      sport: 'football', 
      format: 'knockout', 
      organizer_id: user.id, 
      status: 'active',
      start_date: new Date().toISOString()
    }
  ]).select().single()

  // 2. Create Mock Teams (assigned to current user for ease)
  const teamNames = ['Red Dragons', 'Blue Sharks', 'Green Eagles', 'Yellow Tigers']
  const teams = []

  for (const name of teamNames) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: team } = await supabase.from('teams').insert([
      { name, sport: 'football', coach_id: user.id, join_code: code }
    ]).select().single()
    teams.push(team)
  }

  // 3. Register Teams to Tournament
  for (const team of teams) {
    await supabase.from('tournament_registrations').insert([
      { tournament_id: tournament.id, team_id: team.id, status: 'approved' }
    ])
  }

  return res.status(200).json({ message: 'Seeded!', tournament, teams })
}