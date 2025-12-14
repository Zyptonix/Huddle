import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // 1. Check if the user is actually an organizer
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') {
    return res.status(403).json({ error: 'Only organizers can create tournaments.' })
  }

  // CHANGED: We now destructure 'start_date' to match the frontend update
  const { name, sport, format, start_date } = req.body

  if (!name || !sport || !format) {
    return res.status(400).json({ error: 'Name, sport, and format are required' })
  }

  // 2. Create the tournament
  const { data, error } = await supabaseServer
    .from('tournaments')
    .insert([
      {
        name,
        sport,
        format,
        // CHANGED: No need to rename anymore, it's consistent
        start_date: start_date || null, 
        organizer_id: user.id,
        status: 'upcoming' // Good practice to set a default status
      }
    ])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(201).json(data)
}