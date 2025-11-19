import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Fetch venues owned by the logged-in organizer
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json(data)
}