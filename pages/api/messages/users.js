import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Get all users except the current user
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .neq('id', user.id)
    .order('username', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json(users)
}