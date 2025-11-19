import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query

  // --- GET: Fetch Tournament ---
  if (req.method === 'GET') {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(`*, profiles:organizer_id(username)`)
      .eq('id', id)
      .single()

    if (error || !tournament) return res.status(404).json({ error: 'Tournament not found' })

    // 1. Fetch Teams
    const { data: teams } = await supabase
      .from('tournament_registrations')
      .select(`status, teams(id, name, sport, coach_id)`)
      .eq('tournament_id', id)

    // 2. Fetch Announcements
    const { data: announcements } = await supabase
      .from('announcements')
      .select(`*, comments(id, content, created_at, profiles(username, avatar_url))`)
      .eq('tournament_id', id)
      .order('created_at', { ascending: false })

    // 3. Fetch Matches (The missing part)
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id, 
        start_time, 
        status, 
        team_a_score, 
        team_b_score,
        team_a:team_a_id(name), 
        team_b:team_b_id(name),
        venue:venue_id(name)
      `)
      .eq('tournament_id', id)
      .order('id', { ascending: true })

    const responseData = {
      ...tournament,
      organizerName: tournament.profiles?.username,
      teams: teams.map(t => ({ ...t.teams, status: t.status })),
      announcements: announcements.map(a => ({
        ...a,
        comments: a.comments.sort((x, y) => new Date(x.created_at) - new Date(y.created_at))
      })),
      matches: matches || []
    }
    return res.status(200).json(responseData)
  }

  // --- PUT: Update Tournament ---
  if (req.method === 'PUT') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { name, sport, format, start_date, status } = req.body

    const { data, error } = await supabase
      .from('tournaments')
      .update({ name, sport, format, start_date, status })
      .eq('id', id)
      .eq('organizer_id', user.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}