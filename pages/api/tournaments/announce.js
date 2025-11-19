import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { tournamentId, title, content } = req.body

  // 1. Verify user is the organizer (RLS usually handles this, but good to double check)
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('id', tournamentId)
    .eq('organizer_id', user.id)
    .single()

  if (!tournament) return res.status(403).json({ error: 'Only the organizer can post announcements.' })

  // 2. Post
  const { data, error } = await supabase
    .from('announcements')
    .insert([{ tournament_id: tournamentId, title, content }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json(data)
}