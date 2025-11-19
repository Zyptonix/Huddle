import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { tournamentId } = req.body

  // 1. Verify Organizer & Get Approved Teams
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, organizer_id')
    .eq('id', tournamentId)
    .single()

  if (tError || !tournament) return res.status(404).json({ error: 'Tournament not found' })
  if (tournament.organizer_id !== user.id) return res.status(403).json({ error: 'Only the organizer can generate schedules.' })

  // 2. Get Approved Teams
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select('team_id')
    .eq('tournament_id', tournamentId)
    //.eq('status', 'approved') // Uncomment this if you only want approved teams!

  if (!registrations || registrations.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 teams to generate a schedule.' })
  }

  const teams = registrations.map(r => r.team_id)

  // 3. The Round Robin Algorithm
  // This is a simple "All-play-All" generator
  const matchesToInsert = []
  
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchesToInsert.push({
        tournament_id: tournamentId,
        team_a_id: teams[i],
        team_b_id: teams[j],
        status: 'scheduled'
      })
    }
  }

  // 4. Clear existing matches (Optional: Safer to start fresh)
  await supabase.from('matches').delete().eq('tournament_id', tournamentId)

  // 5. Insert new matches
  const { data, error } = await supabase
    .from('matches')
    .insert(matchesToInsert)
    .select()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ message: `Generated ${data.length} matches!`, matches: data })
}