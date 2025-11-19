import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { name, location, capacity } = req.body

  if (!name || !location) {
    return res.status(400).json({ error: 'Name and location are required' })
  }

  const { data, error } = await supabase
    .from('venues')
    .insert([
      {
        name,
        location,
        capacity: capacity || 0,
        organizer_id: user.id
      }
    ])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(201).json(data)
}