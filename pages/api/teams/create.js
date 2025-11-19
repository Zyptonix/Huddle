import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { name, sport } = req.body

  if (!name || !sport) {
    return res.status(400).json({ error: 'Name and sport are required' })
  }

  // Generate a simple random join code (e.g., "FC-9X2")
  const randomString = Math.random().toString(36).substring(2, 5).toUpperCase()
  const joinCode = `${name.substring(0, 3).toUpperCase()}-${randomString}`

  const { data, error } = await supabaseServer
    .from('teams')
    .insert([
      {
        name,
        sport,
        coach_id: user.id,
        join_code: joinCode
      }
    ])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(201).json(data)
}