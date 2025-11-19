import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabase = createPagesServerClient({ req, res })
  const { id } = req.query

  // 1. Fetch Tournament Basics
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select(`*, profiles:organizer_id(username)`)
    .eq('id', id)
    .single()

  if (error || !tournament) return res.status(404).json({ error: 'Tournament not found' })

  // 2. Fetch Registered Teams
  const { data: teams } = await supabase
    .from('tournament_registrations')
    .select(`status, teams(id, name, sport, coach_id)`)
    .eq('tournament_id', id)

  // 3. Fetch Announcements & Comments
  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *, 
      comments(
        id, content, created_at, 
        profiles(username, avatar_url)
      )
    `)
    .eq('tournament_id', id)
    .order('created_at', { ascending: false })

  // Organize Data
  const responseData = {
    ...tournament,
    organizerName: tournament.profiles?.username,
    teams: teams.map(t => ({ ...t.teams, status: t.status })),
    announcements: announcements.map(a => ({
      ...a,
      comments: a.comments.sort((x, y) => new Date(x.created_at) - new Date(y.created_at))
    }))
  }

  return res.status(200).json(responseData)
}